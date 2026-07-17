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


_client = chromadb.PersistentClient(path="./chroma_store")
_api_key = settings.GROQ_API_KEY_TRACING or settings.GROQ_API_KEY
_groq_embedding_function = GroqEmbeddingFunction(api_key=_api_key)
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
