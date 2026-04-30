import { mkdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const root = new URL("../", import.meta.url);
const defaultApp = "/Applications/Codex.app";
const defaultPort = "28492";

const args = new Map();
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
    }
  }
}

const appPath = args.get("app") ?? process.env.CODEX_APP_PATH ?? defaultApp;
const port = args.get("port") ?? process.env.CODEX_COBALT2_DEBUG_PORT ?? defaultPort;
const userDataDir = args.get("user-data-dir")
  ?? process.env.CODEX_COBALT2_TEST_USER_DATA
  ?? new URL("dist/codex-cobalt2-runtime-user-data", root).pathname;

await mkdir(userDataDir, { recursive: true });

const openArgs = [
  "-n",
  appPath,
  "--args",
  "--remote-debugging-address=127.0.0.1",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`
];

console.log("Launching isolated Codex runtime CSS test instance.");
console.log(`App: ${appPath}`);
console.log(`Remote debugging: http://127.0.0.1:${port}`);
console.log(`Isolated user data: ${userDataDir}`);

const result = spawnSync("open", openArgs, { stdio: "inherit" });
if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log("");
console.log("When the app window appears, run:");
console.log("npm run watch:runtime-css");
