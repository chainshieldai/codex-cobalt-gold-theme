# Markdown Override Audit

## Current status

The installed Codex app is clean:

- `webview/assets/index-Demj-qjn.css` has no Cobalt2 Markdown override marker.
- `webview/assets/use-model-settings-DSYwWnRy.css` has no Cobalt2 Markdown override marker.
- `/Applications/Codex.app/Contents/Resources/app.asar` matches the saved backup byte-for-byte.
- `codesign --verify --deep --strict /Applications/Codex.app` passes after re-signing the clean bundle.

## Crash evidence

The crash reports at `~/Library/Logs/DiagnosticReports/Codex-2026-04-29-1940*.ips` show startup-time native crashes:

- Four launches terminated with `EXC_BREAKPOINT / SIGTRAP`.
- The triggered stack is inside Electron / Node / V8 bootstrap frames.
- One launch terminated with `SIGABRT` during app initialization.
- There is no renderer exception or CSS parse error in the reports.

## Working hypothesis

The Markdown CSS itself may not be the direct crash trigger. The risky part is repacking `app.asar`.

The staged ASAR produced by `@electron/asar` does not preserve the installed ASAR metadata exactly. In particular, native module entries under `node_modules/node-pty` and `node_modules/better-sqlite3` come out with different metadata/size characteristics than the live ASAR. Electron loads these during startup, before Markdown rendering is relevant.

Therefore, treating this as “only CSS changed” is incomplete: the unpacked file content diff can look CSS-only while the ASAR header/layout/signing state is still materially different.

## Safety decision

Live Markdown ASAR patching is disabled and intentionally not exposed as a public package command.

The old audit-only ASAR experiment generated these local artifacts:

- `dist/cobalt2-markdown-overrides.css`
- `dist/codex-cobalt2-staged-app.asar`

The staged ASAR was for offline inspection only and should not be copied into `/Applications/Codex.app`. Public package contents exclude staged ASAR files.

The copied-app fixture path was also tested from a local `dist/Codex-Cobalt2-Test.app` copy. It crashed at startup with the same `EXC_BREAKPOINT / SIGTRAP` Electron/V8 bootstrap stack. That confirms the failure is not caused by modifying the live app in place; the repacked ASAR itself is enough to destabilize startup.

The public package does not include the old ASAR patch or copied-app fixture scripts.

## Safer retry options

1. Use the runtime CSS injection path in `docs/RUNTIME_CSS_INJECTION_PLAN.md`.
2. If ASAR mutation remains necessary, write a patcher that preserves the original ASAR header/unpacked metadata exactly, then test it against a copied fixture first.
3. Prefer a browser/devtools/user-style injection route if one exists, because the CSS itself is renderer-scoped while the ASAR repack failure happens during main-process bootstrap.
