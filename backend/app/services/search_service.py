import os
import chromadb
from chromadb.api.types import EmbeddingFunction, Documents, Embeddings
from groq import Groq
from langchain_groq import ChatGroq
from app.core.config import settings
from langchain_core.messages import SystemMessage, HumanMessage


class GroqEmbeddingFunction(EmbeddingFunction):
    def __init__(self, api_key: str, model_name: str = "nomic-embed-text-v1.5"):
        self.client = Groq(api_key=api_key)
        self.model_name = model_name

    def __call__(self, input: Documents) -> Embeddings:
        embeddings = []
        for text in input:
            response = self.client.embeddings.create(
                model=self.model_name,
                input=text
            )
            embeddings.append(response.data[0].embedding)
        return embeddings


# Use EphemeralClient (in-memory) for cloud/Render deployment compatibility.
# PersistentClient requires a writable disk which is not available on free-tier hosts.
_client = chromadb.EphemeralClient()
_api_key = settings.GROQ_API_KEY_TRACING or settings.GROQ_API_KEY

# Only create embedding function if we have an API key (avoids crash at import time)
_groq_embedding_function = GroqEmbeddingFunction(api_key=_api_key) if _api_key else None
_collection = _client.get_or_create_collection(
    name="cases",
    embedding_function=_groq_embedding_function
)


def index_case(case_id: int, description: str, metadata: dict):
    """Call this whenever a case is created/updated so it becomes searchable."""
    _collection.upsert(
        ids=[str(case_id)],
        documents=[description],
        metadatas=[metadata],
    )


def semantic_search(query: str, n_results: int = 10, where: dict | None = None):
    results = _collection.query(
        query_texts=[query],
        n_results=n_results,
        where=where,
    )
    return results


def get_search_llm():
    lc_key = settings.LANGCHAIN_API_KEY_TRACING or settings.LANGCHAIN_API_KEY
    if settings.LANGCHAIN_TRACING_V2 and lc_key:
        os.environ["LANGCHAIN_TRACING_V2"] = "true"
        os.environ["LANGCHAIN_API_KEY"] = lc_key
        os.environ["LANGCHAIN_PROJECT"] = settings.LANGCHAIN_PROJECT

    groq_key = settings.GROQ_API_KEY_TRACING or settings.GROQ_API_KEY
    return ChatGroq(
        api_key=groq_key,
        model=settings.GROQ_MODEL,
        temperature=0.0
    )


def answer_with_rag(query: str, where: dict | None = None) -> dict:
    """
    RAG-based case search: retrieves semantically similar cases from ChromaDB,
    then uses an LLM to generate a natural-language answer.
    """
    # Step 1: Retrieve relevant cases from vector store
    try:
        results = semantic_search(query, n_results=5, where=where)
        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
    except Exception:
        documents = []
        metadatas = []

    # Step 2: Build context from retrieved documents
    if documents:
        context_parts = []
        for i, (doc, meta) in enumerate(zip(documents, metadatas), 1):
            meta_str = ", ".join(f"{k}: {v}" for k, v in (meta or {}).items())
            context_parts.append(f"Case {i}: {doc}\nMetadata: {meta_str}")
        context = "\n\n".join(context_parts)
    else:
        context = "No relevant cases found in the database."

    # Step 3: Ask LLM to summarize / answer based on retrieved cases
    system_prompt = (
        "You are an AI assistant for police officers. "
        "Use the provided case context to answer the officer's query. "
        "Be concise and precise. If no relevant cases are found, say so clearly."
    )
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"Query: {query}\n\nContext:\n{context}"),
    ]

    try:
        llm = get_search_llm()
        response = llm.invoke(messages)
        answer = response.content
    except Exception as e:
        answer = f"Search service unavailable: {str(e)}"

    return {
        "query": query,
        "answer": answer,
        "source_cases": metadatas,
    }
