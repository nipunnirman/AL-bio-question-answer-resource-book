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
    is_sin = is_sinhala(question)
    
    # 1. Translate question if Sinhala
    if is_sin:
        llm = create_chat_model(temperature=0.0)
        translate_prompt = f"Translate the following Sinhala biology question to English. ONLY output the English translation, no other text:\n{question}"
        english_question = str(llm.invoke([HumanMessage(content=translate_prompt)]).content)
        actual_question = english_question
    else:
        actual_question = question
        
    # 2. Run RAG
    result = run_qa_flow(actual_question)
    
    # 3. Translate the final answer back to Sinhala if the input was Sinhala
    if is_sin:
        translate_back_prompt = f"Translate the following biology text to Sinhala. Keep the markdown formatting (bolding, tables, lists) intact. ONLY output the Sinhala translation, no other text:\n\n{result.get('answer', '')}"
        sinhala_answer = str(llm.invoke([HumanMessage(content=translate_back_prompt)]).content)
        result["answer"] = sinhala_answer
        # Expose the translated English question for debugging/UI purposes if desired
        result["english_question"] = english_question
    return result