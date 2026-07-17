"""
Converts a raw complaint (officer/citizen text) into a structured FIR draft.
Uses Groq LLM with a strict JSON-output prompt so the result can be
mapped directly onto the Case model / FIR PDF template.
"""
import json
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

from app.core.config import settings

import os

DEFAULT_FIR_SYSTEM_PROMPT = """You convert raw citizen/officer complaint text into a structured FIR draft.

Respond ONLY with valid JSON (no markdown, no preamble, no code fences) matching this schema:
{
  "crime_type": string,              // best-guess category, e.g. "Theft", "Robbery", "Assault", "Cybercrime", "Fraud"
  "suggested_sections": [string],    // likely applicable BNS 2023 sections, e.g. ["BNS Section 303 - Theft"]
  "complainant_name": string|null,
  "complainant_contact": string|null,
  "incident_date": string|null,      // ISO 8601 if determinable, else null
  "incident_location": string|null,
  "vehicle_involved": string|null,
  "named_entities": {
    "persons": [string],
    "locations": [string],
    "dates": [string]
  },
  "narrative_summary": string,       // clean, formal 3-5 sentence account of the incident
  "missing_information": [string]    // required FIR fields that are missing/unclear, e.g. "exact time of incident"
}

If the input is in Hindi/Telugu/another language, translate the narrative_summary into English but
keep complainant_name in its original script.
Only output the JSON object, nothing else.
"""

PROMPT_FILE_PATH = os.path.join(os.path.dirname(__file__), "fir_prompt.txt")

def get_fir_prompt() -> str:
    if os.path.exists(PROMPT_FILE_PATH):
        try:
            with open(PROMPT_FILE_PATH, "r", encoding="utf-8") as f:
                return f.read().strip()
        except Exception:
            pass
    return DEFAULT_FIR_SYSTEM_PROMPT

def update_fir_prompt(new_prompt: str):
    with open(PROMPT_FILE_PATH, "w", encoding="utf-8") as f:
        f.write(new_prompt)


def get_fir_llm():
    import os
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


def generate_fir_draft(raw_complaint_text: str) -> dict:
    messages = [
        SystemMessage(content=get_fir_prompt()),
        HumanMessage(content=raw_complaint_text),
    ]
    llm = get_fir_llm()
    response = llm.invoke(messages)
    content = response.content.strip()

    # Defensive cleanup in case the model wraps output in code fences despite instructions
    if content.startswith("```"):
        content = content.strip("`")
        if content.lower().startswith("json"):
            content = content[4:]

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return {
            "error": "Could not parse AI output as JSON",
            "raw_output": content,
        }
