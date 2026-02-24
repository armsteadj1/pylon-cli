# Notifications & Announcements

View your Pylon notifications and workspace announcements from the terminal.

## Notifications

### `pylon notifications list`

List your recent notifications.

```bash
pylon notifications list
pylon notifications list --json
pylon notifications list --csv
```

**Flags:**

| Flag | Description |
|------|-------------|
| `--json` | Output as JSON |
| `--csv` | Output as CSV |

**Example output:**

```
ID              Type            Message                                  Time
─────────────── ─────────────── ──────────────────────────────────────── ────────────────────
notif_abc123    issue_assigned  Issue #1042 assigned to you              2 hours ago
notif_def456    sla_breach      Issue #1038 SLA breached                 5 hours ago
notif_ghi789    mention         @you mentioned in issue #1041            Yesterday
```

Notifications represent events directed at you — assignments, mentions, SLA alerts, and other personalized events in your Pylon workspace.

## Announcements

### `pylon announcements list`

List workspace announcements.

```bash
pylon announcements list
pylon announcements list --unread
pylon announcements list --json
pylon announcements list --csv
```

**Flags:**

| Flag | Description |
|------|-------------|
| `--unread` | Show only unread announcements |
| `--json` | Output as JSON |
| `--csv` | Output as CSV |

**Example output:**

```
ID              Title                              Author       Date
─────────────── ────────────────────────────────── ──────────── ──────────
ann_abc123      New SLA policy effective April 1   Admin        2024-03-20
ann_def456      Updated escalation process         Sarah K.     2024-03-15
ann_ghi789      Q1 retrospective notes             Mike T.      2024-03-10
```

Announcements are broadcast messages to your whole team — policy updates, process changes, important notices.

## Practical Examples

### Check for unread announcements in a daily script

```bash
unread=$(pylon announcements list --unread --json | jq 'length')
if [ "$unread" -gt 0 ]; then
  echo "You have $unread unread announcements:"
  pylon announcements list --unread
fi
```

### Include notifications in a morning briefing

```bash
#!/bin/bash
echo "=== Morning Briefing — $(date +%Y-%m-%d) ==="
echo ""
echo "Open Issues: $(pylon issues count)"
echo "Open Tasks: $(pylon tasks count)"
echo ""
echo "=== Recent Notifications ==="
pylon notifications list
echo ""
echo "=== Unread Announcements ==="
pylon announcements list --unread
```

### Find SLA-related notifications

```bash
pylon notifications list --json | jq '[.[] | select(.type | test("sla"; "i"))]'
```

### Export notifications for audit

```bash
pylon notifications list --csv > notifications-$(date +%Y-%m-%d).csv
```
