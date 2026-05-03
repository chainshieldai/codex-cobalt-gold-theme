# Safety

This package has two layers:

1. A Codex Desktop Appearance import string.
2. Optional runtime Markdown/editor CSS injection.

The Appearance import string is the safest path and uses Codex Desktop's own importer.

The runtime CSS path is experimental but intentionally reversible. It launches Codex with a localhost-only Chrome DevTools Protocol endpoint and injects a `<style>` tag into live renderer documents.

## What It Does Not Do

- Does not modify `/Applications/Codex.app`.
- Does not repack `app.asar`.
- Does not write to `app.asar.unpacked`.
- Does not re-sign the app bundle.
- Does not install or bundle fonts.

## Rollback

```bash
npm run stop:runtime-css
```

Then quit and reopen Codex normally.

## Local Debug Port Risk

While Codex is running through `npm run start:runtime-css`, local processes on your machine can access the renderer debug endpoint at `127.0.0.1:28492`.

Only use this on a machine you control. Stop the watcher and restart Codex normally when you do not want runtime styling active.

## Disabled ASAR Path

Earlier app-bundle patch experiments caused Electron/V8 startup crashes. The public package does not expose ASAR patch commands. The audit record remains in `docs/MARKDOWN_OVERRIDE_AUDIT.md` so the failure mode is not rediscovered the hard way.
