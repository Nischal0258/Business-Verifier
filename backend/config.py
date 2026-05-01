from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    openai_api_key: str
    cors_origins: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"]
    database_url: str = "sqlite+aiosqlite:///./business_verify.db"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Parse CORS_ORIGINS from comma-separated string if provided
        cors_env = os.getenv("CORS_ORIGINS")
        if cors_env:
            self.cors_origins = [origin.strip() for origin in cors_env.split(",")]


settings = Settings()
