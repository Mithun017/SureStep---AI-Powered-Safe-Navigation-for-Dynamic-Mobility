from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

load_dotenv()

class Settings(BaseSettings):
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-1.5-flash"
    DATABASE_URL: str = ""
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    class Config:
        env_file = ".env"

settings = Settings()
