# Authentication

Pylon CLI uses your browser session's CSRF token to authenticate with the Pylon GraphQL API. There is no OAuth flow or separate API key system — you reuse the same credentials your browser already has.

## How Pylon Auth Works

When you're logged into Pylon in your browser, every request to `graph.usepylon.com` includes an `x-csrf-token` header. The CLI uses this same token to make API calls on your behalf. This means:

- No separate API key setup required
- The token is tied to your browser session, not your user account permanently
- Tokens expire when your browser session ends (logout, cookie expiry, etc.)
- The CLI stores the token locally so you don't have to re-enter it every time

## Getting Your Token (Step-by-Step)

1. **Open Pylon in Chrome or Firefox** and make sure you're logged in at `app.usepylon.com`

2. **Open DevTools** — press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows/Linux)

3. **Go to the Network tab** in DevTools

4. **Trigger a request** — click anywhere in the Pylon UI (navigate to Issues, Accounts, etc.) to generate some network traffic

5. **Filter for GraphQL requests** — in the Network tab filter box, type `graph.usepylon.com` or look for requests with `graphql` in the path

6. **Click any request** from `graph.usepylon.com`

7. **Go to the Headers subtab** of that request

8. **Find `x-csrf-token`** in the Request Headers section — it looks like a long alphanumeric string

9. **Copy the value** (right-click → Copy Value, or select and copy)

> **Tip:** In Chrome, you can also right-click a request → Copy → Copy as cURL, then find the `-H 'x-csrf-token: ...'` part in the copied command.

## Commands

### `pylon auth --csrf-token <token>`

Saves your CSRF token and automatically discovers your organization ID.

```bash
pylon auth --csrf-token abc123yourtoken...
```

What happens:
1. The CLI makes a `getCurrentUser` GraphQL query using your token
2. From the response, it extracts your `orgID`
3. Both token and orgID are saved to `~/.pylon/config.json`

You can also provide the org ID manually if auto-discovery fails:

```bash
pylon auth --csrf-token abc123yourtoken... --org-id org_abc123
```

### `pylon auth status`

Shows your current authentication state with a masked token.

```
Token:  abcd********************************efgh
Org ID: org_01abc123def456
```

The middle portion of the token is masked with asterisks. If you're not authenticated, this command will tell you so.

### `pylon auth logout`

Removes your stored credentials by deleting the config file.

```bash
pylon auth logout
```

After logout, all commands that require authentication will fail with an error prompting you to run `pylon auth` again.

## Token Expiry and Refresh

CSRF tokens are tied to your browser session. Your token will become invalid if:

- You log out of Pylon in the browser
- Your session expires (browser cookie timeout)
- You clear browser cookies or local storage
- You switch browsers or profiles

When your token expires, CLI commands will return a `401 Unauthorized` error. To refresh:

1. Go back to Pylon in your browser and log in if needed
2. Open DevTools → Network → find any `graph.usepylon.com` request
3. Copy the new `x-csrf-token` value
4. Run `pylon auth --csrf-token <new-token>`

Your `orgID` will be re-discovered automatically, so you don't need to track it separately.

## Config File

Credentials are stored at `~/.pylon/config.json` with permissions `0600` (readable only by your user).

```json
{
  "csrfToken": "your-csrf-token-here",
  "orgID": "org_01abc123def456"
}
```

The `~/.pylon/` directory itself is created with permissions `0700`.

**Do not share this file** — it contains your active session token.

## Troubleshooting

### 401 Unauthorized errors

Your token has expired or is invalid. Follow the [Token Expiry and Refresh](#token-expiry-and-refresh) steps above.

### "Not authenticated" error

You haven't run `pylon auth` yet, or you ran `pylon auth logout`. Run:

```bash
pylon auth --csrf-token <your-token>
```

### Wrong orgID

If commands return data from the wrong organization (or empty results when you expect data), your orgID may be incorrect. You can override it during auth:

```bash
pylon auth --csrf-token <token> --org-id <correct-org-id>
```

To find your orgID, check the Pylon URL in your browser — it often appears as a path segment like `/org_01abc123/issues`.

### Token copied incorrectly

Make sure you copied the token value only, not the header name. The token should be a long string without `x-csrf-token:` prefix.

If you used "Copy as cURL", extract just the token value from: `-H 'x-csrf-token: <THIS PART>'`
