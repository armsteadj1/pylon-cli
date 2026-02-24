# Automation & Scripting

pylon-cli is designed to be scripted. All commands output clean JSON or CSV, making it easy to integrate into cron jobs, shell scripts, Slack bots, and AI agent pipelines.

## Cron Jobs

### Daily account health report (cron)

Save this as `~/scripts/pylon-daily.sh`:

```bash
#!/bin/bash
set -e

DATE=$(date +%Y-%m-%d)
LOG="~/pylon-reports/$DATE.txt"
mkdir -p ~/pylon-reports

{
  echo "=== Pylon Daily Report — $DATE ==="
  echo ""
  echo "ISSUES"
  echo "  Open:    $(pylon issues count --status open)"
  echo ""
  echo "TASKS"
  echo "  Open:    $(pylon tasks count)"
  echo ""
  echo "SLA VIOLATIONS"
  pylon issues sla --json | jq -r '
    .[] | select(.slaStatus == "breached") |
    "  BREACH: #\(.ticketNumber) — \(.title) (\(.account.name))"
  '
  echo ""
  echo "AT-RISK ACCOUNTS"
  pylon analytics accounts --type at_risk --json | jq -r '.[] | "  - \(.name)"'
} | tee "$LOG"
```

Add to crontab (`crontab -e`):

```cron
# Run at 8am every weekday
0 8 * * 1-5 /bin/bash ~/scripts/pylon-daily.sh
```

### Weekly CSV export

```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d)
DIR="$HOME/pylon-exports/week-$DATE"
mkdir -p "$DIR"

pylon issues list --limit 500 --status open --csv   > "$DIR/open-issues.csv"
pylon accounts list --limit 500 --csv               > "$DIR/accounts.csv"
pylon features revenue --csv                        > "$DIR/feature-revenue.csv"
pylon contacts list --limit 1000 --csv              > "$DIR/contacts.csv"

echo "Weekly export complete: $DIR"
```

## Slack Integration

### Post a digest to Slack via webhook

Set `SLACK_WEBHOOK_URL` as an environment variable or in a `.env` file (never hardcode it).

```bash
#!/bin/bash
open_issues=$(pylon issues count --status open)
open_tasks=$(pylon tasks count)
sla_breaches=$(pylon issues sla --json | jq '[.[] | select(.slaStatus == "breached")] | length')
at_risk=$(pylon analytics accounts --type at_risk --json | jq 'length')

MESSAGE="*Pylon Daily* | $(date +%Y-%m-%d)
• Open Issues: $open_issues
• Open Tasks: $open_tasks
• SLA Breaches: $sla_breaches
• At-Risk Accounts: $at_risk"

curl -s -X POST "$SLACK_WEBHOOK_URL" \
  -H 'Content-type: application/json' \
  -d "{\"text\": \"$MESSAGE\"}"
```

### Alert Slack on new SLA breaches

```bash
#!/bin/bash
breached=$(pylon issues sla --json | jq '[.[] | select(.slaStatus == "breached")]')
count=$(echo "$breached" | jq 'length')

if [ "$count" -gt 0 ]; then
  details=$(echo "$breached" | jq -r '.[] | "• #\(.ticketNumber): \(.title) (\(.account.name))"' | head -5)

  curl -s -X POST "$SLACK_WEBHOOK_URL" \
    -H 'Content-type: application/json' \
    -d "$(jq -n --arg count "$count" --arg details "$details" '{
      "text": ":red_circle: *\($count) SLA Breach(es) Detected*\n\($details)"
    }')"
fi
```

## Morning Briefing Script

A comprehensive script you can run at the start of each day:

```bash
#!/bin/bash
# pylon-morning.sh — run this at the start of your day

echo "╔══════════════════════════════════╗"
echo "║   Pylon Morning Briefing         ║"
echo "║   $(date '+%A, %B %d %Y')       ║"
echo "╚══════════════════════════════════╝"
echo ""

# Counts
echo "📊 Overview"
echo "   Open Issues:  $(pylon issues count --status open)"
echo "   Open Tasks:   $(pylon tasks count)"
echo ""

# SLA status
echo "⏰ SLA Status"
breaches=$(pylon issues sla --json | jq '[.[] | select(.slaStatus == "breached")] | length')
at_risk=$(pylon issues sla --json | jq '[.[] | select(.slaStatus == "at_risk")] | length')
echo "   Breached: $breaches"
echo "   At Risk:  $at_risk"
echo ""

# Account health
echo "🏢 Account Health"
healthy=$(pylon analytics accounts --type success --json | jq 'length')
risk=$(pylon analytics accounts --type at_risk --json | jq 'length')
echo "   Healthy:  $healthy"
echo "   At Risk:  $risk"
echo ""

# Top feature revenue
echo "💰 Top Feature Requests by ARR"
pylon features revenue --json | jq -r 'sort_by(-.arrImpact) | .[:3] | .[] | "   \(.title): $\(.arrImpact)"'
echo ""

# Unread announcements
unread=$(pylon announcements list --unread --json | jq 'length')
if [ "$unread" -gt 0 ]; then
  echo "📢 Unread Announcements: $unread"
  pylon announcements list --unread
fi
```

## Using with AI Agents

pylon-cli is well-suited as a data source for AI agents (Claude Code, OpenClaw, custom LLM pipelines, etc.). The `--json` flag returns structured data that's easy to inject into prompts.

### Pattern: inject Pylon context into a Claude Code session

```bash
# Generate context file for Claude Code
{
  echo "Current Pylon state as of $(date):"
  echo ""
  echo "Open issues:"
  pylon issues list --json --limit 20
  echo ""
  echo "SLA violations:"
  pylon issues sla --json
  echo ""
  echo "At-risk accounts:"
  pylon analytics accounts --type at_risk --json
} > /tmp/pylon-context.json

# Start Claude Code with context
# (or inject into your agent's system prompt)
```

### Pattern: KB-augmented response generation

```bash
#!/bin/bash
CUSTOMER_QUESTION="$1"

echo "Customer question: $CUSTOMER_QUESTION"
echo ""
echo "KB Answer:"
pylon kb ask "$CUSTOMER_QUESTION"
echo ""
echo "Open issues from same account:"
pylon accounts issues "$ACCOUNT_ID" --json | jq '.[:3] | .[] | {ticketNumber, title, status}'
```

### Pattern: automated issue triage

```bash
#!/bin/bash
# Get new issues from the last hour, generate a digest for each
pylon issues list --json --limit 50 | \
  jq -r '.[] | select(.createdAt > (now - 3600 | todate)) | .id' | \
  while read issue_id; do
    echo "=== Digest for $issue_id ==="
    pylon issues digest "$issue_id"
    echo ""
  done
```

## Rate Limiting

Be considerate of the Pylon API when scripting:

- Add `sleep 1` between iterations in loops to avoid hammering the API
- Use `--limit` flags to fetch only what you need
- Cache results to files when running the same query multiple times in a script
- Avoid running the same command repeatedly in tight loops

```bash
# Good: cache results, process from file
pylon accounts list --json > /tmp/accounts-cache.json
cat /tmp/accounts-cache.json | jq '.[] | .id' | while read id; do
  sleep 0.5  # be nice
  pylon accounts highlights "$id"
done
```

## Environment Variables

Currently, authentication is managed via the `~/.pylon/config.json` file (set by `pylon auth`).

A future improvement would be to support environment variables for use in CI/CD and containerized environments:

```bash
# Not yet implemented, but a logical future addition:
export PYLON_CSRF_TOKEN="your-token"
export PYLON_ORG_ID="org_abc123"
```

If you need credentials in a CI environment today, you can create the config file directly:

```bash
mkdir -p ~/.pylon
cat > ~/.pylon/config.json << EOF
{
  "csrfToken": "$PYLON_CSRF_TOKEN",
  "orgID": "$PYLON_ORG_ID"
}
EOF
chmod 600 ~/.pylon/config.json
```
