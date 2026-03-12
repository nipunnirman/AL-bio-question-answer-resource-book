"""
Agent implementations for the multi-agent RAG flow.

This module defines three LangChain agents:
1. Retrieval Agent  – gathers relevant textbook context
2. Summarization Agent – generates a draft answer
3. Verification Agent – validates and corrects the answer

Used for the A/L Biology Grade 12 & 13 RAG system.
"""

from typing import List, Dict, Any

from langchain.agents import create_agent
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage

from ..llm.factory import create_chat_model
from .prompts import (
    RETRIEVAL_SYSTEM_PROMPT,
    SUMMARIZATION_SYSTEM_PROMPT,
    VERIFICATION_SYSTEM_PROMPT,
)

from .state import QAState
from .tools import retrieval_tool



def _extract_last_ai_content(messages: List[Any]) -> str:
    """
    Extract the content of the last AIMessage from a message list.
    """
    for msg in reversed(messages):
        if isinstance(msg, AIMessage):
            return str(msg.content)

    return ""



# Retrieval Agent
retrieval_agent = create_agent(
    model=create_chat_model(),
    tools=[retrieval_tool],
    system_prompt=RETRIEVAL_SYSTEM_PROMPT,
)

# Summarization Agent
summarization_agent = create_agent(
    model=create_chat_model(),
    tools=[],
    system_prompt=SUMMARIZATION_SYSTEM_PROMPT,
)

# Verification Agent
verification_agent = create_agent(
    model=create_chat_model(),
    tools=[],
    system_prompt=VERIFICATION_SYSTEM_PROMPT,
)




def retrieval_node(state: QAState) -> QAState:
    """
    Retrieval Agent Node

    Steps:
    1. Send user question to Retrieval Agent.
    2. Agent calls the retrieval tool to search the vector database.
    3. Extract the retrieved context from ToolMessage.
    4. Store the context inside state["context"].
    """

    question = state["question"]

    result = retrieval_agent.invoke(
        {"messages": [HumanMessage(content=question)]}
    )

    messages = result.get("messages", [])

    context = ""
    citations: Dict[str, Any] = {}

    # Prefer ToolMessage output (retrieval tool result)
    for msg in reversed(messages):
        if isinstance(msg, ToolMessage):

            context = str(msg.content)

            # Extract citations metadata if present
            if msg.artifact and isinstance(msg.artifact, dict):
                citations = msg.artifact.get("citations", {})

            break

    return {
        "context": context,
        "citations": citations,
    }




def summarization_node(state: QAState) -> QAState:
    """
    Summarization Agent Node

    Steps:
    1. Send Question + Context to Summarization Agent.
    2. Agent generates a draft answer using only the context.
    3. Store the draft answer in state["draft_answer"].
    """

    # Use original question (in user's language) if available, otherwise fall back to translated
    question = state.get("original_question") or state["question"]
    context = state.get("context", "")
    response_language = state.get("response_language", "english")

    language_instruction = (
        "IMPORTANT: Write your entire answer in Sinhala (සිංහල). "
        "Explain naturally and in a student-friendly way, like a helpful teacher would. "
        "Keep all markdown formatting (bold, tables, lists) intact but in Sinhala.\n\n"
        if response_language == "sinhala" else ""
    )

    user_content = f"""
{language_instruction}Question:
{question}

Context:
{context}

Please answer the question clearly using point-by-point explanations.
"""

    result = summarization_agent.invoke(
        {"messages": [HumanMessage(content=user_content)]}
    )

    messages = result.get("messages", [])

    draft_answer = _extract_last_ai_content(messages)

    return {
        "draft_answer": draft_answer
    }




def verification_node(state: QAState) -> QAState:
    """
    Verification Agent Node

    Steps:
    1. Send Question + Context + Draft Answer to Verification Agent.
    2. Agent checks for hallucinations.
    3. Removes unsupported claims.
    4. Returns final verified answer.
    """

    question = state.get("original_question") or state["question"]
    context = state.get("context", "")
    draft_answer = state.get("draft_answer", "")
    response_language = state.get("response_language", "english")

    language_instruction = (
        "IMPORTANT: Your final verified answer must be written entirely in Sinhala (සිංහල). "
        "Do not switch to English. Keep markdown formatting intact.\n\n"
        if response_language == "sinhala" else ""
    )

    user_content = f"""
{language_instruction}Question:
{question}

Context:
{context}

Draft Answer:
{draft_answer}

Verify the draft answer and ensure all claims are supported by the context.
Remove hallucinations and keep citations accurate.
"""

    result = verification_agent.invoke(
        {"messages": [HumanMessage(content=user_content)]}
    )

    messages = result.get("messages", [])

    final_answer = _extract_last_ai_content(messages)

    return {
        "answer": final_answer
    }