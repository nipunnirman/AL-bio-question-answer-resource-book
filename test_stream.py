import asyncio
import json
from src.app.core.agents.graph import get_qa_graph

async def test():
    graph = get_qa_graph()
    initial_state = {
        "question": "What is DNA?",
        "context": "",
        "draft_answer": "",
        "answer": "",
        "citations": {},
    }
    
    # We want to know if we can stream just the verification node
    async for event in graph.astream_events(initial_state, version="v2"):
        kind = event["event"]
        if kind == "on_chat_model_stream":
            print("STREAM METADATA:", event["metadata"])
            break
        elif kind == "on_chain_end":
            if event["name"] == "LangGraph":
                print("END GRAPH:", {k: v for k, v in event["data"]["output"].items() if k != 'context'})

if __name__ == "__main__":
    asyncio.run(test())
