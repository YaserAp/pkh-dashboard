from typing import Any

import pandas as pd


def compute_effectiveness(
    df_pkh: pd.DataFrame,
    df_persen: pd.DataFrame,
    start: int,
    end: int,
) -> list[dict[str, Any]]:
    pkh_grouped = (
        df_pkh[(df_pkh["tahun"] >= start) & (df_pkh["tahun"] <= end)]
        .groupby("tahun", as_index=False)["jumlah_penerima_manfaat"]
        .sum()
        .rename(columns={"jumlah_penerima_manfaat": "total_pkh"})
    )

    persen_grouped = (
        df_persen[(df_persen["tahun"] >= start) & (df_persen["tahun"] <= end)]
        .groupby("tahun", as_index=False)["persentase_penduduk_miskin"]
        .mean()
        .rename(columns={"persentase_penduduk_miskin": "avg_kemiskinan"})
    )

    merged = pkh_grouped.merge(persen_grouped, on="tahun", how="inner").sort_values("tahun")
    if merged.empty:
        return []

    merged["delta_pkh"] = merged["total_pkh"].diff()
    merged["delta_kemiskinan"] = merged["avg_kemiskinan"].diff()
    def _ratio(row):
        if pd.isna(row["delta_pkh"]) or row["delta_pkh"] == 0:
            return None
        return row["delta_kemiskinan"] / row["delta_pkh"]

    merged["ratio"] = merged.apply(_ratio, axis=1)

    records = merged.to_dict(orient="records")
    return records
