import json
import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

from app.core.security import get_current_officer
from app.core.config import settings
from app.models.user import Officer

router = APIRouter(prefix="/evidence", tags=["evidence"])


def get_evidence_llm():
    lc_key = settings.LANGCHAIN_API_KEY_FIR or settings.LANGCHAIN_API_KEY
    if lc_key:
        os.environ["LANGCHAIN_API_KEY"] = lc_key
        os.environ["LANGCHAIN_TRACING_V2"] = "true"
    else:
        os.environ["LANGCHAIN_TRACING_V2"] = "false"
    return ChatGroq(
        api_key=settings.GROQ_API_KEY_FIR or settings.GROQ_API_KEY,
        model=settings.GROQ_MODEL,
        temperature=0.0,
    )


EVIDENCE_SYSTEM_PROMPT = """You are an expert AI forensic and evidence analyst.
Analyze the content of the provided evidence document and generate a structured summary.

Respond ONLY with valid JSON matching this schema:
{
  "summary": string,
  "important_points": [string],
  "suspects": [string],
  "locations": [string],
  "dates": [string]
}
Do not include any preamble, comments, or markdown code blocks (like ```json). Output exactly the JSON string.
"""


def extract_text_from_pdf(content: bytes) -> str:
    try:
        import pypdf
        import io

        pdf_file = io.BytesIO(content)
        reader = pypdf.PdfReader(pdf_file)
        text_content = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                text_content.append(text)
        return "\n".join(text_content)
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="PDF parser dependency 'pypdf' is missing on the server. Please check with admin.",
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF document: {str(e)}")


@router.post("/summarize")
async def summarize_evidence(
    file: UploadFile = File(...),
    _officer: Officer = Depends(get_current_officer),
):
    """Parses text/PDF evidence and returns a structured AI summary with key details."""
    content = await file.read()
    filename = file.filename.lower()

    if filename.endswith(".pdf"):
        text_to_summarize = extract_text_from_pdf(content)
    else:
        # Default to reading as plain text
        try:
            text_to_summarize = content.decode("utf-8")
        except UnicodeDecodeError:
            try:
                text_to_summarize = content.decode("latin-1")
            except Exception:
                raise HTTPException(status_code=400, detail="Unable to decode file content as text.")

    if not text_to_summarize.strip():
        raise HTTPException(status_code=400, detail="The uploaded document is empty.")

    messages = [
        SystemMessage(content=EVIDENCE_SYSTEM_PROMPT),
        HumanMessage(content=text_to_summarize[:25000]),  # Limit to avoid token limit errors
    ]

    llm = get_evidence_llm()
    try:
        response = llm.invoke(messages)
        content_out = response.content.strip()

        # Defensive cleanup
        if content_out.startswith("```"):
            content_out = content_out.strip("`")
            if content_out.lower().startswith("json"):
                content_out = content_out[4:]

        result = json.loads(content_out)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Summarization failed: {str(e)}")
