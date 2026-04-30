# Publishing

## GitHub

1. Create a public repository named `codex-cobalt-gold-theme`.
2. Push this package.
3. Add screenshots to the README or GitHub release.
4. Tag the first public release:

   ```bash
   git tag v0.4.0
   git push origin v0.4.0
   ```

## npm

Run a local package audit:

```bash
npm run build
npm run validate
npm pack --dry-run
```

Then publish:

```bash
npm publish --access public
```

## Do Not Publish

- `node_modules/`
- `dist/*.asar`
- `dist/*.asar.unpacked/`
- `dist/Codex-Cobalt2-Test.app/`
- runtime logs or PID files
- isolated Chromium user-data directories

The `package.json` `files` allowlist is the source of truth for npm package contents.
