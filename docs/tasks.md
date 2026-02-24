# Tasks

View and count tasks tracked in your Pylon workspace.

## Commands

### `pylon tasks list`

List tasks.

```bash
pylon tasks list
pylon tasks list --limit 200
pylon tasks list --json
pylon tasks list --csv > tasks.csv
```

**Flags:**

| Flag | Description | Default |
|------|-------------|---------|
| `--limit <n>` | Maximum number of results | `100` |
| `--json` | Output as JSON | — |
| `--csv` | Output as CSV | — |

**Example output:**

```
ID              Title                              Due Date    Assigned To   Status
─────────────── ────────────────────────────────── ─────────── ───────────── ────────
task_abc123     Schedule QBR with Acme Corp        2024-03-15  Sarah K.      open
task_def456     Follow up on API integration       2024-03-12  Mike T.       open
task_ghi789     Send renewal proposal - Globex     2024-03-10  Sarah K.      complete
```

### `pylon tasks count`

Quickly count open tasks without fetching full records.

```bash
pylon tasks count
```

Returns a single integer. Useful in scripts and status dashboards.

**Example:**

```bash
$ pylon tasks count
42
```

## Practical Examples

### Check your task count at a glance

```bash
echo "Open tasks: $(pylon tasks count)"
```

### Export tasks to CSV for project management

```bash
pylon tasks list --limit 500 --csv > tasks-$(date +%Y-%m-%d).csv
```

### Find overdue tasks

```bash
today=$(date +%Y-%m-%d)
pylon tasks list --json | jq --arg today "$today" '[.[] | select(.dueDate != null and .dueDate < $today and .status == "open")]'
```

### List tasks assigned to a specific person

```bash
pylon tasks list --json | jq '[.[] | select(.assignee.name | test("Sarah"; "i"))]'
```

### Group tasks by assignee

```bash
pylon tasks list --json | jq 'group_by(.assignee.name) | .[] | {assignee: .[0].assignee.name, count: length}'
```

### Morning task briefing

```bash
#!/bin/bash
count=$(pylon tasks count)
echo "You have $count open tasks."
echo ""
pylon tasks list --limit 10
```
