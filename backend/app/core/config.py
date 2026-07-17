import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://username:password@localhost:5432/police_db"

    # Auth
    SECRET_KEY: str = "dev-secret-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # SMTP Config for OTP emails
    EMAIL_USERNAME: str = ""
    EMAIL_PASSWORD: str = ""
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_PORT: int = 587
    MAIL_TLS: bool = True
    MAIL_SSL: bool = False

    # Groq Default & Service-Specific
    GROQ_API_KEY: str = ""
    GROQ_API_KEY_FIR: str = ""
    GROQ_API_KEY_CHAT: str = ""
    GROQ_API_KEY_TRACING: str = ""
    GROQ_MODEL: str = "llama-3.1-70b-versatile"

    # LangSmith Default & Service-Specific
    LANGCHAIN_TRACING_V2: bool = True
    LANGCHAIN_API_KEY: str = ""
    LANGCHAIN_API_KEY_FIR: str = ""
    LANGCHAIN_API_KEY_CHAT: str = ""
    LANGCHAIN_API_KEY_TRACING: str = ""
    LANGCHAIN_PROJECT: str = "police-ai-assistant"


    class Config:
        env_file = ".env"


settings = Settings()

# LangSmith reads these from the process environment directly,
# so we push the values there once settings are loaded.
os.environ.setdefault("LANGCHAIN_TRACING_V2", str(settings.LANGCHAIN_TRACING_V2).lower())
if settings.LANGCHAIN_API_KEY:
    os.environ.setdefault("LANGCHAIN_API_KEY", settings.LANGCHAIN_API_KEY)
os.environ.setdefault("LANGCHAIN_PROJECT", settings.LANGCHAIN_PROJECT)
