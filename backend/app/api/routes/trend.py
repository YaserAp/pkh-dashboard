from fastapi import APIRouter

from app.api.schemas import TrendResponse
from app.api.utils import (
    VALID_TREND_METRICS,
    apply_kabkota_filters,
    get_tables,
    normalize_tipe,
    parse_kabkota_codes,
    validate_metric,
)
from app.data.analysis.descriptive import compute_trend

router = APIRouter()


@router.get("", response_model=TrendResponse)
def get_trend(
    metric: str = "kemiskinan",
    tipe: str | None = None,
    kabkota: str | None = None,
) -> TrendResponse:
    metric = validate_metric(metric, VALID_TREND_METRICS)
    tipe = normalize_tipe(tipe)
    codes = parse_kabkota_codes(kabkota)
    tables = get_tables()

    df_pkh = apply_kabkota_filters(tables["fact_pkh"], tipe, codes)
    df_persen = apply_kabkota_filters(tables["fact_kemiskinan_persen"], tipe, codes)

    data = compute_trend(
        metric=metric,
        df_pkh=df_pkh,
        df_persen=df_persen,
    )

    return TrendResponse(status="ok", metric=metric, data=data)
