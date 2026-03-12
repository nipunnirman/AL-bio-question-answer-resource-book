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

    if is_sin:
        llm = create_chat_model(temperature=0.0)

        # Step 1: Translate Sinhala question → clear, biologically accurate English
        translate_prompt = (
            "You are a Sri Lankan A/L Biology expert fluent in both Sinhala and English.\n"
            "Translate the following Sinhala biology question into clear, natural English.\n"
            "Preserve all biological terminology accurately. Only output the English translation, nothing else.\n\n"
            f"Sinhala question:\n{question}"
        )
        english_question = str(llm.invoke([HumanMessage(content=translate_prompt)]).content).strip()

        # Step 2: Run RAG on the English question
        result = run_qa_flow(english_question)
        result["english_question"] = english_question

        # Step 3: Translate the English answer back to natural, friendly Sinhala
        translate_back_prompt = (
            "You are a Sri Lankan A/L Biology expert and teacher.\n"
            "Translate the following English biology answer into natural, friendly Sinhala "
            "as if you are explaining it to a student. Keep markdown formatting (bold, tables, lists) intact.\n"
            "Only output the Sinhala translation, nothing else.\n\n"
            f"English answer:\n{result.get('answer', '')}"
        )
        result["answer"] = str(llm.invoke([HumanMessage(content=translate_back_prompt)]).content).strip()

    else:
        # English question: send directly to RAG
        result = run_qa_flow(question)

    return result