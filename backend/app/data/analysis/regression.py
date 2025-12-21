from typing import Any

import pandas as pd
import statsmodels.api as sm


def compute_regression(
    df_pkh: pd.DataFrame,
    df_persen: pd.DataFrame,
    start: int,
    end: int,
) -> dict[str, Any]:
    pkh_range = df_pkh[(df_pkh["tahun"] >= start) & (df_pkh["tahun"] <= end)]
    persen_range = df_persen[(df_persen["tahun"] >= start) & (df_persen["tahun"] <= end)]

    merged = pkh_range.merge(
        persen_range,
        on=["kode_kabupaten_kota", "nama_kabupaten_kota", "tahun"],
        how="inner",
    ).dropna(subset=["jumlah_penerima_manfaat", "persentase_penduduk_miskin"])

    if merged.empty:
        return {"n": 0, "intercept": None, "slope": None, "r2": None, "p_value": None}

    x = merged["jumlah_penerima_manfaat"].astype(float)
    y = merged["persentase_penduduk_miskin"].astype(float)
    x_const = sm.add_constant(x)

    model = sm.OLS(y, x_const).fit()

    return {
        "n": int(len(merged)),
        "intercept": float(model.params["const"]),
        "slope": float(model.params["jumlah_penerima_manfaat"]),
        "r2": float(model.rsquared),
        "p_value": float(model.pvalues["jumlah_penerima_manfaat"]),
    }
