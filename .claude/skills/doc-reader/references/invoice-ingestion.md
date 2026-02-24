# Invoice Ingestion Workflow

When the task is to get an invoice PDF **into the CRM database** (not just extract text), follow this full workflow.

## Overview

The goal is to ensure invoice data is accurately stored in the Invoices database with:
- Correct amounts and dates from the PDF (source of truth)
- Links to the related Opportunity
- Access to the PDF file via Document URL

## Full Workflow

### Step 1: Locate the PDF

**Check local files first:**
```bash
find output/invoices -name "*client_name*" -o -name "*invoice*"
```

**If not local, search Gmail:**

See [email-attachments.md](email-attachments.md) for the full Gmail → download → extract workflow.

### Step 2: Extract and Parse the PDF

Run the extraction script:
```bash
python3 .claude/skills/doc-reader/scripts/extract-pdf.py output/invoices/<filename>.pdf
```

**Pull out these key fields from the extracted text:**

| Field | Where to find it |
|-------|------------------|
| **Amount** | Total line (including HST/tax) |
| **Due Date** | "DUE DATE" or "Payment Due" section |
| **Invoice Date** | Top of invoice or date issued |
| **Line Items** | Description, quantity, rate columns |
| **HST/Tax** | Tax line (e.g., "HST (13%)") |
| **Currency** | Usually "CAD" or "USD" near total |
| **Payment details** | Bank account, reference numbers |

### Step 3: Find or Create Invoice Record

**Fetch the Invoices database:**
- Database URL: `https://www.notion.so/bc09dc1adbfa40279ff18beff54bd720`
- Data source ID: `collection://7c6b468d-d74f-4302-bf47-cc97afc2f6a9`

Use `notion-fetch` to get all existing invoice records:

```
id: "https://www.notion.so/bc09dc1adbfa40279ff18beff54bd720"
```

**Check if a record already exists:**
- Search for invoice name matching the client
- Match by amount and invoice date if multiple invoices exist

**If no record exists:**
- Create a new invoice entry using `notion-create-pages`
- Link it to the Opportunity page

### Step 4: Update the Invoice Record

Use `notion-update-page` with `update_properties` command.

**Required fields:**

| Property | Format | Example | Notes |
|----------|--------|---------|-------|
| Invoice Name | Text | "Caddie AI - Invoice 2 (50%)" | Client name + invoice number |
| Amount | Number | 14125 | Total INCLUDING HST/tax |
| date:Invoice Date:start | ISO date | "2026-01-19" | Date invoice was issued |
| date:Invoice Date:is_datetime | 0 or 1 | 0 | Always 0 for dates |
| date:Due Date:start | ISO date | "2026-02-18" | **FROM PDF, not calculated** |
| date:Due Date:is_datetime | 0 or 1 | 0 | Always 0 for dates |
| Status | Text | "Sent" | "Draft", "Sent", "Paid", "Overdue", "Cancelled" |
| Document URL | URL | "https://zapier.com/..." | Hydrate URL or S3 link |
| Opportunity | Array of URLs | ["https://www.notion.so/..."] | Link to related Opportunity |
| Notes | Text | "Final 50% - $12,500 + HST (13%)" | Payment split, context |

**Example update:**

```json
{
  "page_id": "2eeffe5c4f7481c1b3d4f59994677b41",
  "command": "update_properties",
  "properties": {
    "Amount": 14125,
    "date:Invoice Date:start": "2026-01-19",
    "date:Invoice Date:is_datetime": 0,
    "date:Due Date:start": "2026-02-18",
    "date:Due Date:is_datetime": 0,
    "Status": "Sent",
    "Document URL": "https://zapier.com/engine/hydrate/...",
    "Notes": "Final 50% payment - $12,500 + HST (13%)"
  }
}
```

### Step 5: Verify the Update

**Fetch the invoice record again** to confirm:
- All fields populated correctly
- Amount matches PDF total (subtotal + tax)
- Due date matches PDF (not auto-calculated)
- Document URL is accessible
- Linked to correct Opportunity

## Critical Guardrails

### ✅ Always Use Due Date from PDF

**CRITICAL: Use the due date FROM THE PDF, not a calculated date.**

**Real error example (Jan 24, 2026):**
- PDF showed: "DUE DATE: February 18, 2026"
- Existing record had: "2026-01-26" (Net 15 auto-calculated from Jan 19)
- This is wrong! The invoice generator used Net 15 default, but the actual invoice sent to client said Feb 18

**Why this matters:**
- Client sees the PDF due date (Feb 18), not the CRM record
- Auto-calculated dates can be wrong if payment terms changed
- PDF is the source of truth for what was actually sent to the client

**How to avoid:**
1. Always extract the "DUE DATE" or "Payment Due" field from the PDF text
2. Parse it as a date (e.g., "February 18, 2026" → "2026-02-18")
3. Never assume Net 15/Net 30 unless you can't find a due date in the PDF

### ✅ Verify HST Calculation

Canadian invoices should have HST. Verify:
```
Subtotal + (Subtotal × HST %) = Total
```

If the math doesn't match, flag it for review.

### ✅ Link to Opportunity

Every invoice should link to an Opportunity. If you can't find the Opportunity:
1. Search the Opportunities database for the client name
2. Ask the user which opportunity this invoice belongs to
3. Don't create invoice records without an opportunity link

## Common Issues

**Issue: Invoice record already exists but is incomplete**
- Solution: Update it with the correct data from the PDF

**Issue: Due date is wrong**
- Cause: Auto-calculated Net 15/30 instead of reading PDF
- Solution: Extract due date from PDF text and update

**Issue: Can't upload PDF to File field**
- Solution: Use Document URL field instead (stores the hydrate/S3 link)

**Issue: Amount doesn't match Opportunity Net Revenue**
- Cause: Invoices can be partial payments (50/50 split)
- Solution: Check Notes field for payment split info

## Related Skills

- **invoice-generator-agivc** - For creating new invoices
- **where-to-find-data** - For CRM database URLs and schemas
- **sync-emails** - For syncing invoice emails to the CRM
