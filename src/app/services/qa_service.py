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

    For Sinhala questions:
      - Translates the question to English ONLY for the vector DB search
      - Passes the original Sinhala question + 'sinhala' response_language to the pipeline
      - The answer agents generate the answer natively in Sinhala (no back-translation)
    For English questions:
      - Sent directly to the pipeline as-is
    """
    is_sin = is_sinhala(question)

    if is_sin:
        llm = create_chat_model(temperature=0.0)

        # Translate ONLY for the vector search query — preserve biological meaning
        translate_prompt = (
            "You are a Sri Lankan A/L Biology expert fluent in both Sinhala and English.\n"
            "Translate the following Sinhala biology question into clear, natural English.\n"
            "Preserve all biological terminology accurately. Only output the English translation, nothing else.\n\n"
            f"Sinhala question:\n{question}"
        )
        english_query = str(llm.invoke([HumanMessage(content=translate_prompt)]).content).strip()

        # Run RAG: retrieval uses English query, but answer is generated natively in Sinhala
        result = run_qa_flow(
            question=english_query,          # used for vector DB search only
            original_question=question,       # original Sinhala — used for answer generation
            response_language="sinhala",      # agents will write the answer in Sinhala natively
        )
        result["english_question"] = english_query

    else:
        # English: plain flow, no translation needed
        result = run_qa_flow(question=question, response_language="english")

    return result