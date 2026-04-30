import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const sourceUrl = new URL("theme.source.json", root);
const distUrl = new URL("dist/", root);
const sharePrefix = "codex-theme-v1:";

const source = JSON.parse(await readFile(sourceUrl, "utf8"));
const markdownCss = await readFile(new URL("overrides/cobalt2-markdown-overrides.css", root), "utf8");
const codexTheme = {
  surface: source.codexDesktop.surface,
  ink: source.codexDesktop.ink,
  accent: source.codexDesktop.accent,
  contrast: source.codexDesktop.contrast,
  fonts: {
    code: source.codexDesktop.codeFontFamily,
    ui: source.codexDesktop.uiFontFamily
  },
  opaqueWindows: !source.codexDesktop.translucentSidebar,
  semanticColors: source.codexDesktop.semanticColors
};

const sharePayload = {
  codeThemeId: source.codexDesktop.codeThemeId,
  theme: codexTheme,
  variant: source.variant
};

const fullTheme = {
  name: source.name,
  description: source.description,
  author: source.author,
  version: source.version,
  variant: source.variant,
  codeThemeId: source.codexDesktop.codeThemeId,
  theme: codexTheme,
  sansFontSize: source.fontSizes.sansFontSize,
  codeFontSize: source.fontSizes.codeFontSize,
  palette: source.palette
};

const compact = JSON.stringify(sharePayload);
const pasteString = `${sharePrefix}${compact}`;
const encodedPasteString = `${sharePrefix}${encodeURIComponent(compact)}`;

await mkdir(distUrl, { recursive: true });
await writeFile(
  new URL("cobalt2-codex.codex-theme.json", distUrl),
  `${JSON.stringify(sharePayload, null, 2)}\n`
);
await writeFile(
  new URL("cobalt2-codex-full.codex-theme.json", distUrl),
  `${JSON.stringify(fullTheme, null, 2)}\n`
);
await writeFile(new URL("cobalt2-codex-paste.txt", distUrl), `${pasteString}\n`);
await writeFile(new URL("cobalt2-codex-paste.encoded.txt", distUrl), `${encodedPasteString}\n`);
await writeFile(new URL("cobalt2-markdown-overrides.css", distUrl), `${markdownCss.trim()}\n`);

console.log("Built Codex Desktop theme artifacts in dist/");
