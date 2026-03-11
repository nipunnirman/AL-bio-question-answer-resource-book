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
    files = [
        "data/uploads/Unit 01-Introduction to Biology.pdf",
        "data/uploads/Unit 02-Chemical and cellular basis of life.pdf",
        "data/uploads/Unit 03-Evolution and diversity of organisms.pdf"
    ]
    for f in files:
        check_pdf(f)
