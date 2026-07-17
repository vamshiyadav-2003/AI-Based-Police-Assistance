"""
Semantic (natural-language) search over case records.
- Sentence Transformers generates embeddings for each case's description.
- ChromaDB stores embeddings + metadata (crime_type, date, vehicle, etc.)
  so we can combine metadata filtering with vector similarity in one query.
- This gives RAG-style retrieval: officer asks in plain English, we retrieve
  the most relevant real case records, then let the LLM summarize them.
"""
import chromadb
from sentence_transformers import SentenceTransformer

from langchain_groq import ChatGroq
from app.core.config import settings
from langchain_core.messages import SystemMessage, HumanMessage

_embedder = SentenceTransformer("all-MiniLM-L6-v2")
_client = chromadb.PersistentClient(path="./chroma_store")
_collection = _client.get_or_create_collection(name="cases")


def index_case(case_id: int, description: str, metadata: dict):
    """Call this whenever a case is created/updated so it becomes searchable."""
    embedding = _embedder.encode(description).tolist()
    _collection.upsert(
        ids=[str(case_id)],
        embeddings=[embedding],
        documents=[description],
        metadatas=[metadata],
    )


def semantic_search(query: str, n_results: int = 10, where: dict | None = None):
    query_embedding = _embedder.encode(query).tolist()
    results = _collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results,
        where=where,  # e.g. {"crime_type": "robbery"}
    )
    return results


def get_search_llm():
    import os
    lc_key = settings.LANGCHAIN_API_KEY_TRACING or settings.LANGCHAIN_API_KEY
    if lc_key:
        os.environ["LANGCHAIN_API_KEY"] = lc_key
        os.environ["LANGCHAIN_TRACING_V2"] = "true"
    else:
        os.environ["LANGCHAIN_TRACING_V2"] = "false"
    return ChatGroq(
        api_key=settings.GROQ_API_KEY_TRACING or settings.GROQ_API_KEY,
        model=settings.GROQ_MODEL,
        temperature=0.2,
    )


RAG_SYSTEM_PROMPT = """You are summarizing search results from a police case database for an officer.
Given the officer's question and a set of retrieved case records, write a short, factual summary
listing the matching cases (case ID, crime type, location, date) and how each relates to the query.
Do not invent details not present in the retrieved records. If no records are relevant, say so plainly.
"""


def answer_with_rag(query: str, where: dict | None = None) -> dict:
    results = semantic_search(query, where=where)

    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    ids = results.get("ids", [[]])[0]

    if not documents:
        return {"answer": "No matching cases found.", "cases": []}

    context_blocks = []
    for case_id, doc, meta in zip(ids, documents, metadatas):
        context_blocks.append(f"Case ID {case_id} | {meta} | Description: {doc}")
    context = "\n".join(context_blocks)

    messages = [
        SystemMessage(content=RAG_SYSTEM_PROMPT),
        HumanMessage(content=f"Officer's question: {query}\n\nRetrieved cases:\n{context}"),
    ]
    llm = get_search_llm()
    response = llm.invoke(messages)

    return {
        "answer": response.content,
        "cases": [{"id": i, "metadata": m, "description": d} for i, m, d in zip(ids, metadatas, documents)],
    }
