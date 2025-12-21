from typing import Any

import pandas as pd


def compute_correlation(
    df_pkh: pd.DataFrame,
    df_persen: pd.DataFrame,
    year: int,
) -> dict[str, Any]:
    pkh_year = df_pkh[df_pkh["tahun"] == year]
    persen_year = df_persen[df_persen["tahun"] == year]

    merged = pkh_year.merge(
        persen_year,
        on=["kode_kabupaten_kota", "nama_kabupaten_kota", "tahun"],
        how="inner",
    )

    if merged.empty:
        return {"n": 0, "r": None}

    r_value = merged["jumlah_penerima_manfaat"].corr(merged["persentase_penduduk_miskin"])
    return {"n": int(len(merged)), "r": float(r_value)}
