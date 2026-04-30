import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const sharePrefix = "codex-theme-v1:";
const theme = JSON.parse(
  await readFile(new URL("dist/cobalt2-codex.codex-theme.json", root), "utf8")
);
const pasteString = (
  await readFile(new URL("dist/cobalt2-codex-paste.txt", root), "utf8")
).trim();

const required = [
  "codeThemeId",
  "theme",
  "variant"
];
const hexColor = /^#[0-9A-Fa-f]{6}$/;
const errors = [];

for (const key of required) {
  if (!(key in theme)) errors.push(`Missing ${key}`);
}

if (theme.variant !== "dark") {
  errors.push("variant must be dark for this theme");
}

if (theme.codeThemeId !== "ayu") {
  errors.push("codeThemeId must be ayu");
}

for (const key of ["surface", "ink", "accent"]) {
  if (typeof theme.theme?.[key] !== "string" || !hexColor.test(theme.theme[key])) {
    errors.push(`${key} must be a #RRGGBB color`);
  }
}

if (
  !Number.isInteger(theme.theme?.contrast) ||
  theme.theme.contrast < 0 ||
  theme.theme.contrast > 100
) {
  errors.push("contrast must be an integer from 0 to 100");
}

if (typeof theme.theme?.opaqueWindows !== "boolean") {
  errors.push("opaqueWindows must be boolean");
}

for (const key of ["code", "ui"]) {
  if (typeof theme.theme?.fonts?.[key] !== "string" || theme.theme.fonts[key].trim().length === 0) {
    errors.push(`fonts.${key} must be a non-empty font-family string`);
  }
}

for (const key of ["diffAdded", "diffRemoved", "skill"]) {
  if (
    typeof theme.theme?.semanticColors?.[key] !== "string" ||
    !hexColor.test(theme.theme.semanticColors[key])
  ) {
    errors.push(`semanticColors.${key} must be a #RRGGBB color`);
  }
}

if (!pasteString.startsWith(sharePrefix)) {
  errors.push(`paste string must start with ${sharePrefix}`);
} else {
  const raw = pasteString.slice(sharePrefix.length);
  const json = raw.startsWith("{") ? raw : decodeURIComponent(raw);
  const parsed = JSON.parse(json);
  if (JSON.stringify(parsed) !== JSON.stringify(theme)) {
    errors.push("paste string payload must match cobalt2-codex.codex-theme.json");
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Theme artifact looks valid.");
