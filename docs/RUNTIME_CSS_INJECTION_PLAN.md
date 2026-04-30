# Runtime CSS Injection Plan

## Goal

Style rendered Markdown without modifying `/Applications/Codex.app`, without repacking `app.asar`, and without re-signing the app bundle.

## Selected Approach

Use Chrome DevTools Protocol against a Codex process that was launched with a localhost-only remote debugging port. The injector attaches to renderer targets and inserts `overrides/cobalt2-markdown-overrides.css` as an in-memory `<style>` tag.

This changes only live renderer documents. It does not write to the app bundle, `app.asar`, or `app.asar.unpacked`.

## Safety Properties

- Restarting Codex removes the Markdown CSS.
- Stopping the watcher prevents future re-injection.
- The app bundle remains byte-for-byte untouched.
- The debug endpoint is bound to `127.0.0.1`.
- First validation uses an isolated Chromium user-data directory under `dist/`.
- The existing ASAR patch scripts remain audit-only or disabled.

## Test Flow

1. Launch an isolated Codex instance with a localhost debug port:

   ```bash
   npm run launch:runtime-test
   ```

2. In the same package directory, attach the runtime CSS watcher:

   ```bash
   npm run watch:runtime-css
   ```

3. Open rendered Markdown inside the test instance and verify:

   - H1 is Cobalt gold.
   - H2 is amber.
   - H3 is electric cyan.
   - Links are cyan and italic.
   - Inline code and fenced code use the Cobalt2 treatment.

4. Stop the watcher with `Ctrl+C`.

5. Quit and reopen Codex normally. The Markdown CSS should be gone.

## Real Profile Flow

After the isolated test passes, quit Codex and launch the normal app with the same local debug port:

```bash
npm run start:runtime-css
```

If Codex was already running, quit it first. macOS may focus the existing app instead of applying new Chromium arguments.

## Rollback

No file rollback is needed. Stop the watcher and restart Codex:

```bash
npm run stop:runtime-css
```

## Known Limits

- The watcher must be running for new windows or navigations to receive the CSS.
- The local debugging port gives local processes renderer-debug access while Codex is launched with that flag.
- This is still experimental until verified across the Markdown panes we care about.
