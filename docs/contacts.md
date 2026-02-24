# Contacts

Browse and query contacts (people) across your Pylon workspace.

## Commands

### `pylon contacts list`

List contacts, optionally filtered by account.

```bash
pylon contacts list
pylon contacts list --account acc_abc123
pylon contacts list --limit 100
pylon contacts list --csv > contacts.csv
```

**Flags:**

| Flag | Description | Default |
|------|-------------|---------|
| `--account <accountId>` | Filter contacts to a specific account | — |
| `--limit <n>` | Maximum number of results | `50` |
| `--json` | Output as JSON | — |
| `--csv` | Output as CSV | — |

**Example output:**

```
ID              Name             Email                    Account
─────────────── ──────────────── ──────────────────────── ─────────────
con_abc123      Jane Smith       jane@acme.com            Acme Corp
con_def456      Bob Jones        bob@globex.com           Globex Inc
con_ghi789      Alice Chen       alice@initech.com        Initech
```

### `pylon contacts get <id>`

Get full details for a single contact.

```bash
pylon contacts get con_abc123
pylon contacts get con_abc123 --json
```

Returns contact profile information including name, email, title, phone, associated account, and any custom fields or metadata tracked in Pylon.

## Finding Contact IDs

Contact IDs start with `con_`. To find them:

```bash
# Search contacts by name using jq
pylon contacts list --json | jq '.[] | select(.name | test("Jane"; "i")) | {id, name, email}'

# Get all contacts for an account
pylon accounts contacts acc_abc123 --json | jq '.[] | {id, name, email}'
```

## Practical Examples

### Filter contacts by account

```bash
# First find the account ID
pylon accounts list --json | jq '.[] | select(.name | test("Acme"; "i")) | {id, name}'

# Then list contacts for that account
pylon contacts list --account acc_abc123
```

### Export all contacts to CSV

```bash
pylon contacts list --limit 1000 --csv > all-contacts.csv
```

### Export contacts for a specific account

```bash
ACCOUNT_ID="acc_abc123"
pylon contacts list --account $ACCOUNT_ID --csv > acme-contacts.csv
```

### Find contacts without email addresses

```bash
pylon contacts list --json --limit 500 | jq '[.[] | select(.email == null or .email == "") | {name, account}]'
```

### Get all contact emails for an account (e.g., for a mailing list)

```bash
pylon accounts contacts acc_abc123 --json | jq -r '.[].email' | grep -v null
```

### Cross-reference contacts with issues

```bash
# Get all open issues and extract unique account IDs
pylon issues list --json --limit 200 | jq -r '.[].account.id' | sort -u | while read account_id; do
  account_name=$(pylon accounts get "$account_id" --json | jq -r '.name')
  contact_count=$(pylon contacts list --account "$account_id" --json | jq 'length')
  issue_count=$(pylon accounts issues "$account_id" --json | jq 'length')
  echo "$account_name: $issue_count issues, $contact_count contacts"
done
```

## Relationship to Accounts

Contacts are always associated with an account. The recommended pattern for working with contacts is:

1. Find the account with `pylon accounts list` or `pylon accounts list --json | jq`
2. Get contacts for that account with `pylon accounts contacts <id>` or `pylon contacts list --account <id>`

Both approaches return the same data. `pylon accounts contacts <id>` is a convenience shorthand.
