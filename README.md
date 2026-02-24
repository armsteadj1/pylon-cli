# pylon-cli

A read-only CLI for [Pylon](https://usepylon.com) — query issues, contacts, accounts, tasks, and more from your terminal.

## Installation

```bash
npm install -g @armsteadj1/pylon-cli
```

## Authentication

```bash
pylon auth login --csrf-token <token>
```

Grab your `x-csrf-token` from browser DevTools (Application → Cookies or Network tab) while logged in to app.usepylon.com.

## Usage

```bash
pylon issues list
pylon contacts list
pylon accounts list
pylon tasks list
pylon kb list
pylon auth status
pylon auth logout
```

Run `pylon --help` or `pylon <command> --help` for full options.

## Development

```bash
npm install          # install dependencies
npm test             # run unit tests (vitest)
npm run test:watch   # run tests in watch mode
npm run test:coverage # generate coverage report
npm run typecheck    # type-check without emitting
npm run build        # compile TypeScript to dist/
```

## Releasing

1. Update `version` in `package.json`
2. Commit the version bump
3. Tag and push:
   ```bash
   git tag v<version>
   git push origin v<version>
   ```
4. GitHub Actions automatically builds, tests, and publishes to npm

> **Note:** Requires an `NPM_TOKEN` secret configured in GitHub repo settings (Settings → Secrets → Actions).

## License

MIT
