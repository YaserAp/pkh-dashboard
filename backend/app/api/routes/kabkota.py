from fastapi import APIRouter

from app.api.schemas import KabkotaResponse
from app.api.utils import (
    VALID_METRICS,
    apply_kabkota_filters,
    get_tables,
    normalize_tipe,
    parse_kabkota_codes,
    resolve_year,
    validate_metric,
)
from app.data.analysis.descriptive import compute_kabkota_metric

router = APIRouter()


@router.get("", response_model=KabkotaResponse)
def get_kabkota(
    year: int | None = None,
    metric: str = "kemiskinan",
    tipe: str | None = None,
    kabkota: str | None = None,
) -> KabkotaResponse:
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

    return KabkotaResponse(status="ok", year=resolved_year, metric=metric, data=data)
