"""Utilities for serializing retrieved document chunks."""

from typing import List

from langchain_core.documents import Document


from typing import List, Tuple, Dict, Any

def serialize_chunks_with_ids(docs: List[Document]) -> Tuple[str, Dict[str, Any]]:
    """Serialize a list of Document objects into a formatted CONTEXT string with stable IDs.

    Formats chunks with stable IDs [C1], [C2], etc.
    Returns both the context string and a citation map.

    Args:
        docs: List of Document objects with metadata.

    Returns:
        Tuple containing:
        - Formatted string with all chunks serialized and labeled.
        - Dictionary mapping chunk IDs (e.g., "C1") to metadata.
    """
    context_parts = []
    citation_map = {}

    for idx, doc in enumerate(docs, start=1):
        chunk_id = f"C{idx}"
        
        # Extract metadata
        page_num = doc.metadata.get("page") or doc.metadata.get(
            "page_number", "unknown"
        )
        source = doc.metadata.get("source", "unknown")
        
        # Format chunk with stable ID
        chunk_header = f"[{chunk_id}] Chunk from page {page_num}:"
        chunk_content = doc.page_content.strip()

        context_parts.append(f"{chunk_header}\n{chunk_content}")
        
        # Populate citation map
        citation_map[chunk_id] = {
            "id": chunk_id,
            "page": page_num,
            "source": source,
            "snippet": chunk_content[:150] + "..." if len(chunk_content) > 150 else chunk_content
        }

    return "\n\n".join(context_parts), citation_map
