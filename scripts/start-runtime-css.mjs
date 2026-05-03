import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";

const root = new URL("../", import.meta.url);
const defaultPort = 28492;
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

const appPath = args.get("app") ?? process.env.CODEX_APP_PATH ?? "/Applications/Codex.app";
const port = Number(args.get("port") ?? process.env.CODEX_COBALT2_DEBUG_PORT ?? defaultPort);
const host = args.get("host") ?? process.env.CODEX_COBALT2_DEBUG_HOST ?? "127.0.0.1";
const pidPath = new URL("dist/runtime-css-watch.pid", root);
const logPath = new URL("dist/runtime-css-watch.log", root);
const injectorPath = new URL("scripts/inject-runtime-css.mjs", root);
const applySettingsPath = new URL("scripts/apply-font-settings.mjs", root);

if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  console.error(`Invalid remote debugging port: ${port}`);
  process.exit(1);
}

if (!existsSync(appPath)) {
  console.error(`Codex app not found: ${appPath}`);
  process.exit(1);
}

await mkdir(new URL("dist/", root), { recursive: true });

if (flags.has("dry-run")) {
  console.log(`Would launch Codex with runtime CSS support:`);
  console.log(`App: ${appPath}`);
  console.log(`Endpoint: http://${host}:${port}`);
  console.log(`Watcher log: ${logPath.pathname}`);
  console.log(`Watcher pid: ${pidPath.pathname}`);
  process.exit(0);
}

const applyResult = spawnSync(process.execPath, [applySettingsPath.pathname], {
  cwd: root.pathname,
  encoding: "utf8"
});

if (applyResult.status !== 0) {
  const message = applyResult.stderr || applyResult.stdout || `appearance settings exited with ${applyResult.status}`;
  console.error(message);
  process.exit(applyResult.status ?? 1);
}

if (applyResult.stdout.trim()) {
  console.log(applyResult.stdout.trim());
}

const endpointWasAlreadyLive = await endpointLive();
if (!endpointWasAlreadyLive) {
  const openResult = spawnSync("open", [
    "-a",
    appPath,
    "--args",
    `--remote-debugging-address=${host}`,
    `--remote-debugging-port=${port}`
  ], { encoding: "utf8" });

  if (openResult.status !== 0) {
    const message = openResult.stderr || openResult.stdout || `open exited with ${openResult.status}`;
    console.error(message);
    process.exit(openResult.status ?? 1);
  }

  const becameLive = await waitForEndpoint(30_000);
  if (!becameLive) {
    console.error(`Codex did not expose http://${host}:${port}.`);
    console.error("If Codex was already running, quit it completely and rerun this from Terminal.");
    process.exit(1);
  }
}

await stopExistingWatcher();

const out = await import("node:fs").then(fs => fs.openSync(logPath, "a"));
const child = spawn(process.execPath, [injectorPath.pathname, "--watch", "--host", host, "--port", String(port)], {
  cwd: root.pathname,
  detached: true,
  stdio: ["ignore", out, out]
});
child.unref();
await writeFile(pidPath, `${child.pid}\n`);

console.log(`Codex runtime CSS is active on http://${host}:${port}.`);
console.log(`Watcher PID: ${child.pid}`);
console.log(`Log: ${logPath.pathname}`);
console.log("Stop with: npm run stop:runtime-css");

async function endpointLive() {
  try {
    const response = await fetch(`http://${host}:${port}/json/version`, {
      signal: AbortSignal.timeout(1000)
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForEndpoint(timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await endpointLive()) return true;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
}

async function stopExistingWatcher() {
  if (!existsSync(pidPath)) return;
  const pid = Number((await readFile(pidPath, "utf8")).trim());
  if (!Number.isInteger(pid)) return;
  try {
    process.kill(pid, "SIGTERM");
  } catch {}
}
