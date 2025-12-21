from typing import Any

import pandas as pd


def compute_summary(
    df_pkh: pd.DataFrame,
    df_persen: pd.DataFrame,
    df_abs: pd.DataFrame,
    year: int,
) -> dict[str, Any]:
    summary: dict[str, Any] = {"year": year}

    pkh_year = df_pkh[df_pkh["tahun"] == year]
    persen_year = df_persen[df_persen["tahun"] == year]
    abs_year = df_abs[df_abs["tahun"] == year]

    summary["total_penerima_pkh"] = int(pkh_year["jumlah_penerima_manfaat"].sum()) if not pkh_year.empty else 0
    summary["rata_persen_kemiskinan"] = float(persen_year["persentase_penduduk_miskin"].mean()) if not persen_year.empty else 0.0
    summary["total_penduduk_miskin_ribu"] = float(abs_year["jumlah_penduduk_miskin"].sum()) if not abs_year.empty else 0.0

    return summary


def compute_trend(metric: str, df_pkh: pd.DataFrame, df_persen: pd.DataFrame) -> list[dict[str, Any]]:
    if metric == "pkh":
        grouped = df_pkh.groupby("tahun", as_index=False)["jumlah_penerima_manfaat"].sum()
        return grouped.rename(columns={"jumlah_penerima_manfaat": "value"}).to_dict(orient="records")

    grouped = df_persen.groupby("tahun", as_index=False)["persentase_penduduk_miskin"].mean()
    return grouped.rename(columns={"persentase_penduduk_miskin": "value"}).to_dict(orient="records")


def compute_kabkota_metric(
    metric: str,
    year: int,
    df_pkh: pd.DataFrame,
    df_persen: pd.DataFrame,
    df_abs: pd.DataFrame,
) -> list[dict[str, Any]]:
    if metric == "pkh":
        df_year = df_pkh[df_pkh["tahun"] == year]
        return (
            df_year[["kode_kabupaten_kota", "nama_kabupaten_kota", "jumlah_penerima_manfaat"]]
            .rename(columns={"jumlah_penerima_manfaat": "value"})
            .sort_values("value", ascending=False)
            .to_dict(orient="records")
        )

    if metric == "kemiskinan_abs":
        df_year = df_abs[df_abs["tahun"] == year]
        return (
            df_year[["kode_kabupaten_kota", "nama_kabupaten_kota", "jumlah_penduduk_miskin"]]
            .rename(columns={"jumlah_penduduk_miskin": "value"})
            .sort_values("value", ascending=False)
            .to_dict(orient="records")
        )

    df_year = df_persen[df_persen["tahun"] == year]
    return (
        df_year[["kode_kabupaten_kota", "nama_kabupaten_kota", "persentase_penduduk_miskin"]]
        .rename(columns={"persentase_penduduk_miskin": "value"})
        .sort_values("value", ascending=False)
        .to_dict(orient="records")
    )
