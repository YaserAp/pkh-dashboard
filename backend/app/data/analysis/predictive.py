from __future__ import annotations

from typing import Any, Iterable

import numpy as np
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.holtwinters import ExponentialSmoothing


def _forecast_series_holt(values: pd.Series, horizon: int) -> list[float]:
    values = values.dropna().astype(float)
    if values.empty:
        return [0.0] * horizon
    if len(values) < 2 or values.nunique() == 1:
        return [float(values.iloc[-1])] * horizon

    model = ExponentialSmoothing(
        values,
        trend="add",
        seasonal=None,
        initialization_method="estimated",
    )
    fit = model.fit(optimized=True)
    forecast = fit.forecast(horizon)
    return [float(x) for x in forecast]


def _forecast_series_arima(values: pd.Series, horizon: int) -> list[float]:
    values = values.dropna().astype(float)
    if values.empty:
        return [0.0] * horizon
    if len(values) < 3 or values.nunique() == 1:
        return [float(values.iloc[-1])] * horizon

    model = ARIMA(values, order=(1, 1, 1))
    fit = model.fit()
    forecast = fit.forecast(steps=horizon)
    return [float(x) for x in forecast]


def _forecast_series_linear(values: pd.Series, horizon: int) -> list[float]:
    values = values.dropna().astype(float)
    if values.empty:
        return [0.0] * horizon
    if len(values) < 2 or values.nunique() == 1:
        return [float(values.iloc[-1])] * horizon

    x = np.arange(len(values))
    coef = np.polyfit(x, values, 1)
    steps = np.arange(len(values), len(values) + horizon)
    forecast = coef[0] * steps + coef[1]
    return [float(x) for x in forecast]


def _forecast_series(values: pd.Series, horizon: int) -> tuple[list[float], str]:
    values = values.dropna().astype(float)
    if values.empty:
        return [0.0] * horizon, "naive"
    if len(values) < 2 or values.nunique() == 1:
        return [float(values.iloc[-1])] * horizon, "naive"

    try:
        return _forecast_series_holt(values, horizon), "holt"
    except Exception:
        try:
            return _forecast_series_linear(values, horizon), "linear"
        except Exception:
            return [float(values.iloc[-1])] * horizon, "naive"


def _clip(values: Iterable[float], min_value: float | None, max_value: float | None) -> list[float]:
    clipped: list[float] = []
    for value in values:
        if min_value is not None:
            value = max(min_value, value)
        if max_value is not None:
            value = min(max_value, value)
        clipped.append(float(value))
    return clipped


def forecast_by_kabkota_method(
    df: pd.DataFrame,
    value_col: str,
    horizon: int,
    method: str,
    clip_min: float | None = None,
    clip_max: float | None = None,
) -> tuple[list[dict[str, Any]], int, int]:
    results: list[dict[str, Any]] = []

    if df.empty:
        return results, 0, 0

    last_year = int(df["tahun"].max())
    start_year = last_year + 1
    end_year = last_year + horizon

    for (kode, nama), group in df.groupby(["kode_kabupaten_kota", "nama_kabupaten_kota"]):
        group = group.sort_values("tahun")
        series = group[value_col]
        try:
            if method == "holt":
                preds = _forecast_series_holt(series, horizon)
            elif method == "arima":
                preds = _forecast_series_arima(series, horizon)
            elif method == "linear":
                preds = _forecast_series_linear(series, horizon)
            else:
                preds, _ = _forecast_series(series, horizon)
        except Exception:
            preds, _ = _forecast_series(series, horizon)

        preds = _clip(preds, clip_min, clip_max)
        for step, value in enumerate(preds, start=1):
            results.append(
                {
                    "tahun": last_year + step,
                    "kode_kabupaten_kota": int(kode),
                    "nama_kabupaten_kota": nama,
                    "value": float(value),
                }
            )

    return results, start_year, end_year


def forecast_by_kabkota(
    df: pd.DataFrame,
    value_col: str,
    horizon: int,
    clip_min: float | None = None,
    clip_max: float | None = None,
) -> tuple[list[dict[str, Any]], dict[str, int], int, int]:
    results: list[dict[str, Any]] = []
    method_counts = {"holt": 0, "linear": 0, "naive": 0}

    if df.empty:
        return results, method_counts, 0, 0

    last_year = int(df["tahun"].max())
    start_year = last_year + 1
    end_year = last_year + horizon

    for (kode, nama), group in df.groupby(["kode_kabupaten_kota", "nama_kabupaten_kota"]):
        group = group.sort_values("tahun")
        preds, method = _forecast_series(group[value_col], horizon)
        method_counts[method] = method_counts.get(method, 0) + 1

        preds = _clip(preds, clip_min, clip_max)
        for step, value in enumerate(preds, start=1):
            results.append(
                {
                    "tahun": last_year + step,
                    "kode_kabupaten_kota": int(kode),
                    "nama_kabupaten_kota": nama,
                    "value": float(value),
                }
            )

    return results, method_counts, start_year, end_year


def _predict_series(values: pd.Series, horizon: int, method: str) -> list[float]:
    if method == "holt":
        return _forecast_series_holt(values, horizon)
    if method == "arima":
        return _forecast_series_arima(values, horizon)
    if method == "linear":
        return _forecast_series_linear(values, horizon)
    preds, _ = _forecast_series(values, horizon)
    return preds


def compare_methods_by_kabkota(
    df: pd.DataFrame,
    value_col: str,
    test_years: int,
    methods: Iterable[str],
    clip_min: float | None = None,
    clip_max: float | None = None,
    include_details: bool = False,
) -> dict[str, Any]:
    if df.empty:
        return {
            "start_year": 0,
            "end_year": 0,
            "series_count": 0,
            "per_method": [],
            "best_method": None,
        }

    years = sorted(df["tahun"].unique())
    if len(years) <= test_years:
        return {
            "start_year": int(years[0]),
            "end_year": int(years[-1]),
            "series_count": 0,
            "per_method": [],
            "best_method": None,
        }

    train_end_year = int(years[-(test_years + 1)])
    test_years_values = years[-test_years:]
    start_year = int(test_years_values[0])
    end_year = int(test_years_values[-1])

    metrics: dict[str, dict[str, list[float]]] = {}
    series_used = 0

    for method in methods:
        metrics[method] = {"rmse": [], "mae": [], "mape": []}

    detail_rows: list[dict[str, Any]] = []

    for (kode, nama), group in df.groupby(["kode_kabupaten_kota", "nama_kabupaten_kota"]):
        group = group.sort_values("tahun")
        train = group[group["tahun"] <= train_end_year]
        test = group[group["tahun"] > train_end_year]
        if len(train) < 3 or len(test) < test_years:
            continue

        actual = test[value_col].astype(float).values[:test_years]
        if actual.size == 0:
            continue

        series_used += 1
        per_kab_scores: list[dict[str, Any]] = []

        for method in methods:
            try:
                y_pred = np.array(_predict_series(train[value_col], test_years, method), dtype=float)
                if y_pred.size == 0:
                    continue
            except Exception:
                continue

            y_pred = np.array(_clip(y_pred, clip_min, clip_max), dtype=float)
            diff = y_pred - actual
            rmse = float(np.sqrt(np.mean(diff**2)))
            mae = float(np.mean(np.abs(diff)))
            denom = np.where(actual == 0, 1.0, actual)
            mape = float(np.mean(np.abs(diff) / denom) * 100)

            metrics[method]["rmse"].append(rmse)
            metrics[method]["mae"].append(mae)
            metrics[method]["mape"].append(mape)

            if include_details:
                per_kab_scores.append(
                    {
                        "method": method,
                        "rmse": rmse,
                        "mae": mae,
                        "mape": mape,
                    }
                )

        if include_details and per_kab_scores:
            per_kab_scores = sorted(per_kab_scores, key=lambda row: row["rmse"])
            detail_rows.append(
                {
                    "kode_kabupaten_kota": int(kode),
                    "nama_kabupaten_kota": nama,
                    "best_method": per_kab_scores[0]["method"],
                    "scores": per_kab_scores,
                }
            )

    per_method: list[dict[str, Any]] = []
    best_method = None
    best_rmse = None

    for method in methods:
        rmse_list = metrics[method]["rmse"]
        mae_list = metrics[method]["mae"]
        mape_list = metrics[method]["mape"]
        if not rmse_list:
            continue

        rmse_mean = float(np.mean(rmse_list))
        mae_mean = float(np.mean(mae_list))
        mape_mean = float(np.mean(mape_list))
        score = max(0.0, 100.0 - mape_mean)
        if score >= 85:
            label = "Sangat Baik"
        elif score >= 70:
            label = "Baik"
        elif score >= 55:
            label = "Cukup"
        else:
            label = "Kurang"

        per_method.append(
            {
                "method": method,
                "rmse": rmse_mean,
                "mae": mae_mean,
                "mape": mape_mean,
                "score": float(score),
                "label": label,
                "series_count": len(rmse_list),
            }
        )

        if best_rmse is None or rmse_mean < best_rmse:
            best_rmse = rmse_mean
            best_method = method

    return {
        "start_year": start_year,
        "end_year": end_year,
        "series_count": series_used,
        "per_method": per_method,
        "best_method": best_method,
        "details": detail_rows if include_details else None,
    }
