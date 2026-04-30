# Install Notes

## Appearance Import

Codex Desktop's Appearance screen imports theme share strings. Use these artifacts in order:

1. `dist/cobalt2-codex-paste.txt`
2. `dist/cobalt2-codex-paste.encoded.txt`
3. `dist/cobalt2-codex.codex-theme.json` for inspection only

The raw JSON alone will keep the import button disabled. The paste string must begin with `codex-theme-v1:`.

Copy the import string:

```bash
npm run copy
```

Then open Codex Desktop Settings > Appearance > Dark theme > Import.

## Font Settings

Recommended values:

```text
UI font size: 14 px
Code font size: 15 px
Code font family: Operator Mono, VictorMono Nerd Font Mono, VictorMono Nerd Font, JetBrainsMono Nerd Font Mono, JetBrainsMono Nerd Font, FiraCode Nerd Font Mono, Fira Code, SF Mono, Menlo, Monaco, Consolas, monospace
UI font family: SF Pro Text, Inter, -apple-system, BlinkMacSystemFont, Helvetica Neue, Arial, sans-serif
```

Apply them:

```bash
npm run apply:fonts
```

Restart Codex Desktop so every pane reloads the global font settings.

## Runtime Markdown CSS

Markdown styling cannot be imported through the Appearance dialog. Do not paste raw CSS into the importer.

Safe isolated test:

```bash
npm run launch:runtime-test
npm run watch:runtime-css
```

Normal profile:

```bash
npm run start:runtime-css
```

If Codex was already running without the debug port, quit it completely first and run `npm run start:runtime-css` from Terminal.

Stop the runtime watcher:

```bash
npm run stop:runtime-css
```

Restarting Codex removes the runtime CSS.
