# pylon-cli

Read-only CLI for [Pylon](https://usepylon.com) — your B2B support platform in the terminal.

## Install

```bash
npm i -g @armsteadj1/pylon-cli
```

## Quick Start

1. Open Pylon in your browser
2. Open DevTools → Network → any request to `graph.usepylon.com` → copy `x-csrf-token` header
3. Run: `pylon auth --csrf-token <your-token>`
4. Run: `pylon issues list`

## Commands

| Group | Commands |
|-------|---------|
| `auth` | login, status, logout |
| `issues` | list, get, views, view, sla, digest, count |
| `accounts` | list, get, contacts, issues, projects, highlights, activity |
| `contacts` | list, get |
| `features` | list, revenue |
| `tasks` | list, count |
| `analytics` | query, dashboards, accounts, users |
| `kb` | list, ask |
| `notifications` | list |
| `announcements` | list |
| `org` | config |
| `me` | — |
| `users` | — |

All commands support `--json` and `--csv` output flags.

## Documentation

- [Authentication](docs/auth.md)
- [Issues](docs/issues.md)
- [Accounts](docs/accounts.md)
- [Contacts](docs/contacts.md)
- [Feature Requests](docs/features.md)
- [Tasks](docs/tasks.md)
- [Analytics](docs/analytics.md)
- [Knowledge Base](docs/kb.md)
- [Notifications & Announcements](docs/notifications.md)
- [Output Formats & Piping](docs/output-formats.md)
- [Automation & Scripting](docs/automation.md)

## Development

```bash
npm install           # install dependencies
npm test              # run unit tests (vitest)
npm run test:watch    # run tests in watch mode
npm run test:coverage # generate coverage report
npm run typecheck     # type-check without emitting
npm run build         # compile TypeScript to dist/
```

## Releasing

1. Update `version` in `package.json`
2. `git tag v<version> && git push origin v<version>`

GitHub Actions auto-publishes to npm.

> **Note:** Requires an `NPM_TOKEN` secret in GitHub repo settings (Settings → Secrets → Actions).

## License

MIT
