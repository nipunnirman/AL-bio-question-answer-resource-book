"""Service layer for handling QA requests.
This module provides a simple interface for the FastAPI layer to interact
with the multi-agent RAG pipeline without depending directly on LangGraph
or agent implementation details.
"""
import re
from typing import Dict, Any
from langchain_core.messages import HumanMessage
from ..core.agents.graph import run_qa_flow
from ..core.llm.factory import create_chat_model

def is_sinhala(text: str) -> bool:
    """Check if text contains Sinhala unicode characters."""
    return bool(re.search(r'[\u0D80-\u0DFF]', text))

def answer_question(question: str) -> Dict[str, Any]:
    """Run the multi-agent QA flow for a given question.

    Args:
        question: User's natural language question about the A/L Biology knowledge base.

    Returns:
        Dictionary containing at least `answer` and `context` keys.
    """
    
    # Run RAG directly with the native question (OpenAI handles English/Sinhala inherently)
    result = run_qa_flow(question)
    
    return result