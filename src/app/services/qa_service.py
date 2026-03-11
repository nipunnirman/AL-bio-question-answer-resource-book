"""Service layer for handling QA requests.
This module provides a simple interface for the FastAPI layer to interact
with the multi-agent RAG pipeline without depending directly on LangGraph
or agent implementation details.
"""
import re
from typing import Dict, Any, AsyncGenerator
import json
from langchain_core.messages import HumanMessage
from ..core.agents.graph import run_qa_flow, get_qa_graph
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

async def answer_question_stream(question: str) -> AsyncGenerator[str, None]:
    """Asynchronous generator to stream the QA answer word-by-word via SSE."""
    is_sin = is_sinhala(question)
    llm = create_chat_model(temperature=0.0)
    
    # 1. Translate question if Sinhala
    if is_sin:
        translate_prompt = f"Translate the following Sinhala biology question to English. ONLY output the English translation, no other text:\n{question}"
        english_question_msg = await llm.ainvoke([HumanMessage(content=translate_prompt)])
        actual_question = str(english_question_msg.content)
    else:
        actual_question = question
        
    graph = get_qa_graph()
    initial_state = {
        "question": actual_question,
        "context": "",
        "draft_answer": "",
        "answer": "",
        "citations": {},
    }

    if is_sin:
        # For Sinhala, run graph synchronously (or ainvoke) to get the final English answer, then stream the Sinhala translation
        result = await graph.ainvoke(initial_state)
        
        # Stream the context out early if possible, or wait till the end
        yield f'data: {json.dumps({{"citations": result.get("citations", {{}})}})}\n\n'
        
        translate_back_prompt = f"Translate the following biology text to Sinhala. Keep the markdown formatting (bolding, tables, lists) intact. ONLY output the Sinhala translation, no other text:\n\n{result.get('answer', '')}"
        
        async for chunk in llm.astream([HumanMessage(content=translate_back_prompt)]):
            yield f'data: {json.dumps({{"answer_chunk": chunk.content}})}\n\n'
            
        # Final payload
        yield f'data: {json.dumps({{"context": result.get("context", ""), "english_question": actual_question}})}\n\n'
    else:
        # For English, stream the verification node's LLM output
        final_context = ""
        final_citations = {}
        
        async for event in graph.astream_events(initial_state, version="v2"):
            kind = event["event"]
            if kind == "on_chat_model_stream":
                metadata = event.get("metadata", {})
                checkpoint_ns = metadata.get("checkpoint_ns", "")
                if "verification" in checkpoint_ns:
                    chunk_content = event["data"]["chunk"].content
                    if chunk_content:
                        yield f'data: {json.dumps({{"answer_chunk": chunk_content}})}\n\n'
            elif kind == "on_chain_end" and event.get("name") == "LangGraph":
                # The entire graph ended, capture the final state output
                output_state = event["data"].get("output", {})
                if isinstance(output_state, dict):
                    final_context = output_state.get("context", "")
                    final_citations = output_state.get("citations", {})
                    
        # Send final context after stream finishes
        yield f'data: {json.dumps({{"context": final_context, "citations": final_citations}})}\n\n'