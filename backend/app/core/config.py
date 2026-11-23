import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Abdul Salam Dairy Farm System"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "abdulsalam-dairy-secret-jwt-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///database/app.db")
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
