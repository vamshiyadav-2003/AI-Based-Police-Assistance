"""
AI Chat Assistant for officers.
- Uses Groq for fast LLM inference (Llama 3 / Gemma / Mixtral served via Groq API).
- Wrapped through LangChain so every call is auto-traced in LangSmith
  (as long as LANGCHAIN_API_KEY + LANGCHAIN_TRACING_V2=true are set in .env).
"""
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from app.core.config import settings

SYSTEM_PROMPT = """You are an AI assistant for police officers. You help with:
- Explaining legal sections (IPC/BNS, CrPC/BNSS, evidence act) in plain language
- Explaining FIR filing procedures and required documentation
- Guiding officers through investigation workflow and protocol
- Answering general procedural questions

Rules:
- Be precise and cite section numbers when you reference a law, but note that officers
  should verify against the current bare act, since laws are periodically amended.
- If you are not certain about a specific legal provision, say so rather than guessing.
- Keep answers concise and practical, formatted for quick reading on a dashboard.
"""

def get_chat_llm():
    import os
    lc_key = settings.LANGCHAIN_API_KEY_CHAT or settings.LANGCHAIN_API_KEY
    if lc_key:
        os.environ["LANGCHAIN_API_KEY"] = lc_key
        os.environ["LANGCHAIN_TRACING_V2"] = "true"
    else:
        os.environ["LANGCHAIN_TRACING_V2"] = "false"
    return ChatGroq(
        api_key=settings.GROQ_API_KEY_CHAT or settings.GROQ_API_KEY,
        model=settings.GROQ_MODEL,
        temperature=0.2,
    )


def get_chat_reply(user_message: str, history: list[dict] | None = None) -> str:
    """
    history: optional list of {"role": "user"|"assistant", "content": "..."}
    Passing history lets the assistant maintain context across a conversation.
    """
    messages = [SystemMessage(content=SYSTEM_PROMPT)]

    if history:
        for turn in history:
            if turn["role"] == "user":
                messages.append(HumanMessage(content=turn["content"]))
            else:
                messages.append(AIMessage(content=turn["content"]))

    messages.append(HumanMessage(content=user_message))

    # This call is automatically captured as a LangSmith trace (run name
    # defaults to the class name; set LANGCHAIN_PROJECT in .env to organize traces).
    llm = get_chat_llm()
    response = llm.invoke(messages)
    return response.content
