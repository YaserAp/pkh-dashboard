from typing import Any

import pandas as pd


def compute_insights(
    df_pkh: pd.DataFrame,
    df_persen: pd.DataFrame,
    start: int,
    end: int,
) -> dict[str, Any]:
    pkh_start = df_pkh[df_pkh["tahun"] == start][
        ["kode_kabupaten_kota", "nama_kabupaten_kota", "jumlah_penerima_manfaat"]
    ].rename(columns={"jumlah_penerima_manfaat": "pkh_start"})
    pkh_end = df_pkh[df_pkh["tahun"] == end][
        ["kode_kabupaten_kota", "nama_kabupaten_kota", "jumlah_penerima_manfaat"]
    ].rename(columns={"jumlah_penerima_manfaat": "pkh_end"})

    misk_start = df_persen[df_persen["tahun"] == start][
        ["kode_kabupaten_kota", "nama_kabupaten_kota", "persentase_penduduk_miskin"]
    ].rename(columns={"persentase_penduduk_miskin": "misk_start"})
    misk_end = df_persen[df_persen["tahun"] == end][
        ["kode_kabupaten_kota", "nama_kabupaten_kota", "persentase_penduduk_miskin"]
    ].rename(columns={"persentase_penduduk_miskin": "misk_end"})

    merged = pkh_start.merge(
        pkh_end, on=["kode_kabupaten_kota", "nama_kabupaten_kota"], how="inner"
    ).merge(
        misk_start, on=["kode_kabupaten_kota", "nama_kabupaten_kota"], how="inner"
    ).merge(
        misk_end, on=["kode_kabupaten_kota", "nama_kabupaten_kota"], how="inner"
    )

    if merged.empty:
        return {"top_improve": [], "top_worsen": [], "top_pkh_increase": []}

    merged["delta_kemiskinan"] = merged["misk_end"] - merged["misk_start"]
    merged["delta_pkh"] = merged["pkh_end"] - merged["pkh_start"]

    top_improve = (
        merged.sort_values("delta_kemiskinan", ascending=True)
        .head(5)
        .to_dict(orient="records")
    )
    top_worsen = (
        merged.sort_values("delta_kemiskinan", ascending=False)
        .head(5)
        .to_dict(orient="records")
    )
    top_pkh_increase = (
        merged.sort_values("delta_pkh", ascending=False)
        .head(5)
        .to_dict(orient="records")
    )

    return {
        "top_improve": top_improve,
        "top_worsen": top_worsen,
        "top_pkh_increase": top_pkh_increase,
    }
