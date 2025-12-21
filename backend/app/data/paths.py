from pathlib import Path

DATASET_FILES = {
    "kemiskinan_persen": "bps-od_17058_persentase_penduduk_miskin__kabupatenkota_data.csv",
    "pkh": "dinsos-od_20731_jml_penerima_bantuan_program_keluarga_harapan_pkh__v2_data.csv",
    "kemiskinan_abs": "bps-od_16425_jumlah_penduduk_miskin_berdasarkan_kabupatenkota_data.csv",
    "kemiskinan_kategori": "bps-od_17112_jumlah_penduduk_miskin_berdasarkan_daerah_v9_data.csv",
}

PROCESSED_FILES = {
    "dim_kabupaten": "dim_kabupaten.csv",
    "fact_pkh": "fact_pkh.csv",
    "fact_kemiskinan_persen": "fact_kemiskinan_persen.csv",
    "fact_kemiskinan_abs": "fact_kemiskinan_abs.csv",
    "fact_kemiskinan_kategori": "fact_kemiskinan_kategori.csv",
}


def resolve_source_path(base_dir: str, filename: str) -> Path:
    return Path(base_dir) / filename


def resolve_processed_path(base_dir: str, filename: str) -> Path:
    return Path(base_dir) / filename
