import sys
import os
from pathlib import Path

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from src.app.core.retrieval.vector_store import _get_vector_store

def index_txt(file_path: Path) -> int:
    print(f"Loading {file_path}...")
    loader = TextLoader(str(file_path), encoding='utf-8')
    docs = loader.load()

    print("Splitting text...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    texts = text_splitter.split_documents(docs)

    print(f"Adding {len(texts)} chunks to Pinecone...")
    vector_store = _get_vector_store()
    vector_store.add_documents(texts)
    return len(texts)

def main():
    p = Path("data/uploads/sinhala1_ocr.txt")
    if p.exists():
        try:
            count = index_txt(p)
            print(f"✅ Successfully indexed {count} chunks from {p.name}")
        except Exception as e:
            print(f"❌ Failed to index {p.name}: {e}")
    else:
        print(f"⚠ File not found: {p}")

if __name__ == "__main__":
    main()
