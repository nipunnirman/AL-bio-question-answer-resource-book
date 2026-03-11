import fitz
import pdfplumber

def check_pdf(file_path):
    print(f"\n--- Checking {file_path} ---")
    
    # Check with PyMuPDF
    try:
        doc = fitz.open(file_path)
        print(f"PyMuPDF Loaded {doc.page_count} pages.")
        text_fitz = ""
        # Just check the first 10 pages to be fast
        for i in range(min(10, doc.page_count)):
            text_fitz += doc[i].get_text()
            
        print(f"PyMuPDF Total extracted text length (first 10 pages): {len(text_fitz.strip())} characters")
        if text_fitz.strip():
            print("--- PyMuPDF First 500 characters ---")
            print(text_fitz.strip()[:500])
    except Exception as e:
        print(f"PyMuPDF failed: {e}")
        
    print()
    
    # Check with pdfplumber
    try:
        with pdfplumber.open(file_path) as pdf:
            print(f"pdfplumber Loaded {len(pdf.pages)} pages.")
            text_plumber = ""
            for i in range(min(10, len(pdf.pages))):
                extracted = pdf.pages[i].extract_text()
                if extracted:
                    text_plumber += extracted
            print(f"pdfplumber Total extracted text length (first 10 pages): {len(text_plumber.strip())} characters")
            if text_plumber.strip():
                print("--- pdfplumber First 500 characters ---")
                print(text_plumber.strip()[:500])
    except Exception as e:
        print(f"pdfplumber failed: {e}")

if __name__ == "__main__":
    check_pdf("data/uploads/grade12.pdf")
