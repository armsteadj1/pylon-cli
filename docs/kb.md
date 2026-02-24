# Knowledge Base

Access your Pylon knowledge base — list articles and use AI-powered search to find answers.

## Commands

### `pylon kb list`

List all articles in your knowledge base.

```bash
pylon kb list
pylon kb list --json
pylon kb list --csv > kb-articles.csv
```

**Flags:**

| Flag | Description |
|------|-------------|
| `--json` | Output as JSON |
| `--csv` | Output as CSV |

**Example output:**

```
ID              Title                                   Status
─────────────── ─────────────────────────────────────── ──────────
kb_abc123       How to set up SSO with Okta              published
kb_def456       API rate limits and best practices       published
kb_ghi789       Troubleshooting webhook delivery         published
kb_jkl012       How to export your data                  draft
```

### `pylon kb ask "<question>"`

Ask a question and get an AI-generated answer grounded in your knowledge base content.

```bash
pylon kb ask "How do I configure SSO?"
pylon kb ask "What are the API rate limits?"
pylon kb ask "Why are my webhooks failing?"
```

**This command is genuinely powerful.** It doesn't just search for keywords — it reads your KB content and synthesizes a direct answer to your question, similar to asking a colleague who has read every article in your knowledge base.

**Example:**

```bash
$ pylon kb ask "How do I set up SAML with Okta?"

Based on your knowledge base:

To set up SAML with Okta, you'll need to:

1. In Pylon, go to Settings → Authentication → SAML
2. Copy the Entity ID and ACS URL
3. In Okta, create a new SAML 2.0 application
4. Paste the Entity ID and ACS URL into the Okta app configuration
5. Set the Name ID format to "EmailAddress"
6. Download the Okta metadata XML and upload it to Pylon
7. Enable SAML in Pylon and test with a user

See article: "How to set up SSO with Okta" (kb_abc123)
```

The response cites the relevant source articles so you can link customers directly to the right documentation.

## Use Cases

### Deflecting support tickets

Before escalating or researching a customer question, check if the KB has an answer:

```bash
pylon kb ask "customer question here"
```

If the KB has good coverage, you can often draft a response immediately without digging through docs manually.

### Onboarding support agents

New team members can get up to speed on common questions quickly:

```bash
pylon kb ask "What integrations does Pylon support?"
pylon kb ask "How does billing work?"
pylon kb ask "What happens when a user's account is suspended?"
```

### Building FAQ documents

Generate draft FAQ content from your existing KB:

```bash
questions=(
  "How do I reset my password?"
  "Can I export my data?"
  "What file formats does the API accept?"
  "How do I add a new team member?"
)

for q in "${questions[@]}"; do
  echo "## $q"
  echo ""
  pylon kb ask "$q"
  echo ""
done > faq-draft.md
```

### Using with AI agents

The KB ask command works well as a tool for AI agents (Claude Code, OpenClaw, etc.) that need to answer customer questions:

```bash
# In a Claude Code session or agent pipeline
QUESTION="$CUSTOMER_QUESTION"
ANSWER=$(pylon kb ask "$QUESTION")
# Feed $ANSWER into your agent's context
```

### Audit KB coverage

Find gaps in your documentation by testing common questions:

```bash
# If the answer is "I don't have information about this", the KB needs an article
pylon kb ask "How do I migrate data from Zendesk?"
pylon kb ask "What is the SLA for enterprise customers?"
```

### Export KB for backup or migration

```bash
pylon kb list --json > kb-backup-$(date +%Y-%m-%d).json
```

## Tips

- Questions work best when they're specific and conversational
- Include context in your question: "When a webhook fails, how do I retry it?" is better than "retry webhooks"
- The AI reads your actual KB content — if the answer isn't there, it will say so rather than hallucinating
- Use `--json` with `kb list` to get article IDs for direct linking in responses
