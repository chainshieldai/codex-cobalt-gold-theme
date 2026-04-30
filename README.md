# Cobalt Gold for Codex

A Cobalt2-inspired dark theme package for Codex Desktop: gold-on-navy chrome, Operator Mono-first code typography, and optional runtime Markdown styling.

This is a community package. It is not affiliated with OpenAI or Wes Bos, and it does not bundle Operator Mono or any other commercial font.

## What You Get

- A pasteable Codex Desktop Appearance import string.
- A font settings helper for Codex Desktop's global font preferences.
- Runtime Markdown CSS for rendered chat/report Markdown.
- A safe launcher that injects Markdown CSS into memory only.
- Audit notes explaining why app-bundle and ASAR patching are intentionally avoided.

## Safety Model

The normal theme import uses Codex Desktop's Appearance importer.

The optional Markdown styling uses Chrome DevTools Protocol against a Codex process launched with a localhost-only debug port. It inserts a `<style>` tag into live renderer documents. It does not modify `/Applications/Codex.app`, does not repack `app.asar`, and does not change code signatures.

Rollback is simple:

```bash
npm run stop:runtime-css
```

Then quit and reopen Codex normally.

See [SAFETY.md](./SAFETY.md) and [docs/MARKDOWN_OVERRIDE_AUDIT.md](./docs/MARKDOWN_OVERRIDE_AUDIT.md).

## Requirements

- macOS with Codex Desktop installed at `/Applications/Codex.app`.
- Node.js 22+.
- Optional but recommended: Operator Mono installed locally.

Font fallback order:

```text
Operator Mono, VictorMono Nerd Font Mono, VictorMono Nerd Font, JetBrainsMono Nerd Font Mono, JetBrainsMono Nerd Font, FiraCode Nerd Font Mono, Fira Code, SF Mono, Menlo, Monaco, Consolas, monospace
```

## Install From Source

```bash
git clone https://github.com/chainshieldai/codex-cobalt-gold-theme.git
cd codex-cobalt-gold-theme
npm install
npm run build
npm run validate
```

## Import The Theme

Copy the Codex Appearance import string:

```bash
npm run copy
```

Then in Codex Desktop:

1. Open Settings.
2. Go to Appearance.
3. Under Dark theme, choose Import.
4. Paste the clipboard contents.
5. Use Dark mode, or System mode with macOS in Dark Mode.

If import fails, paste the contents of `dist/cobalt2-codex-paste.encoded.txt`.

## Apply Font Settings

Codex Desktop stores imported theme fonts and global editor fonts separately. To apply the recommended global font settings:

```bash
npm run apply:fonts
```

Restart Codex after applying fonts. The script creates a backup beside Codex's global state file before writing.

## Runtime Markdown Styling

First test with an isolated Codex profile:

```bash
npm run launch:runtime-test
npm run watch:runtime-css
```

After that looks good, use the normal profile:

```bash
npm run start:runtime-css
```

Important: quit Codex completely before running `start:runtime-css` if Codex was opened normally from the Dock or Spotlight. The launcher starts Codex with the required localhost debug port and starts the CSS watcher.

Stop the watcher:

```bash
npm run stop:runtime-css
```

## Markdown Palette

- `#` heading: `#FFC600` gold
- `##` heading: `#FF9D00` amber
- `###` heading: `#80FCFF` electric cyan
- Links: italic electric cyan
- Emphasis: amber
- Inline code: gold on deep navy
- Fenced code: deep navy with a gold inset rule

## Files

- `dist/cobalt2-codex-paste.txt`: Codex Desktop import string.
- `dist/cobalt2-codex-paste.encoded.txt`: URL-encoded import string fallback.
- `dist/cobalt2-codex.codex-theme.json`: decoded import payload for inspection.
- `dist/cobalt2-codex-full.codex-theme.json`: full source-derived theme metadata.
- `overrides/cobalt2-markdown-overrides.css`: runtime Markdown CSS.
- `scripts/start-runtime-css.mjs`: normal-profile runtime launcher.
- `scripts/inject-runtime-css.mjs`: DevTools Protocol CSS injector.

## Notes

Codex Desktop's current importer accepts a built-in `codeThemeId`, not arbitrary TextMate token colors. This package uses Codex's built-in `ayu` code theme because its yellow/orange syntax colors are closest to the Cobalt2 family inside the current importer constraints.

The Cobalt2 palette and theme lineage belong to Wes Bos. This project is an unaffiliated adaptation for Codex Desktop. See [NOTICE.md](./NOTICE.md).
