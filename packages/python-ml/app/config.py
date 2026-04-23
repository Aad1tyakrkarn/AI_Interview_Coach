from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    llm_model_path: str = "models/llm"
    whisper_model: str = "base"
    cors_origins: str = "*"
    ml_cache_dir: str = ".cache/models"
    app_name: str = "Interview Platform ML Service"
    app_version: str = "0.1.0"
    groq_api_key: str = ""
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8000

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "protected_namespaces": ("settings_",), "extra": "ignore"}


settings = Settings()
