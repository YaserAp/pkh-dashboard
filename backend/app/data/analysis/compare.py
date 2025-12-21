from typing import Any

import pandas as pd


def compute_compare(
    df_pkh: pd.DataFrame,
    df_persen: pd.DataFrame,
    df_abs: pd.DataFrame,
    year: int,
) -> list[dict[str, Any]]:
    pkh_year = df_pkh[df_pkh["tahun"] == year]
    persen_year = df_persen[df_persen["tahun"] == year]
    abs_year = df_abs[df_abs["tahun"] == year]

    merged = pkh_year.merge(
        persen_year,
        on=["kode_kabupaten_kota", "nama_kabupaten_kota", "tahun"],
        how="left",
    ).merge(
        abs_year,
        on=["kode_kabupaten_kota", "nama_kabupaten_kota", "tahun"],
        how="left",
    )

    if merged.empty:
        return []

    merged = merged[
        [
            "kode_kabupaten_kota",
            "nama_kabupaten_kota",
            "jumlah_penerima_manfaat",
            "persentase_penduduk_miskin",
            "jumlah_penduduk_miskin",
        ]
    ]

    return merged.sort_values("jumlah_penerima_manfaat", ascending=False).to_dict(orient="records")
