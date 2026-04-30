import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const root = new URL("../", import.meta.url);
const defaultPort = 28492;
const styleId = "codex-cobalt2-runtime-markdown-overrides";

const args = new Map();
const flags = new Set();
for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];
  if (arg.startsWith("--") && arg.includes("=")) {
    const [key, ...rest] = arg.slice(2).split("=");
    args.set(key, rest.join("="));
  } else if (arg.startsWith("--")) {
    const key = arg.slice(2);
    const next = process.argv[index + 1];
    if (next && !next.startsWith("--")) {
      args.set(key, next);
      index += 1;
    } else {
      flags.add(key);
    }
  }
}

const host = args.get("host") ?? process.env.CODEX_COBALT2_DEBUG_HOST ?? "127.0.0.1";
const port = Number(args.get("port") ?? process.env.CODEX_COBALT2_DEBUG_PORT ?? defaultPort);
const intervalMs = Number(args.get("interval") ?? 2000);
const timeoutMs = Number(args.get("timeout") ?? 2500);
const watch = flags.has("watch");
const verbose = flags.has("verbose");
const cssPath = args.get("css")
  ? new URL(args.get("css"), `file://${process.cwd()}/`)
  : new URL("overrides/cobalt2-markdown-overrides.css", root);

if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  console.error(`Invalid remote debugging port: ${port}`);
  process.exit(1);
}

const css = await readFile(cssPath, "utf8");
const runtimeVersion = createHash("sha256").update(css).digest("hex").slice(0, 16);
const injectionSource = makeInjectionSource(css);
let lastWatchSummary = null;

if (flags.has("dry-run")) {
  console.log(`Runtime CSS injector dry run`);
  console.log(`Endpoint: http://${host}:${port}`);
  console.log(`CSS: ${cssPath.pathname}`);
  console.log(`CSS bytes: ${Buffer.byteLength(css)}`);
  console.log(`Injection bytes: ${Buffer.byteLength(injectionSource)}`);
  process.exit(0);
}

async function main() {
  if (watch) {
    console.log(`Watching Codex runtime targets on http://${host}:${port}`);
    console.log(`CSS: ${cssPath.pathname}`);
    console.log("Stop with Ctrl+C. Restarting Codex removes the runtime CSS.");
    while (true) {
      await injectAllTargets().catch(error => {
        console.error(error.message);
      });
      await sleep(intervalMs);
    }
  }

  await injectAllTargets();
}

async function injectAllTargets() {
  const targets = await getTargets();
  const injectableTargets = targets.filter(target =>
    target.webSocketDebuggerUrl &&
    ["page", "webview", "iframe"].includes(target.type)
  );

  if (injectableTargets.length === 0) {
    throw new Error(
      `No debuggable Codex page targets found at http://${host}:${port}. Launch Codex with --remote-debugging-port=${port}.`
    );
  }

  const results = [];
  for (const target of injectableTargets) {
    results.push(await injectTarget(target).catch(error => ({
      target,
      ok: false,
      error: error.message
    })));
  }

  const applied = results.filter(result => result.ok);
  const failed = results.filter(result => !result.ok);
  const appliedRoots = applied.reduce((sum, result) => sum + Number(result.roots ?? 0), 0);

  const summary = `Injected runtime CSS into ${applied.length}/${injectableTargets.length} target(s), ${appliedRoots} root(s).`;
  if (watch && failed.length === 0 && !verbose) {
    if (summary !== lastWatchSummary) {
      console.log(summary);
      lastWatchSummary = summary;
    }
  } else if (failed.length > 0 || verbose) {
    lastWatchSummary = summary;
    console.log(summary);
    for (const result of results) {
      const title = result.target.title || result.target.url || result.target.id;
      if (result.ok) {
        console.log(`  ok   ${result.target.type ?? "target"} ${title} roots=${result.roots ?? 0}`);
      } else {
        console.log(`  fail ${result.target.type ?? "target"} ${title} ${result.error}`);
      }
    }
  } else if (!watch) {
    console.log(summary);
  }
}

async function getTargets() {
  const response = await fetch(`http://${host}:${port}/json/list`, {
    signal: AbortSignal.timeout(timeoutMs)
  }).catch(error => {
    throw new Error(
      `Cannot reach Codex remote debugging endpoint on http://${host}:${port}: ${error.message}`
    );
  });

  if (!response.ok) {
    throw new Error(`Remote debugging endpoint returned ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

async function injectTarget(target) {
  const client = await connectCdp(target.webSocketDebuggerUrl);
  try {
    await client.call("Runtime.enable").catch(() => {});
    await client.call("Page.enable").catch(() => {});
    await client.call("Page.addScriptToEvaluateOnNewDocument", {
      source: injectionSource
    }).catch(() => {});
    const result = await client.call("Runtime.evaluate", {
      expression: injectionSource,
      awaitPromise: false,
      returnByValue: true,
      timeout: timeoutMs
    });

    const value = result?.result?.value;
    return {
      target,
      ok: value?.status === "applied" || value?.status === "skipped",
      status: value?.status,
      roots: value?.roots ?? 0
    };
  } finally {
    client.close();
  }
}

function connectCdp(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const pending = new Map();
    let nextId = 1;
    const openTimer = setTimeout(() => {
      reject(new Error(`Timed out connecting to ${wsUrl}`));
      ws.close();
    }, timeoutMs);

    ws.addEventListener("open", () => {
      clearTimeout(openTimer);
      resolve({
        call(method, params = {}) {
          const id = nextId;
          nextId += 1;
          return new Promise((resolveCall, rejectCall) => {
            const timer = setTimeout(() => {
              pending.delete(id);
              rejectCall(new Error(`${method} timed out`));
            }, timeoutMs);
            pending.set(id, { method, resolve: resolveCall, reject: rejectCall, timer });
            ws.send(JSON.stringify({ id, method, params }));
          });
        },
        close() {
          ws.close();
        }
      });
    });

    ws.addEventListener("message", async event => {
      let message;
      try {
        message = JSON.parse(await webSocketMessageText(event.data));
      } catch {
        return;
      }
      if (!message.id || !pending.has(message.id)) return;
      const request = pending.get(message.id);
      pending.delete(message.id);
      clearTimeout(request.timer);
      if (message.error) {
        request.reject(new Error(`${request.method}: ${message.error.message}`));
      } else {
        request.resolve(message.result);
      }
    });

    ws.addEventListener("error", () => {
      reject(new Error(`WebSocket failed for ${wsUrl}`));
    });
  });
}

async function webSocketMessageText(data) {
  if (typeof data === "string") return data;
  if (data instanceof ArrayBuffer) return Buffer.from(data).toString("utf8");
  if (ArrayBuffer.isView(data)) return Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString("utf8");
  if (data && typeof data.text === "function") return await data.text();
  return String(data);
}

function makeInjectionSource(sourceCss) {
  return `(() => {
  const css = ${JSON.stringify(sourceCss)};
  const styleId = ${JSON.stringify(styleId)};
  const version = ${JSON.stringify(runtimeVersion)};

  function ensureStyle(root, doc) {
    if (!root || !doc || !doc.createElement) return 0;
    const existing = root.querySelector ? root.querySelector("#" + styleId) : null;
    const style = existing || doc.createElement("style");
    style.id = styleId;
    style.setAttribute("data-codex-cobalt2-runtime", version);
    if (style.textContent !== css) style.textContent = css;
    if (!style.parentNode) {
      const target = root.head || root;
      target.appendChild(style);
    }
    return 1;
  }

  function injectDocument(doc) {
    if (!doc || !doc.documentElement) return 0;
    let roots = ensureStyle(doc, doc);

    const elements = doc.querySelectorAll ? doc.querySelectorAll("*") : [];
    for (const element of elements) {
      if (element.shadowRoot) roots += ensureStyle(element.shadowRoot, doc);
    }

    const frames = doc.querySelectorAll ? doc.querySelectorAll("iframe") : [];
    for (const frame of frames) {
      try {
        if (frame.contentDocument) roots += injectDocument(frame.contentDocument);
      } catch {}
    }

    return roots;
  }

  if (typeof document === "undefined") {
    return { status: "skipped", reason: "no-document", roots: 0 };
  }

  if (
    globalThis.__codexCobalt2RuntimeCssObserver &&
    globalThis.__codexCobalt2RuntimeCssVersion !== version
  ) {
    try {
      globalThis.__codexCobalt2RuntimeCssObserver.disconnect();
    } catch {}
    delete globalThis.__codexCobalt2RuntimeCssObserver;
  }

  function apply() {
    try {
      return injectDocument(document);
    } catch {
      return 0;
    }
  }

  const roots = apply();
  if (!globalThis.__codexCobalt2RuntimeCssObserver) {
    let queued = false;
    const schedule = () => {
      if (queued) return;
      queued = true;
      setTimeout(() => {
        queued = false;
        apply();
      }, 250);
    };
    const observer = new MutationObserver(schedule);
    if (document.documentElement) {
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
    globalThis.__codexCobalt2RuntimeCssObserver = observer;
  }
  globalThis.__codexCobalt2RuntimeCssVersion = version;
  return {
    status: "applied",
    roots,
    title: document.title,
    href: location.href
  };
})()`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
