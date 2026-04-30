import { copyFile, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../", import.meta.url);
const source = JSON.parse(await readFile(new URL("theme.source.json", root), "utf8"));
const statePath = join(process.env.HOME, ".codex", ".codex-global-state.json");

if (!existsSync(statePath)) {
  console.error(`Codex global state not found: ${statePath}`);
  process.exit(1);
}

const state = JSON.parse(await readFile(statePath, "utf8"));
const settings = source.codexDesktop;
const fontSizes = source.fontSizes;
const backupPath = `${statePath}.cobalt-gold-font-backup`;

await copyFile(statePath, backupPath);

state.codeFontFamily = settings.codeFontFamily;
state.sansFontFamily = settings.uiFontFamily;
state.codeFontSize = fontSizes.codeFontSize;
state.sansFontSize = fontSizes.sansFontSize;

if (state.appearanceDarkChromeTheme?.fonts) {
  state.appearanceDarkChromeTheme.fonts.code = settings.codeFontFamily;
  state.appearanceDarkChromeTheme.fonts.ui = settings.uiFontFamily;
}

await writeFile(statePath, `${JSON.stringify(state)}\n`);

console.log("Applied Codex font settings.");
console.log(`Backup: ${backupPath}`);
