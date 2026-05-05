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

    openai_api_key: str = ""
    cors_origins: Union[List[str], str] = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"]
    database_url: str = ""

    @model_validator(mode="after")
    def set_defaults(self):
        if isinstance(self.cors_origins, str):
            self.cors_origins = [origin.strip() for origin in self.cors_origins.split(",")]
        if not self.database_url:
            db_path = os.path.join(os.path.dirname(__file__), "data", "business_verify.db")
            os.makedirs(os.path.dirname(db_path), exist_ok=True)
            self.database_url = f"sqlite+aiosqlite:///{db_path}"
        return self


settings = Settings()
