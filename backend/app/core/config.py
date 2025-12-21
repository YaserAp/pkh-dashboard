from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "PKH Dashboard API"
    app_version: str = "0.1.0"

    project_root: str = "D:\\pkh-dashboard"
    source_data_dir: str = "D:\\!Sains data\\data"
    data_dir_raw: str = "D:\\pkh-dashboard\\data\\raw"
    data_dir_processed: str = "D:\\pkh-dashboard\\data\\processed"
    data_dir_cache: str = "D:\\pkh-dashboard\\data\\cache"
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
