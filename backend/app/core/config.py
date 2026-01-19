from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings

PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    app_name: str = "PKH Dashboard API"
    app_version: str = "0.1.0"

    project_root: str = str(PROJECT_ROOT)
    source_data_dir: str = str(PROJECT_ROOT / "data" / "raw")
    data_dir_raw: str = str(PROJECT_ROOT / "data" / "raw")
    data_dir_processed: str = str(PROJECT_ROOT / "data" / "processed")
    data_dir_cache: str = str(PROJECT_ROOT / "data" / "cache")
    jabar_geojson_path: str = "data\\raw\\jabar-kabkota.geojson"

    default_start_year: int = 2017
    default_end_year: int = 2024

    prov_code_jabar: int = 32
    prov_name_jabar: str = "JAWA BARAT"

    cors_allow_origins: list[str] = ["*"]

    class Config:
        env_prefix = "PKH_"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
