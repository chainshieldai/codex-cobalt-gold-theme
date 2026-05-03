# Changelog

## 0.4.1

- Increased default Codex UI and code font sizes for better readability.
- Made the runtime launcher re-apply native Codex font settings and the brighter `night-owl` code editor theme before launch.
- Added a runtime brightness boost for Codex's native editor pane so Night Owl tokens render closer to Cobalt2's brighter nvim palette.
- Expanded runtime CSS coverage for rendered Markdown, diff/source panes, inline code, and fenced code blocks.
- Kept the safety model unchanged: no ASAR patching, no app-bundle mutation, and no bundled fonts.

## 0.4.0

- Renamed the public package surface to Cobalt Gold for Codex.
- Added runtime-only Markdown styling through localhost DevTools Protocol injection.
- Added normal-profile launcher and watcher stop scripts.
- Added safety, notice, install, and audit documentation for public packaging.
- Removed public ASAR patch commands from package scripts.
- Pinned Markdown code styling to Operator Mono first when installed.
- Updated Markdown heading palette to gold, amber, and electric cyan.

## 0.3.0

- Added Cobalt2-inspired Codex Desktop Appearance import artifacts.
- Added font settings helper for Codex global state.
- Documented ASAR crash findings and disabled live ASAR patching.
