import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.app.core.retrieval.vector_store import _get_vector_store

def main():
    vs = _get_vector_store()
    
    # Let's search for some term that would likely appear in Unit 09 or 10, or just a generic term
    # and print all distinct sources.
    results = vs.similarity_search("biology", k=50)
    
    sources = set()
    for doc in results:
        sources.add(doc.metadata.get("source", "Unknown"))
        
    print("Distinct sources found in top 50 results:")
    for source in sources:
        print(f"- {source}")

if __name__ == "__main__":
    main()
