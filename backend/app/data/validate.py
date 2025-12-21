from typing import Iterable

from pandas import DataFrame

REQUIRED_COLUMNS = {
    "kemiskinan_persen": {
        "kode_provinsi",
        "nama_provinsi",
        "kode_kabupaten_kota",
        "nama_kabupaten_kota",
        "persentase_penduduk_miskin",
        "tahun",
    },
    "pkh": {
        "kode_provinsi",
        "nama_provinsi",
        "kode_kabupaten_kota",
        "nama_kabupaten_kota",
        "jumlah_penerima_manfaat",
        "tahun",
    },
    "kemiskinan_abs": {
        "kode_provinsi",
        "nama_provinsi",
        "kode_kabupaten_kota",
        "nama_kabupaten_kota",
        "jumlah_penduduk_miskin",
        "tahun",
    },
    "kemiskinan_kategori": {
        "kode_provinsi",
        "nama_provinsi",
        "kategori_daerah",
        "periode_bulan",
        "jumlah_penduduk",
        "tahun",
    },
}


def validate_dataset(df: DataFrame, dataset_key: str) -> None:
    required = REQUIRED_COLUMNS.get(dataset_key)
    if not required:
        raise ValueError(f"Unknown dataset key: {dataset_key}")

    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Missing columns for {dataset_key}: {sorted(missing)}")


def validate_all(datasets: Iterable[tuple[str, DataFrame]]) -> None:
    for key, df in datasets:
        validate_dataset(df, key)
