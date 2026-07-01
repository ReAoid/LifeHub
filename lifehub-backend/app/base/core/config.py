"""Global configuration using pydantic-settings."""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables / .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Application ---
    APP_NAME: str = "LifeHub"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # --- Database (SQLite by default — no server needed) ---
    DATABASE_URL: str = "sqlite+aiosqlite:///./lifehub.db"

    # --- JWT ---
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # --- CORS ---
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # --- Plugin Switches ---
    PLUGIN_DAILY_ENABLE: bool = True
    PLUGIN_FINANCE_ENABLE: bool = True
    PLUGIN_HEALTH_ENABLE: bool = False
    PLUGIN_HOBBY_ENABLE: bool = False

    # --- Paths ---
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent


settings = Settings()
