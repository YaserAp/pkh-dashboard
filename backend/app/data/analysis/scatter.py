from typing import Any

import pandas as pd


def compute_scatter(
    df_pkh: pd.DataFrame,
    df_persen: pd.DataFrame,
    year: int,
) -> list[dict[str, Any]]:
    pkh_year = df_pkh[df_pkh["tahun"] == year]
    persen_year = df_persen[df_persen["tahun"] == year]

    merged = pkh_year.merge(
        persen_year,
        on=["kode_kabupaten_kota", "nama_kabupaten_kota", "tahun"],
        how="inner",
    )

    if merged.empty:
        return []

    return merged[
        [
            "kode_kabupaten_kota",
            "nama_kabupaten_kota",
            "jumlah_penerima_manfaat",
            "persentase_penduduk_miskin",
        ]
    ].to_dict(orient="records")
