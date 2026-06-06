from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./tarifaia.db"
    SECRET_KEY: str = "dev-secret-key-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4.1"
    STORAGE_DOCUMENTOS: str = "./storage/documentos"
    STORAGE_PLANTILLAS: str = "./storage/plantillas"
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = {"env_file": (".env", "../.env")}


settings = Settings()
