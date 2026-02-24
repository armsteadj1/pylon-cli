# Issues

Manage and query your Pylon support issues from the terminal.

## Commands

### `pylon issues list`

List issues with optional filtering.

```bash
pylon issues list
pylon issues list --status open
pylon issues list --status closed --limit 100
pylon issues list --view <viewId>
```

**Flags:**

| Flag | Description | Default |
|------|-------------|---------|
| `--status <status>` | Filter by status (`open`, `closed`, etc.) | `open` |
| `--view <viewId>` | Filter by a saved view ID | — |
| `--limit <n>` | Maximum number of results | `50` |
| `--json` | Output as JSON | — |
| `--csv` | Output as CSV | — |

**Example output (table):**

```
ID          Ticket  Title                        Status  Account
─────────── ─────── ──────────────────────────── ─────── ─────────────────
iss_abc123  #1042   Login fails after SSO update  open   Acme Corp
iss_def456  #1038   API rate limit errors          open   Globex
```

### `pylon issues get <id>`

Get full details for a single issue. Accepts either the issue UUID or ticket number.

```bash
pylon issues get iss_abc123
pylon issues get 1042
```

Returns all available fields including title, status, priority, assignee, account, created/updated timestamps, and any custom fields.

### `pylon issues views`

List all saved issue views configured in your Pylon workspace.

```bash
pylon issues views
pylon issues views --json
```

**Example output:**

```
ID              Name
─────────────── ──────────────────────
view_abc123     My Open Issues
view_def456     SLA At Risk
view_ghi789     Enterprise Accounts
```

Use the `ID` column values with `--view` to filter issues.

### `pylon issues view <viewId>`

Get issues belonging to a specific saved view.

```bash
pylon issues view view_def456
pylon issues view view_def456 --limit 100
pylon issues view view_def456 --json
```

**Flags:**

| Flag | Description | Default |
|------|-------------|---------|
| `--limit <n>` | Maximum number of results | `50` |
| `--json` | Output as JSON | — |
| `--csv` | Output as CSV | — |

This is equivalent to `pylon issues list --view <viewId>` but more explicit.

### `pylon issues sla`

Show issues that are in SLA violation or at risk.

```bash
pylon issues sla
pylon issues sla --start 2024-01-01
pylon issues sla --json
```

**Flags:**

| Flag | Description | Default |
|------|-------------|---------|
| `--start <date>` | Start date for SLA window (ISO 8601) | 90 days ago |
| `--json` | Output as JSON | — |
| `--csv` | Output as CSV | — |

**Output fields include:** issue ID, ticket number, title, SLA status, breach time, account name, priority.

SLA status values:
- `breached` — SLA has already been violated
- `at_risk` — SLA will be violated soon
- `met` — Within SLA

### `pylon issues digest <id>`

Generate an AI-powered summary of an issue's conversation thread and activity.

```bash
pylon issues digest iss_abc123
```

Returns a human-readable digest including:
- Summary of the problem being reported
- Key points from the conversation
- Current status and next steps
- Any relevant context from previous interactions

This is useful for getting up to speed on a long thread quickly, or for generating summaries to share with stakeholders.

### `pylon issues count`

Quickly count issues without fetching full records.

```bash
pylon issues count
pylon issues count --status open
pylon issues count --status closed
```

**Flags:**

| Flag | Description | Default |
|------|-------------|---------|
| `--status <status>` | Filter by status | `open` |

Returns a single number. Useful in scripts and dashboards.

## Output Formats

All list commands support `--json` and `--csv`. See [Output Formats & Piping](output-formats.md) for full details.

## Practical Examples

### Filter issues by a saved view

First, find your view IDs:

```bash
pylon issues views --json
```

Then use a view ID to filter:

```bash
pylon issues list --view view_abc123
```

### Export all open issues to CSV

```bash
pylon issues list --limit 500 --csv > open-issues.csv
```

### Find issues for a specific account

Combine with `jq` to filter by account name:

```bash
pylon issues list --json --limit 200 | jq '[.[] | select(.account.name == "Acme Corp")]'
```

### Count issues by status

```bash
echo "Open: $(pylon issues count --status open)"
echo "Closed: $(pylon issues count --status closed)"
```

### Get issue IDs from a view for bulk processing

```bash
pylon issues view view_abc123 --json | jq -r '.[].id'
```

### Monitor SLA violations in a script

```bash
violations=$(pylon issues sla --json | jq '[.[] | select(.slaStatus == "breached")] | length')
if [ "$violations" -gt 0 ]; then
  echo "ALERT: $violations SLA breaches detected"
fi
```

### Pipe issue digest to clipboard (macOS)

```bash
pylon issues digest iss_abc123 | pbcopy
```
