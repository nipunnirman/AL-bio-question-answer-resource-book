import fitz
import pdfplumber

def check_pdf(file_path):
    print(f"\n--- Checking {file_path} ---")
    
    # Check with PyMuPDF
    try:
        doc = fitz.open(file_path)
        print(f"PyMuPDF Loaded {doc.page_count} pages.")
        text_fitz = ""
        for page in doc:
            text_fitz += page.get_text()
        print(f"PyMuPDF Total extracted text length: {len(text_fitz.strip())} characters")
        if text_fitz.strip():
            print("--- PyMuPDF First 200 characters ---")
            print(text_fitz.strip()[:200])
    except Exception as e:
        print(f"PyMuPDF failed: {e}")
        
    print()
    
    # Check with pdfplumber
    try:
        with pdfplumber.open(file_path) as pdf:
            print(f"pdfplumber Loaded {len(pdf.pages)} pages.")
            text_plumber = ""
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text_plumber += extracted
            print(f"pdfplumber Total extracted text length: {len(text_plumber.strip())} characters")
            if text_plumber.strip():
                print("--- pdfplumber First 200 characters ---")
                print(text_plumber.strip()[:200])
    except Exception as e:
        print(f"pdfplumber failed: {e}")

if __name__ == "__main__":
    files = [
        "data/uploads/Unit 01-Introduction to Biology.pdf",
        "data/uploads/Unit 02-Chemical and cellular basis of life.pdf",
        "data/uploads/Unit 03-Evolution and diversity of organisms.pdf"
    ]
    for f in files[:1]: # just test first one to see
        check_pdf(f)
