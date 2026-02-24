# Output Formats & Piping

pylon-cli supports three output formats on all list and get commands, making it easy to use in both interactive and automated contexts.

## Formats

### Table (default)

When you run a command without any format flags, output is printed as a human-readable ASCII table with colored headers.

```bash
pylon issues list
```

```
ID          Ticket  Title                        Status  Account
─────────── ─────── ──────────────────────────── ─────── ─────────────────
iss_abc123  #1042   Login fails after SSO update  open   Acme Corp
iss_def456  #1038   API rate limit errors          open   Globex
```

Best for: interactive use, quick visual scanning.

### JSON (`--json`)

Outputs a pretty-printed JSON array (or object for single-record commands like `get`).

```bash
pylon issues list --json
```

```json
[
  {
    "id": "iss_abc123",
    "ticketNumber": 1042,
    "title": "Login fails after SSO update",
    "status": "open",
    "account": {
      "id": "acc_xyz",
      "name": "Acme Corp"
    }
  }
]
```

Best for: piping to `jq`, scripting, AI agent inputs.

### CSV (`--csv`)

Outputs comma-separated values with a header row. Values containing commas, quotes, or newlines are properly escaped.

```bash
pylon issues list --csv
```

```
id,ticketNumber,title,status,account
iss_abc123,1042,Login fails after SSO update,open,Acme Corp
iss_def456,1038,API rate limit errors,open,Globex
```

Best for: spreadsheet import, Excel, Google Sheets, data analysis.

## Using with `jq`

`jq` is the go-to tool for processing JSON output from the CLI. Install it with `brew install jq` (macOS) or `apt install jq` (Linux).

### Extract specific fields

```bash
pylon issues list --json | jq '.[] | {id, title, status}'
```

### Filter by a field value

```bash
pylon issues list --json | jq '[.[] | select(.status == "open")]'
```

### Get a count

```bash
pylon issues list --json | jq 'length'
```

### Extract a single field as plain text (for use in scripts)

```bash
pylon issues list --json | jq -r '.[0].id'
```

### Sort by a field

```bash
pylon features revenue --json | jq 'sort_by(-.arrImpact)'
```

### Group by a field

```bash
pylon tasks list --json | jq 'group_by(.status) | .[] | {status: .[0].status, count: length}'
```

### Nested field access

```bash
pylon issues list --json | jq '.[] | {title, account: .account.name}'
```

### Filter with regex

```bash
pylon accounts list --json | jq '[.[] | select(.name | test("Corp$"))]'
```

### Build a summary object

```bash
pylon issues list --json | jq '{
  total: length,
  open: [.[] | select(.status == "open")] | length,
  closed: [.[] | select(.status == "closed")] | length
}'
```

## CSV Workflow: Spreadsheets

### Export to Google Sheets

1. Export to CSV:
   ```bash
   pylon accounts list --limit 500 --csv > accounts.csv
   ```

2. In Google Sheets: **File → Import → Upload** → select `accounts.csv`

3. Choose "Replace spreadsheet" or "Insert new sheet(s)"

### Export to Excel

Same as above — Excel opens `.csv` files directly. Or use the **Data → From Text/CSV** import wizard for more control over column types.

### Automate a weekly CSV export

```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d)
DIR="~/pylon-exports/$DATE"
mkdir -p "$DIR"

pylon accounts list --limit 500 --csv > "$DIR/accounts.csv"
pylon issues list --limit 500 --csv > "$DIR/issues.csv"
pylon features revenue --csv > "$DIR/feature-revenue.csv"

echo "Exported to $DIR"
```

## Shell Script Examples

### Daily digest script

```bash
#!/bin/bash
echo "=== Pylon Daily Digest — $(date +%Y-%m-%d) ==="
echo ""
echo "Open Issues:  $(pylon issues count --status open)"
echo "Open Tasks:   $(pylon tasks count)"
echo ""
echo "=== SLA Violations ==="
pylon issues sla --json | jq -r '.[] | select(.slaStatus == "breached") | "  - #\(.ticketNumber): \(.title) (\(.account.name))"'
```

### Alert on SLA breaches

```bash
#!/bin/bash
breached=$(pylon issues sla --json | jq '[.[] | select(.slaStatus == "breached")] | length')

if [ "$breached" -gt 0 ]; then
  echo "WARNING: $breached SLA breach(es) detected"
  pylon issues sla --json | jq -r '[.[] | select(.slaStatus == "breached")] | .[] | "  - #\(.ticketNumber): \(.title)"'
  exit 1
fi

echo "No SLA breaches"
```

### Extract IDs for batch processing

```bash
# Get all open issue IDs
pylon issues list --json --limit 200 | jq -r '.[].id' | while read id; do
  # Do something with each issue
  pylon issues digest "$id"
done
```

### Combine multiple commands

```bash
# Build a full account health snapshot
account_id="acc_abc123"

echo "Account: $(pylon accounts get $account_id --json | jq -r '.name')"
echo "Open Issues: $(pylon accounts issues $account_id --json | jq 'length')"
echo "Contacts: $(pylon accounts contacts $account_id --json | jq 'length')"
```
