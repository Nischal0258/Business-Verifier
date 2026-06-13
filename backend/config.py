import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator
from typing import List, Union


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    gemini_api_key: str = ""
    serper_api_key: str = ""
    alpha_vantage_api_key: str = ""
    finnhub_api_key: str = ""
    nvidia_api_key: str = ""
    groq_api_key: str = ""
    cors_origins: Union[List[str], str] = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"]
    database_url: str = ""

    @model_validator(mode="after")
    def set_defaults(self):
        import logging
        log = logging.getLogger("config")
        log.info(f"GEMINI_API_KEY: {'set' if self.gemini_api_key else 'NOT set'}")
        log.info(f"SERPER_API_KEY: {'set' if self.serper_api_key else 'NOT set'}")
        log.info(f"ALPHA_VANTAGE_API_KEY: {'set' if self.alpha_vantage_api_key else 'NOT set'}")
        log.info(f"FINNHUB_API_KEY: {'set' if self.finnhub_api_key else 'NOT set'}")
        log.info(f"NVIDIA_API_KEY: {'set' if self.nvidia_api_key else 'NOT set'}")
        log.info(f"GROQ_API_KEY: {'set' if self.groq_api_key else 'NOT set'}")

        if isinstance(self.cors_origins, str):
            self.cors_origins = [origin.strip() for origin in self.cors_origins.split(",")]
        if not self.database_url:
            # Use a path relative to the backend folder
            base_dir = os.path.dirname(os.path.abspath(__file__))
            db_dir = os.path.join(base_dir, "data")
            os.makedirs(db_dir, exist_ok=True)
            db_path = os.path.join(db_dir, "business_verify.db")
            self.database_url = f"sqlite+aiosqlite:///{db_path}"
        return self


settings = Settings()
