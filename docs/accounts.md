# Accounts

Explore and analyze your customer accounts, their contacts, issues, projects, and health.

## Commands

### `pylon accounts list`

List all accounts in your workspace.

```bash
pylon accounts list
pylon accounts list --limit 200
pylon accounts list --json
pylon accounts list --csv > accounts.csv
```

**Flags:**

| Flag | Description | Default |
|------|-------------|---------|
| `--limit <n>` | Maximum number of results | `100` |
| `--json` | Output as JSON | — |
| `--csv` | Output as CSV | — |

**Example output:**

```
ID              Name           Plan     ARR
─────────────── ────────────── ──────── ────────
acc_abc123      Acme Corp      Enterprise $120,000
acc_def456      Globex Inc     Growth     $24,000
acc_ghi789      Initech        Starter    $6,000
```

### `pylon accounts get <id>`

Get full details for a single account.

```bash
pylon accounts get acc_abc123
pylon accounts get acc_abc123 --json
```

Returns comprehensive account information including name, plan, ARR, health status, CSM assignment, custom fields, and metadata.

### `pylon accounts contacts <id>`

List all contacts associated with an account.

```bash
pylon accounts contacts acc_abc123
pylon accounts contacts acc_abc123 --json
```

Returns contact names, emails, roles, and other profile information. See [Contacts](contacts.md) for more on contact data.

### `pylon accounts issues <id>`

List open issues for an account.

```bash
pylon accounts issues acc_abc123
pylon accounts issues acc_abc123 --limit 100
pylon accounts issues acc_abc123 --json
```

**Flags:**

| Flag | Description | Default |
|------|-------------|---------|
| `--limit <n>` | Maximum number of results | `50` |
| `--json` | Output as JSON | — |
| `--csv` | Output as CSV | — |

### `pylon accounts projects <id>`

List projects linked to an account.

```bash
pylon accounts projects acc_abc123
pylon accounts projects acc_abc123 --json
```

Projects represent structured work (implementations, onboarding, etc.) tracked in Pylon.

### `pylon accounts highlights <id>`

Get health highlights and key metrics for an account.

```bash
pylon accounts highlights acc_abc123
pylon accounts highlights acc_abc123 --json
```

Highlights include recent activity summaries, health indicators, risk signals, and other account health metadata that Pylon tracks.

### `pylon accounts activity <id>`

View the activity log for an account — meetings, notes, emails, issue updates, and other interactions.

```bash
pylon accounts activity acc_abc123
pylon accounts activity acc_abc123 --start 2024-01-01
pylon accounts activity acc_abc123 --start 2024-01-01 --end 2024-03-31
pylon accounts activity acc_abc123 --limit 200
```

**Flags:**

| Flag | Description | Default |
|------|-------------|---------|
| `--start <date>` | Start date (ISO 8601: YYYY-MM-DD) | — |
| `--end <date>` | End date (ISO 8601: YYYY-MM-DD) | — |
| `--limit <n>` | Maximum number of results | `100` |
| `--json` | Output as JSON | — |
| `--csv` | Output as CSV | — |

## Finding Account IDs

Account IDs start with `acc_` followed by alphanumeric characters. The easiest way to find them:

```bash
# List all accounts as JSON and extract ID + name pairs
pylon accounts list --json | jq '.[] | {id, name}'
```

Output:
```json
{"id": "acc_abc123", "name": "Acme Corp"}
{"id": "acc_def456", "name": "Globex Inc"}
```

Or search by name:

```bash
pylon accounts list --json | jq '.[] | select(.name | test("Acme"; "i")) | {id, name}'
```

## Practical Examples

### Account health workflow

Get a comprehensive snapshot of an account before a QBR or check-in:

```bash
ACCOUNT_ID="acc_abc123"

echo "=== Account Details ==="
pylon accounts get $ACCOUNT_ID

echo ""
echo "=== Open Issues ==="
pylon accounts issues $ACCOUNT_ID

echo ""
echo "=== Recent Activity (last 30 days) ==="
pylon accounts activity $ACCOUNT_ID --start $(date -v-30d +%Y-%m-%d)
```

### Export all accounts to CSV for a spreadsheet

```bash
pylon accounts list --limit 500 --csv > accounts-$(date +%Y-%m-%d).csv
```

### Find accounts with no recent activity

```bash
# Get all accounts as JSON, then filter in your script
pylon accounts list --json > accounts.json

# For each account, check activity
while read -r id name; do
  count=$(pylon accounts activity "$id" --start $(date -v-30d +%Y-%m-%d) --json | jq 'length')
  if [ "$count" -eq "0" ]; then
    echo "No activity: $name ($id)"
  fi
done < <(jq -r '.[] | "\(.id) \(.name)"' accounts.json)
```

### Activity audit for a date range

```bash
pylon accounts activity acc_abc123 \
  --start 2024-01-01 \
  --end 2024-03-31 \
  --csv > q1-activity-acme.csv
```

### Get all contacts across an account's team

```bash
pylon accounts contacts acc_abc123 --json | jq '.[] | {name, email, role}'
```

### Count open issues by account

```bash
pylon accounts list --json | jq -r '.[].id' | while read id; do
  name=$(pylon accounts get "$id" --json | jq -r '.name')
  count=$(pylon accounts issues "$id" --json | jq 'length')
  echo "$count\t$name"
done | sort -rn
```
