import sys
from langchain_community.document_loaders import PyPDFLoader

def check_pdf(file_path):
    print(f"\n--- Checking {file_path} ---")
    try:
        loader = PyPDFLoader(file_path, mode="single")
        docs = loader.load()
        print(f"Loaded {len(docs)} documents (pages).")
        total_len = sum(len(d.page_content.strip()) for d in docs)
        print(f"Total extracted text length: {total_len} characters")
        if total_len > 0:
            print("--- First 500 characters ---")
            print(docs[0].page_content[:500])
            print("----------------------------")
    except Exception as e:
        print(f"Failed to load: {e}")

if __name__ == "__main__":
    check_pdf("data/uploads/sinhala1.pdf")
