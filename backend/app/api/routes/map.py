from fastapi import APIRouter, HTTPException

from app.api.schemas import MapResponse
from app.api.utils import (
    VALID_METRICS,
    apply_kabkota_filters,
    get_tables,
    normalize_tipe,
    parse_kabkota_codes,
    resolve_year,
    validate_metric,
)
from app.data.geojson import load_jabar_geojson
from app.data.analysis.descriptive import compute_kabkota_metric

router = APIRouter()


@router.get("", response_model=MapResponse)
def get_map(
    year: int | None = None,
    metric: str = "kemiskinan",
    tipe: str | None = None,
    kabkota: str | None = None,
) -> MapResponse:
    resolved_year = resolve_year(year)
    metric = validate_metric(metric, VALID_METRICS)
    tipe = normalize_tipe(tipe)
    codes = parse_kabkota_codes(kabkota)
    tables = get_tables()

    df_pkh = apply_kabkota_filters(tables["fact_pkh"], tipe, codes)
    df_persen = apply_kabkota_filters(tables["fact_kemiskinan_persen"], tipe, codes)
    df_abs = apply_kabkota_filters(tables["fact_kemiskinan_abs"], tipe, codes)

    data = compute_kabkota_metric(
        metric=metric,
        year=resolved_year,
        df_pkh=df_pkh,
        df_persen=df_persen,
        df_abs=df_abs,
    )

    return MapResponse(status="ok", year=resolved_year, metric=metric, data=data)


@router.get("/geojson")
def get_geojson() -> dict:
    try:
        return load_jabar_geojson()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
