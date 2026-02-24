# Feature Requests

Query and analyze feature requests tracked in Pylon, including revenue impact data.

## Commands

### `pylon features list`

List all feature requests in your workspace.

```bash
pylon features list
pylon features list --json
pylon features list --csv > features.csv
```

**Flags:**

| Flag | Description |
|------|-------------|
| `--json` | Output as JSON |
| `--csv` | Output as CSV |

**Example output:**

```
ID              Title                              Votes  Status
─────────────── ────────────────────────────────── ────── ──────────
feat_abc123     SSO / SAML Support                 47     planned
feat_def456     Bulk export to CSV                 31     under_review
feat_ghi789     Slack notification customization   28     open
feat_jkl012     API webhooks                       24     shipped
```

### `pylon features revenue`

List feature requests with associated ARR (Annual Recurring Revenue) from requesting accounts.

```bash
pylon features revenue
pylon features revenue --json
pylon features revenue --csv > feature-revenue.csv
```

**Flags:**

| Flag | Description |
|------|-------------|
| `--json` | Output as JSON |
| `--csv` | Output as CSV |

**Example output:**

```
Feature                            Requests  ARR Impact
────────────────────────────────── ──────── ────────────
SSO / SAML Support                 12       $1,240,000
API webhooks                       8        $892,000
Bulk export to CSV                 15       $456,000
Slack notification customization   6        $234,000
```

This command is especially valuable for **prioritizing your product roadmap by revenue impact** rather than just vote count. A feature requested by 6 enterprise accounts may have far greater ARR impact than one with 50 votes from smaller customers.

## Use Case: Roadmap Prioritization by Revenue

`pylon features revenue` is one of the highest-value commands in the CLI. It directly answers the question: **"Which feature requests, if built, would unblock the most revenue?"**

### Workflow

1. Export the revenue data to CSV for sharing with your product team:

```bash
pylon features revenue --csv > feature-revenue-$(date +%Y-%m-%d).csv
```

2. Sort by ARR impact using `jq`:

```bash
pylon features revenue --json | jq 'sort_by(-.arrImpact) | .[:10] | .[] | {title, arrImpact, requestCount}'
```

3. Get the top 5 features by ARR to include in a product brief:

```bash
pylon features revenue --json | jq -r 'sort_by(-.arrImpact) | .[:5] | .[] | "\(.title): $\(.arrImpact)"'
```

### Monthly revenue review script

```bash
#!/bin/bash
echo "=== Feature Request Revenue Impact Report ==="
echo "Generated: $(date)"
echo ""
pylon features revenue --json | jq -r '
  sort_by(-.arrImpact) |
  .[] |
  "  \(.title)\n    ARR: $\(.arrImpact | tostring) | Requests: \(.requestCount)\n"
'
```

## jq Patterns

### Find features over $500k ARR impact

```bash
pylon features revenue --json | jq '[.[] | select(.arrImpact > 500000)]'
```

### Get feature titles and vote counts sorted by votes

```bash
pylon features list --json | jq 'sort_by(-.votes) | .[] | {title, votes, status}'
```

### Count features by status

```bash
pylon features list --json | jq 'group_by(.status) | .[] | {status: .[0].status, count: length}'
```

### Find all "shipped" features

```bash
pylon features list --json | jq '[.[] | select(.status == "shipped") | .title]'
```

### Features with ARR but low vote count (hidden gems)

```bash
pylon features revenue --json | jq '[.[] | select(.arrImpact > 100000 and .requestCount < 5)]'
```
