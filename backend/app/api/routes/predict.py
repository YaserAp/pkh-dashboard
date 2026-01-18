from pathlib import Path

import pandas as pd
from fastapi import APIRouter, HTTPException

from app.api.schemas import PredictionComparisonResponse, PredictionResponse
from app.api.utils import (
    VALID_PREDICT_METHODS,
    VALID_PREDICT_METRICS,
    apply_kabkota_filters,
    get_tables,
    normalize_tipe,
    parse_kabkota_codes,
)
from app.core.config import get_settings
from app.data.analysis.predictive import compare_methods_by_kabkota, forecast_by_kabkota, forecast_by_kabkota_method

router = APIRouter()


def _validate_metric(metric: str) -> str:
    metric = metric.strip().lower()
    if metric not in VALID_PREDICT_METRICS:
        raise HTTPException(status_code=400, detail=f"Invalid metric: {metric}")
    return metric


def _export_csv(rows: list[dict], filename: str) -> str:
    settings = get_settings()
    output_dir = Path(settings.data_dir_processed) / "predictions"
    output_dir.mkdir(parents=True, exist_ok=True)
    path = output_dir / filename
    pd.DataFrame(rows).to_csv(path, index=False)
    return str(path)


@router.get("", response_model=PredictionResponse)
def get_prediction(
    metric: str = "all",
    horizon: int = 5,
    method: str = "auto",
    tipe: str | None = None,
    kabkota: str | None = None,
    export: bool = False,
) -> PredictionResponse:
    metric = _validate_metric(metric)
    method = method.strip().lower()
    if method not in VALID_PREDICT_METHODS:
        raise HTTPException(status_code=400, detail=f"Invalid method: {method}")
    if horizon < 1 or horizon > 10:
        raise HTTPException(status_code=400, detail="horizon must be between 1 and 10 years")

    tipe = normalize_tipe(tipe)
    codes = parse_kabkota_codes(kabkota)
    tables = get_tables()

    df_pkh = apply_kabkota_filters(tables["fact_pkh"], tipe, codes)
    df_persen = apply_kabkota_filters(tables["fact_kemiskinan_persen"], tipe, codes)
    df_abs = apply_kabkota_filters(tables["fact_kemiskinan_abs"], tipe, codes)

    method_note = "auto (holt -> linear -> naive)"

    if metric == "pkh":
        if method == "auto":
            data, _, start_year, end_year = forecast_by_kabkota(
                df_pkh,
                "jumlah_penerima_manfaat",
                horizon,
                clip_min=0.0,
            )
            method_desc = method_note
        else:
            data, start_year, end_year = forecast_by_kabkota_method(
                df_pkh,
                "jumlah_penerima_manfaat",
                horizon,
                method,
                clip_min=0.0,
            )
            method_desc = method
        export_path = None
        if export:
            export_path = _export_csv(
                data,
                f"pred_{metric}_{method}_{start_year}_{end_year}.csv",
            )
        return PredictionResponse(
            status="ok",
            metric=metric,
            horizon=horizon,
            start_year=start_year,
            end_year=end_year,
            method=method_desc,
            export_path=export_path,
            data=data,
        )

    if metric == "kemiskinan_abs":
        if method == "auto":
            data, _, start_year, end_year = forecast_by_kabkota(
                df_abs,
                "jumlah_penduduk_miskin",
                horizon,
                clip_min=0.0,
            )
            method_desc = method_note
        else:
            data, start_year, end_year = forecast_by_kabkota_method(
                df_abs,
                "jumlah_penduduk_miskin",
                horizon,
                method,
                clip_min=0.0,
            )
            method_desc = method
        export_path = None
        if export:
            export_path = _export_csv(
                data,
                f"pred_{metric}_{method}_{start_year}_{end_year}.csv",
            )
        return PredictionResponse(
            status="ok",
            metric=metric,
            horizon=horizon,
            start_year=start_year,
            end_year=end_year,
            method=method_desc,
            export_path=export_path,
            data=data,
        )

    if metric == "kemiskinan":
        if method == "auto":
            data, _, start_year, end_year = forecast_by_kabkota(
                df_persen,
                "persentase_penduduk_miskin",
                horizon,
                clip_min=0.0,
                clip_max=100.0,
            )
            method_desc = method_note
        else:
            data, start_year, end_year = forecast_by_kabkota_method(
                df_persen,
                "persentase_penduduk_miskin",
                horizon,
                method,
                clip_min=0.0,
                clip_max=100.0,
            )
            method_desc = method
        export_path = None
        if export:
            export_path = _export_csv(
                data,
                f"pred_{metric}_{method}_{start_year}_{end_year}.csv",
            )
        return PredictionResponse(
            status="ok",
            metric=metric,
            horizon=horizon,
            start_year=start_year,
            end_year=end_year,
            method=method_desc,
            export_path=export_path,
            data=data,
        )

    if method == "auto":
        data_pkh, _, start_year, end_year = forecast_by_kabkota(
            df_pkh,
            "jumlah_penerima_manfaat",
            horizon,
            clip_min=0.0,
        )
        data_abs, _, _, _ = forecast_by_kabkota(
            df_abs,
            "jumlah_penduduk_miskin",
            horizon,
            clip_min=0.0,
        )
        data_persen, _, _, _ = forecast_by_kabkota(
            df_persen,
            "persentase_penduduk_miskin",
            horizon,
            clip_min=0.0,
            clip_max=100.0,
        )
        method_desc = method_note
    else:
        data_pkh, start_year, end_year = forecast_by_kabkota_method(
            df_pkh,
            "jumlah_penerima_manfaat",
            horizon,
            method,
            clip_min=0.0,
        )
        data_abs, _, _ = forecast_by_kabkota_method(
            df_abs,
            "jumlah_penduduk_miskin",
            horizon,
            method,
            clip_min=0.0,
        )
        data_persen, _, _ = forecast_by_kabkota_method(
            df_persen,
            "persentase_penduduk_miskin",
            horizon,
            method,
            clip_min=0.0,
            clip_max=100.0,
        )
        method_desc = method

    export_path = None
    if export:
        export_path = _export_csv(
            [
                {**row, "metric": "pkh"} for row in data_pkh
            ]
            + [{**row, "metric": "kemiskinan_abs"} for row in data_abs]
            + [{**row, "metric": "kemiskinan"} for row in data_persen],
            f"pred_all_{method}_{start_year}_{end_year}.csv",
        )

    return PredictionResponse(
        status="ok",
        metric=metric,
        horizon=horizon,
        start_year=start_year,
        end_year=end_year,
        method=method_desc,
        export_path=export_path,
        data={
            "pkh": data_pkh,
            "kemiskinan_abs": data_abs,
            "kemiskinan": data_persen,
        },
    )


@router.get("/compare", response_model=PredictionComparisonResponse)
def compare_methods(
    metric: str = "kemiskinan",
    test_years: int = 2,
    tipe: str | None = None,
    kabkota: str | None = None,
    details: bool = False,
    export: bool = False,
) -> PredictionComparisonResponse:
    metric = _validate_metric(metric)
    if metric == "all":
        raise HTTPException(status_code=400, detail="metric must be kemiskinan, pkh, or kemiskinan_abs")
    if test_years < 1 or test_years > 5:
        raise HTTPException(status_code=400, detail="test_years must be between 1 and 5")

    tipe = normalize_tipe(tipe)
    codes = parse_kabkota_codes(kabkota)
    tables = get_tables()

    df_pkh = apply_kabkota_filters(tables["fact_pkh"], tipe, codes)
    df_persen = apply_kabkota_filters(tables["fact_kemiskinan_persen"], tipe, codes)
    df_abs = apply_kabkota_filters(tables["fact_kemiskinan_abs"], tipe, codes)

    methods = ["holt", "arima", "linear"]

    if metric == "pkh":
        result = compare_methods_by_kabkota(
            df_pkh,
            "jumlah_penerima_manfaat",
            test_years,
            methods,
            clip_min=0.0,
            include_details=details,
        )
    elif metric == "kemiskinan_abs":
        result = compare_methods_by_kabkota(
            df_abs,
            "jumlah_penduduk_miskin",
            test_years,
            methods,
            clip_min=0.0,
            include_details=details,
        )
    else:
        result = compare_methods_by_kabkota(
            df_persen,
            "persentase_penduduk_miskin",
            test_years,
            methods,
            clip_min=0.0,
            clip_max=100.0,
            include_details=details,
        )

    export_paths = None
    if export:
        export_paths = {}
        if result["per_method"]:
            export_paths["summary"] = _export_csv(
                result["per_method"],
                f"compare_{metric}_{result['start_year']}_{result['end_year']}.csv",
            )
        if details and result.get("details"):
            rows = []
            for row in result["details"]:
                for score in row["scores"]:
                    rows.append(
                        {
                            "kode_kabupaten_kota": row["kode_kabupaten_kota"],
                            "nama_kabupaten_kota": row["nama_kabupaten_kota"],
                            "method": score["method"],
                            "rmse": score["rmse"],
                            "mae": score["mae"],
                            "mape": score["mape"],
                            "best_method": row["best_method"],
                        }
                    )
            if rows:
                export_paths["details"] = _export_csv(
                    rows,
                    f"compare_{metric}_{result['start_year']}_{result['end_year']}_details.csv",
                )

    return PredictionComparisonResponse(
        status="ok",
        metric=metric,
        test_years=test_years,
        start_year=result["start_year"],
        end_year=result["end_year"],
        best_method=result["best_method"],
        export_paths=export_paths,
        data={
            "methods": result["per_method"],
            "series_count": result["series_count"],
            "details": result.get("details"),
        },
    )
