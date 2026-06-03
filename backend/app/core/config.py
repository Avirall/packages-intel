from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # App
    app_name: str = "OSS Sentinel"
    app_env: str = "development"

    # Auth
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # MongoDB
    mongodb_url: str
    mongodb_db_name: str = "oss_sentinel"

    # Neo4j AuraDB
    neo4j_uri: str
    neo4j_user: str = "neo4j"
    neo4j_password: str

    # Aura Agent
    aura_client_id: str
    aura_client_secret: str
    aura_agent_endpoint: str

    # GitHub
    github_token: str

    # CORS
    allowed_origins: str = "http://localhost:3000"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]


settings = Settings()
