#!/usr/bin/env python3
"""
Extract text from PDF files (local or remote URLs)
Usage: python3 extract-pdf.py <file_path_or_url> [output_file]
"""

import sys
import urllib.request
from pathlib import Path

def extract_pdf_text(file_path):
    """Extract text from PDF using available library"""
    try:
        import pdfplumber
        with pdfplumber.open(file_path) as pdf:
            text = ""
            for i, page in enumerate(pdf.pages):
                text += f"\n--- PAGE {i+1} ---\n"
                text += page.extract_text() or ""
            return text
    except ImportError:
        pass

    try:
        import PyPDF2
        with open(file_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            text = ""
            for i, page in enumerate(reader.pages):
                text += f"\n--- PAGE {i+1} ---\n"
                text += page.extract_text() or ""
            return text
    except ImportError:
        pass

    try:
        import pypdf
        with open(file_path, 'rb') as f:
            reader = pypdf.PdfReader(f)
            text = ""
            for i, page in enumerate(reader.pages):
                text += f"\n--- PAGE {i+1} ---\n"
                text += page.extract_text() or ""
            return text
    except ImportError:
        pass

    raise ImportError("No PDF extraction library found. Install one of: pdfplumber, PyPDF2, pypdf")

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 extract-pdf.py <file_path_or_url> [output_file]")
        print("Examples:")
        print("  python3 extract-pdf.py invoice.pdf")
        print("  python3 extract-pdf.py https://example.com/invoice.pdf output.txt")
        sys.exit(1)

    source = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None

    # Download if URL
    if source.startswith('http'):
        print(f"Downloading {source}...")
        pdf_path = "/tmp/downloaded.pdf"
        urllib.request.urlretrieve(source, pdf_path)
        source = pdf_path

    # Extract text
    print(f"Extracting text from {source}...")
    text = extract_pdf_text(source)

    # Output
    if output_file:
        with open(output_file, 'w') as f:
            f.write(text)
        print(f"Saved to {output_file}")
    else:
        print(text)

if __name__ == "__main__":
    main()
