from pandas import DataFrame

from app.core.config import get_settings


def normalize_common(df: DataFrame) -> DataFrame:
    df = df.copy()

    if "nama_kabupaten_kota" in df.columns:
        df["nama_kabupaten_kota"] = (
            df["nama_kabupaten_kota"]
            .astype(str)
            .str.upper()
            .str.replace(r"\s+", " ", regex=True)
            .str.strip()
        )

    if "nama_provinsi" in df.columns:
        df["nama_provinsi"] = (
            df["nama_provinsi"].astype(str).str.upper().str.strip()
        )

    return df


def filter_jabar(df: DataFrame) -> DataFrame:
    settings = get_settings()
    if "kode_provinsi" in df.columns:
        df = df[df["kode_provinsi"] == settings.prov_code_jabar]
    if "nama_provinsi" in df.columns:
        df = df[df["nama_provinsi"] == settings.prov_name_jabar]
    return df
