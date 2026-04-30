from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    model_dir: str
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    embedding_vector_size: int
    word2vec_window: int
    word2vec_min_count: int
    word2vec_workers: int
    word2vec_sg: int
    word2vec_epochs: int
    word2vec_negative: int
    word2vec_sample: float
    kmeans_random_state: int

    model_config = SettingsConfigDict(env_file=".env")


@lru_cache()
def get_settings():
    return Settings()
