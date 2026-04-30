import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";

const root = new URL("../", import.meta.url);
const text = await readFile(new URL("dist/cobalt2-codex-paste.txt", root), "utf8");

const pbcopy = spawn("pbcopy");
pbcopy.stdin.end(text);

pbcopy.on("close", code => {
  if (code !== 0) {
    console.error(`pbcopy failed with exit code ${code}`);
    process.exit(code ?? 1);
  }
console.log("Copied Cobalt Gold for Codex theme import string to clipboard.");
});
