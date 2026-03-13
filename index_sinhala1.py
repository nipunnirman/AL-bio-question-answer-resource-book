import sys
import os
from pathlib import Path

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.app.core.retrieval.vector_store import index_documents

def main():
    p = Path("data/uploads/sinhala1.pdf")
    if p.exists():
        print(f"Indexing {p}...")
        try:
            count = index_documents(p)
            print(f"✅ Successfully indexed {count} chunks from {p.name}")
        except Exception as e:
            print(f"❌ Failed to index {p.name}: {e}")
    else:
        print(f"⚠ File not found: {p}")

if __name__ == "__main__":
    main()
