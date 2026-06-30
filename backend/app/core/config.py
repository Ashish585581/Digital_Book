"""
Application configuration settings.
Loads from environment variables with pydantic-settings.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # Application
    app_name: str = "BookLore"
    app_env: str = "development"
    app_debug: bool = True
    booklore_port: int = 8000

    # Database
    database_url: str = "postgresql+asyncpg://booklore:devpassword@localhost:5432/booklore"
    database_pool_size: int = 20
    database_max_overflow: int = 10

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # JWT Authentication
    jwt_secret_key: str = "dev-secret-key-change-in-production-minimum-32-chars"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # File Storage
    upload_dir: str = "/data/books"
    max_file_size: int = 500 * 1024 * 1024  # 500MB
    cover_dir: str = "/data/covers"
    max_cover_size: int = 5 * 1024 * 1024  # 5MB

    # CORS
    cors_allowed_origins: list[str] = ["http://localhost:3000"]

    # Rate Limiting
    rate_limit_login: int = 5  # per minute
    rate_limit_register: int = 3  # per minute
    rate_limit_refresh: int = 10  # per minute


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()