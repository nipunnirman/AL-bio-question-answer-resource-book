import sys
from langchain_community.document_loaders import PyPDFLoader

def check_pdf():
    loader = PyPDFLoader("data/uploads/Unit 09 Biology.pdf", mode="single")
    docs = loader.load()
    print(f"Loaded {len(docs)} documents.")
    total_len = sum(len(d.page_content.strip()) for d in docs)
    print(f"Total extracted text length: {total_len} characters")
    if total_len > 0:
        print("First 100 characters:", docs[0].page_content[:100])

if __name__ == "__main__":
    check_pdf()
