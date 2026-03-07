"""
Tools available to agents in the multi-agent RAG system.

Currently implemented tools:
- retrieval_tool: retrieves relevant Biology textbook chunks
  from the vector database for the RAG pipeline.
"""

from langchain_core.tools import tool

from ..retrieval.vector_store import retrieve
from ..retrieval.serialization import serialize_chunks_with_ids


@tool(response_format="content_and_artifact")
def retrieval_tool(query: str):
    """
    Search the vector database for relevant A/L Biology textbook chunks.

    This tool retrieves the most relevant chunks from the vector store
    (Pinecone / other vector DB) and formats them with stable chunk IDs
    such as [C1], [C2], [C3] so the agents can cite them correctly.

    The retrieved chunks come from:
    - Grade 12 Biology Resource Book
    - Grade 13 Biology Resource Book

    Args:
        query:
            Search query used to retrieve relevant biology concepts.

    Returns:
        Tuple:
            (
                serialized_context,
                artifact
            )

        serialized_context:
            Clean formatted context string with chunk IDs.

        artifact:
            Dictionary containing:
                - docs: raw document objects
                - citations: mapping of chunk IDs → metadata
    """

    # Safety check
    if not query or not query.strip():
        return "No query provided.", {"docs": [], "citations": {}}

    # Retrieve documents from vector store
    docs = retrieve(query, k=4)

    # Handle empty retrieval
    if not docs:
        return "No relevant biology textbook content found.", {
            "docs": [],
            "citations": {}
        }

    # Convert documents into serialized context with chunk IDs
    context, citation_map = serialize_chunks_with_ids(docs)

    artifact = {
        "docs": docs,
        "citations": citation_map
    }

    return context, artifact