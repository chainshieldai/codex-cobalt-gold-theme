import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const css = await readFile(
  new URL("../overrides/cobalt2-markdown-overrides.css", import.meta.url),
  "utf8"
);

test("does not treat Codex UI class names as code font containers", () => {
  const fontSection = css.match(
    /\/\* Bright Cobalt2 syntax layer[^]*?font-family:\s*inherit !important;[^]*?\}/
  );
  assert.ok(fontSection, "runtime code font rules must exist");
  assert.doesNotMatch(
    fontSection[0],
    /\[class\*="(?:code|Code)"\]/,
    "generic code fragments also match Codex UI classes such as text-codex-description"
  );
  assert.match(fontSection[0], /\.shiki/);
  assert.match(fontSection[0], /\bpre\b/);
  assert.match(fontSection[0], /\bcode\b/);
  assert.match(fontSection[0], /bg-token-text-code-block-background/);
});
