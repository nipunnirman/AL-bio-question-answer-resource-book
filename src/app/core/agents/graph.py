"""
LangGraph orchestration for the linear multi-agent QA flow.

Pipeline:
1. Retrieval Agent
2. Summarization Agent
3. Verification Agent
"""

from functools import lru_cache
from typing import Any, Dict

from langgraph.constants import END, START
from langgraph.graph import StateGraph

from .agents import retrieval_node, summarization_node, verification_node
from .state import QAState


# -------------------------------------------------------
# Graph Builder
# -------------------------------------------------------

def create_qa_graph() -> Any:
    """
    Create and compile the linear multi-agent QA graph.

    Flow:
    START → Retrieval → Summarization → Verification → END
    """

    builder = StateGraph(QAState)

    # Add agent nodes
    builder.add_node("retrieval", retrieval_node)
    builder.add_node("summarization", summarization_node)
    builder.add_node("verification", verification_node)

    # Define pipeline order
    builder.add_edge(START, "retrieval")
    builder.add_edge("retrieval", "summarization")
    builder.add_edge("summarization", "verification")
    builder.add_edge("verification", END)

    return builder.compile()


# -------------------------------------------------------
# Graph Singleton
# -------------------------------------------------------

@lru_cache(maxsize=1)
def get_qa_graph() -> Any:
    """
    Return a cached instance of the compiled QA graph.

    Using LRU cache prevents rebuilding the graph repeatedly,
    improving performance in production environments.
    """
    return create_qa_graph()


# -------------------------------------------------------
# QA Flow Runner
# -------------------------------------------------------

def run_qa_flow(question: str) -> Dict[str, Any]:
    """
    Run the complete multi-agent QA flow.

    Steps:
    1. Initialize state with user question
    2. Execute LangGraph pipeline
    3. Return final results

    Args:
        question: User question (A/L Biology topic)

    Returns:
        dict containing:
        - answer: Final verified answer
        - draft_answer: Draft answer from summarization agent
        - context: Retrieved context
        - citations: Source metadata if available
    """

    graph = get_qa_graph()

    initial_state: QAState = {
        "question": question,
        "context": "",
        "draft_answer": "",
        "answer": "",
        "citations": {},
    }

    final_state = graph.invoke(initial_state)

    return {
        "answer": final_state.get("answer", ""),
        "draft_answer": final_state.get("draft_answer", ""),
        "context": final_state.get("context", ""),
        "citations": final_state.get("citations", {}),
    }