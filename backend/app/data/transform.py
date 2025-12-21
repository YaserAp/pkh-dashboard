from pathlib import Path
from typing import Dict

import pandas as pd

from app.core.config import get_settings
from app.core.logging import get_logger
from app.data.ingest import load_source_datasets
from app.data.normalize import filter_jabar, normalize_common
from app.data.paths import PROCESSED_FILES, resolve_processed_path
from app.data.validate import validate_all

logger = get_logger(__name__)


def _coerce_numeric(df: pd.DataFrame, columns: list[str]) -> pd.DataFrame:
    df = df.copy()
    for col in columns:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    return df


def build_fact_tables(
    source_dir: str | None = None,
    output_dir: str | None = None,
) -> Dict[str, pd.DataFrame]:
    settings = get_settings()
    processed_dir = output_dir or settings.data_dir_processed

    datasets = load_source_datasets(source_dir)
    validate_all(datasets.items())

    normalized: Dict[str, pd.DataFrame] = {}
    for key, df in datasets.items():
        df = normalize_common(df)
        df = filter_jabar(df)
        normalized[key] = df

    persen = normalized["kemiskinan_persen"]
    pkh = normalized["pkh"]
    abs_miskin = normalized["kemiskinan_abs"]
    kategori = normalized["kemiskinan_kategori"]

    persen = _coerce_numeric(persen, ["kode_kabupaten_kota", "tahun", "persentase_penduduk_miskin"])
    pkh = _coerce_numeric(pkh, ["kode_kabupaten_kota", "tahun", "jumlah_penerima_manfaat"])
    abs_miskin = _coerce_numeric(abs_miskin, ["kode_kabupaten_kota", "tahun", "jumlah_penduduk_miskin"])
    kategori = _coerce_numeric(kategori, ["tahun", "jumlah_penduduk"])

    start_year = settings.default_start_year
    end_year = settings.default_end_year

    persen = persen[(persen["tahun"] >= start_year) & (persen["tahun"] <= end_year)]
    pkh = pkh[(pkh["tahun"] >= start_year) & (pkh["tahun"] <= end_year)]
    abs_miskin = abs_miskin[(abs_miskin["tahun"] >= start_year) & (abs_miskin["tahun"] <= end_year)]

    dim_kabupaten = (
        pd.concat(
            [
                persen[["kode_kabupaten_kota", "nama_kabupaten_kota", "kode_provinsi", "nama_provinsi"]],
                pkh[["kode_kabupaten_kota", "nama_kabupaten_kota", "kode_provinsi", "nama_provinsi"]],
            ],
            ignore_index=True,
        )
        .dropna(subset=["kode_kabupaten_kota"])
        .drop_duplicates(subset=["kode_kabupaten_kota"])
        .sort_values("nama_kabupaten_kota")
        .reset_index(drop=True)
    )

    fact_pkh = pkh[["tahun", "kode_kabupaten_kota", "nama_kabupaten_kota", "jumlah_penerima_manfaat"]]
    fact_persen = persen[["tahun", "kode_kabupaten_kota", "nama_kabupaten_kota", "persentase_penduduk_miskin"]]
    fact_abs = abs_miskin[["tahun", "kode_kabupaten_kota", "nama_kabupaten_kota", "jumlah_penduduk_miskin"]]
    fact_kategori = kategori[["tahun", "periode_bulan", "kategori_daerah", "jumlah_penduduk"]]

    output_path = Path(processed_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    dim_kabupaten.to_csv(resolve_processed_path(processed_dir, PROCESSED_FILES["dim_kabupaten"]), index=False)
    fact_pkh.to_csv(resolve_processed_path(processed_dir, PROCESSED_FILES["fact_pkh"]), index=False)
    fact_persen.to_csv(resolve_processed_path(processed_dir, PROCESSED_FILES["fact_kemiskinan_persen"]), index=False)
    fact_abs.to_csv(resolve_processed_path(processed_dir, PROCESSED_FILES["fact_kemiskinan_abs"]), index=False)
    fact_kategori.to_csv(resolve_processed_path(processed_dir, PROCESSED_FILES["fact_kemiskinan_kategori"]), index=False)

    logger.info("Processed datasets saved to %s", processed_dir)

    return {
        "dim_kabupaten": dim_kabupaten,
        "fact_pkh": fact_pkh,
        "fact_kemiskinan_persen": fact_persen,
        "fact_kemiskinan_abs": fact_abs,
        "fact_kemiskinan_kategori": fact_kategori,
    }


def load_processed_tables(processed_dir: str | None = None) -> Dict[str, pd.DataFrame]:
    settings = get_settings()
    base_dir = processed_dir or settings.data_dir_processed
    base_path = Path(base_dir)
    if not base_path.exists():
        raise FileNotFoundError(f"Processed data dir not found: {base_dir}")

    tables: Dict[str, pd.DataFrame] = {}
    for key, filename in PROCESSED_FILES.items():
        path = resolve_processed_path(base_dir, filename)
        tables[key] = pd.read_csv(path)

    return tables


def ensure_processed_tables(
    source_dir: str | None = None,
    processed_dir: str | None = None,
) -> Dict[str, pd.DataFrame]:
    settings = get_settings()
    base_dir = processed_dir or settings.data_dir_processed
    Path(base_dir).mkdir(parents=True, exist_ok=True)

    all_exist = True
    for filename in PROCESSED_FILES.values():
        path = resolve_processed_path(base_dir, filename)
        if not path.exists():
            all_exist = False
            break

    if all_exist:
        return load_processed_tables(base_dir)

    return build_fact_tables(source_dir=source_dir, output_dir=base_dir)
