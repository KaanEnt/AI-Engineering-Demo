---
name: doc-reader
model: claude-haiku-4-5
description: Extract text from documents (PDFs, and other formats). Use when you need to read invoice PDFs, SOWs, contracts, proposals, or any document attachment. Also use when ingesting invoice/document PDFs from email into the CRM database. Other skills should reference this skill when they need document extraction.
location: project
activationKeywords:
  - "read pdf"
  - "extract pdf"
  - "read document"
  - "extract text from"
  - "parse pdf"
  - "get invoice"
  - "missing invoice"
  - "invoice into db"
  - "invoice pdf"
  - "get attachment"
---

# Document Reader

Extract text from documents including PDFs, with support for local files and remote URLs (S3, web links).

## Quick Start

```bash
python3 .claude/skills/doc-reader/scripts/extract-pdf.py <file_path_or_url> [output_file]
```

**Supports:** Local files and remote URLs (S3 attachment links, web URLs).
**Requires:** `pdfplumber` (install with `python3 -m pip install pdfplumber` if not available).

## When to Use

**ALWAYS use this skill when dealing with any PDF attachment.** Never skip PDF extraction or guess content from email text or filenames.

Use cases:
- **Invoice PDFs**: Extract amount, HST/tax, due date, payment details, line items
- **SOW/contract attachments**: Extract scope, terms, signatures, dates
- **Proposals**: Extract pricing, deliverables, timeline
- **Meeting notes**: Extract action items, decisions
- **Any PDF attachment**: Get accurate text content

## Usage Examples

### Extract from remote URL (most common)
```bash
python3 .claude/skills/doc-reader/scripts/extract-pdf.py "https://s3.amazonaws.com/.../invoice.pdf"
```

### Extract from local file
```bash
python3 .claude/skills/doc-reader/scripts/extract-pdf.py /path/to/document.pdf
```

### Save output to file
```bash
python3 .claude/skills/doc-reader/scripts/extract-pdf.py invoice.pdf output.txt
```

## Working with Email Attachments

When PDFs are in email attachments (invoices, contracts, SOWs), see **[references/email-attachments.md](references/email-attachments.md)** for the complete workflow:
- Search Gmail for attachments
- Download PDFs locally
- Extract text with this skill

## Invoice Ingestion into CRM

When the task is to get an invoice PDF into the Invoices database (not just extract text), see **[references/invoice-ingestion.md](references/invoice-ingestion.md)** for the full 5-step workflow:
1. Locate the PDF (local or email)
2. Extract and parse key fields
3. Find or create invoice record
4. Update with correct data from PDF
5. Verify accuracy

**Critical:** Always use the due date from the PDF itself, not auto-calculated dates.

## Output Format

```
--- PAGE 1 ---
[Text content from page 1]

--- PAGE 2 ---
[Text content from page 2]
```

## Installation

If `pdfplumber` is not installed:

```bash
python3 -m pip install pdfplumber
```

The script falls back to `PyPDF2` or `pypdf` if `pdfplumber` is unavailable.

## For Other Skills

When your skill needs to read a PDF:

1. **Reference this skill** in your documentation
2. **Do not duplicate** PDF extraction instructions
3. **Always extract PDFs first** before making assumptions about content
4. **Use the script path**: `.claude/skills/doc-reader/scripts/extract-pdf.py`

Example reference in another skill:
```markdown
When processing invoice PDFs, use the **doc-reader** skill to extract content:
\`\`\`bash
python3 .claude/skills/doc-reader/scripts/extract-pdf.py "<pdf_url>"
\`\`\`
```

## Why Extract PDFs?

**PDFs are the source of truth.** Email text, opportunity fields, and filenames are often inaccurate or incomplete.

Common issues when NOT extracting PDFs:
- ❌ Wrong amounts (partial payments vs full project value)
- ❌ Missing HST/tax calculations
- ❌ Incorrect due dates (inferred vs actual)
- ❌ Missing payment method details
- ❌ Currency confusion (USD vs CAD)

## Future Expansion

This skill will support additional document formats:
- DOCX (Word documents)
- TXT (plain text)
- HTML (web pages saved as documents)
- Images with OCR (receipts, scanned documents)

## Script Reference

Location: `.claude/skills/doc-reader/scripts/extract-pdf.py`

The script automatically:
- Downloads remote URLs to `/tmp/`
- Tries multiple PDF libraries (pdfplumber → PyPDF2 → pypdf)
- Outputs page-by-page text
- Cleans up temporary files
