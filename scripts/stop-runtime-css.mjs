import { readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";

const root = new URL("../", import.meta.url);
const pidPath = new URL("dist/runtime-css-watch.pid", root);

if (!existsSync(pidPath)) {
  console.log("No runtime CSS watcher PID file found.");
  process.exit(0);
}

const pid = Number((await readFile(pidPath, "utf8")).trim());
if (!Number.isInteger(pid)) {
  console.log(`Invalid watcher PID file: ${pidPath.pathname}`);
  process.exit(1);
}

try {
  process.kill(pid, "SIGTERM");
  console.log(`Stopped runtime CSS watcher PID ${pid}.`);
} catch (error) {
  if (error.code === "ESRCH") {
    console.log(`Runtime CSS watcher PID ${pid} was not running.`);
  } else {
    throw error;
  }
} finally {
  await rm(pidPath, { force: true });
}
