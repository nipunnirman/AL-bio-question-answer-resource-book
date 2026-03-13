import fitz
import sys

def check_pdf(file_path):
    print(f"Checking {file_path}...")
    try:
        doc = fitz.open(file_path)
        print(f"Total pages: {doc.page_count}")
        
        # Check first 5 pages for text
        text_len = 0
        for i in range(min(5, doc.page_count)):
            text = doc[i].get_text()
            text_len += len(text.strip())
            
        print(f"Text length in first 5 pages: {text_len} characters")
        if text_len == 0:
            print("WARNING: No text found. This is likely a scanned PDF (images only).")
        else:
            print("OK: Text is extractable.")
            print(f"First page text sample:\n{doc[0].get_text()[:200]}")
            
    except Exception as e:
        print(f"Error reading PDF: {e}")

if __name__ == "__main__":
    check_pdf("data/uploads/sinhala1.pdf")
