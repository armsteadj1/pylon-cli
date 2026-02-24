# Analytics

Access Pylon's analytics data including saved dashboards, account health metrics, user engagement data, and raw analytics queries.

## Commands

### `pylon analytics dashboards`

List all saved analytics dashboards in your workspace.

```bash
pylon analytics dashboards
pylon analytics dashboards --json
```

**Example output:**

```
ID              Name                     Created By
─────────────── ──────────────────────── ──────────────
dash_abc123     Customer Health Weekly   Sarah K.
dash_def456     SLA Performance          Mike T.
dash_ghi789     CSM Workload Overview    Admin
```

### `pylon analytics accounts`

Get account health analytics data.

```bash
pylon analytics accounts
pylon analytics accounts --start 2024-01-01
pylon analytics accounts --type at_risk
pylon analytics accounts --start 2024-01-01 --type success
```

**Flags:**

| Flag | Description | Default |
|------|-------------|---------|
| `--start <date>` | Start date for the analytics window (ISO 8601) | 90 days ago |
| `--type <type>` | Health status filter | `success` |
| `--json` | Output as JSON | — |
| `--csv` | Output as CSV | — |

**Type values:**

| Type | Meaning |
|------|---------|
| `success` | Healthy / on track accounts |
| `at_risk` | Accounts showing warning signals |
| `churned` | Accounts that have churned |
| `new` | Recently onboarded accounts |

### `pylon analytics users`

Get user engagement analytics data.

```bash
pylon analytics users
pylon analytics users --start 2024-01-01
pylon analytics users --type at_risk
```

**Flags:**

| Flag | Description | Default |
|------|-------------|---------|
| `--start <date>` | Start date for the analytics window (ISO 8601) | 90 days ago |
| `--type <type>` | Engagement status filter | `success` |
| `--json` | Output as JSON | — |
| `--csv` | Output as CSV | — |

### `pylon analytics query <json>`

Run a raw analytics query against the Pylon analytics engine. This is the most flexible command, allowing you to construct custom queries when the pre-built commands don't cover your use case.

```bash
pylon analytics query '{"metric": "issues_opened", "groupBy": "account", "start": "2024-01-01"}'
```

The query structure depends on the analytics metrics available in your Pylon instance. Query parameters are passed as a JSON string.

**Common query structure:**

```json
{
  "metric": "<metric_name>",
  "groupBy": "<dimension>",
  "start": "YYYY-MM-DD",
  "end": "YYYY-MM-DD",
  "filters": {}
}
```

Use `--json` to get the raw API response for further processing with `jq`.

## Date Ranges

All analytics commands use ISO 8601 date format: `YYYY-MM-DD`.

```bash
# Last 30 days
pylon analytics accounts --start $(date -v-30d +%Y-%m-%d)

# Last quarter
pylon analytics accounts --start 2024-01-01 --end 2024-03-31  # (for commands that support --end)

# Year to date
pylon analytics accounts --start $(date +%Y)-01-01
```

> **Note:** On Linux, use `date -d "30 days ago" +%Y-%m-%d` instead of `date -v-30d`.

## Practical Examples

### Weekly account health report

```bash
#!/bin/bash
echo "=== Account Health Report — $(date +%Y-%m-%d) ==="
echo ""

echo "-- Healthy Accounts --"
pylon analytics accounts --type success --json | jq 'length'

echo ""
echo "-- At-Risk Accounts --"
pylon analytics accounts --type at_risk --json

echo ""
echo "-- Recent At-Risk Details --"
pylon analytics accounts --type at_risk --start $(date -v-7d +%Y-%m-%d) --json | \
  jq '.[] | {account: .name, reason: .riskReason}'
```

### Track at-risk accounts over time

```bash
# Export at-risk accounts to CSV for trend tracking
pylon analytics accounts --type at_risk --csv > at-risk-$(date +%Y-%m-%d).csv
```

### Compare account health month-over-month

```bash
echo "=== This Month ==="
pylon analytics accounts --start $(date +%Y-%m-01) --json | jq 'length'

echo "=== Last Month ==="
# Use previous month's first day
pylon analytics accounts --start $(date -v-1m +%Y-%m-01) --json | jq 'length'
```

### User engagement check

```bash
pylon analytics users --json | jq '{
  total: length,
  active: [.[] | select(.engagementLevel == "high")] | length,
  inactive: [.[] | select(.engagementLevel == "low")] | length
}'
```

### Build a Slack-ready digest

```bash
at_risk=$(pylon analytics accounts --type at_risk --json | jq 'length')
healthy=$(pylon analytics accounts --type success --json | jq 'length')

curl -X POST "$SLACK_WEBHOOK_URL" \
  -H 'Content-type: application/json' \
  -d "{\"text\": \"Account Health: $healthy healthy, $at_risk at risk\"}"
```
