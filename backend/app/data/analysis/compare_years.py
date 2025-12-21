from typing import Any

import pandas as pd


def compute_compare_years(
    df: pd.DataFrame,
    value_column: str,
    year_a: int,
    year_b: int,
) -> list[dict[str, Any]]:
    df_a = df[df["tahun"] == year_a][
        ["kode_kabupaten_kota", "nama_kabupaten_kota", value_column]
    ].rename(columns={value_column: "value_a"})
    df_b = df[df["tahun"] == year_b][
        ["kode_kabupaten_kota", "nama_kabupaten_kota", value_column]
    ].rename(columns={value_column: "value_b"})

    merged = df_a.merge(
        df_b, on=["kode_kabupaten_kota", "nama_kabupaten_kota"], how="inner"
    )
    if merged.empty:
        return []

    merged["delta"] = merged["value_b"] - merged["value_a"]
    return merged.sort_values("delta", ascending=False).to_dict(orient="records")
