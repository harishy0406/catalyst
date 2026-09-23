from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "CATALYST Smart Operator Assistant API"
    app_version: str = "2.0.0"
    debug: bool = False
    port: int = 3000

    database_url: str = (
        "postgresql://postgres.jigixaomkpwngwhoacbb:%40Catalyst-2003@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres"
    )
    db_host: str = "aws-0-ap-southeast-2.pooler.supabase.com"
    db_port: int = 5432
    db_name: str = "postgres"
    db_user: str = "postgres.jigixaomkpwngwhoacbb"
    db_password: str = "@Catalyst-2003"
    db_sslmode: str = "require"
    db_pool_min: int = 1
    db_pool_max: int = 10

    jwt_secret: str = "catalyst-hackathon-production-secret-key-32bytes-secure!"
    jwt_algorithm: str = "HS256"
    access_token_expire_hours: int = 168
    jwt_expires_in_days: int = 7

    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:8081",
        "http://localhost:19000",
        "http://localhost:19006",
        "*",
    ]


settings = Settings()
