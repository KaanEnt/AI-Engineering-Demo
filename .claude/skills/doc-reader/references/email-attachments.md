# Getting PDFs from Email Attachments

**Learned from real usage (Jan 24, 2026):** When the user says "get invoice into db" or "missing invoice PDF", the file is usually an email attachment, not a local file.

## Workflow: Email → Download → Extract

### Step 1: Search Gmail for the attachment

Use the Zapier MCP's `gmail_find_email` tool:

```
instructions: "Find emails related to [client] invoice with attachments"
query: "client_name invoice has:attachment"
output_hint: "show the subject, from, date, message_id, and attachment_filenames"
```

This returns a list of emails with their attachments. Note the `message_id` and `filename` you need.

### Step 2: Get the attachment URL

Use `gmail_get_attachment_by_filename`:

```
instructions: "Get the [filename] attachment from message id [message_id]"
message_id: "19bd966dfffcf72a"
filename: "Caddie_AI_Invoice_2.pdf"
output_hint: "return the attachment file with its content"
```

This returns a hydrate URL like:
```
https://zapier.com/engine/hydrate/18837913/.eJw9kstyozAU...
```

### Step 3: Download the PDF locally

```bash
curl -L "<attachment_url>" -o /path/to/output/invoices/<filename>.pdf
```

**Important:** Always download to `output/invoices/` for invoice PDFs to keep them organized.

### Step 4: Extract text using the extraction script

```bash
python3 .claude/skills/doc-reader/scripts/extract-pdf.py output/invoices/<filename>.pdf
```

## Key Details

- **Zapier MCP's `gmail_get_attachment_by_filename`** returns a hydrate URL for the file
- **The hydrate URL can be used directly** as the `Document URL` in the Invoices database (no need to re-upload)
- **Download locally anyway** so you can extract text and have a backup copy
- **Organize by type**: invoices go to `output/invoices/`, SOWs to `output/sows/`, etc.

## MCP Server Required

This requires the **agivc-tools** MCP server (Zapier-based Gmail access). If not connected, the user needs to:

1. Visit: https://mcp.zapier.com/share/8JMXNJ18MVMH1LiTS2LbdE
2. Connect their Google account through Zapier
3. Add the MCP server to Claude via the Connect tab

## Common Issues

**"No such tool available" error:**
- The agivc-tools MCP server is not connected
- Tell user to reconnect via `/mcp` command or the setup instructions above

**"requires re-authorization" error:**
- MCP token expired
- STOP immediately and tell user to re-auth the server
- Do NOT continue making calls until reconnected
