from fastapi import APIRouter

from app.api.schemas import InsightsResponse
from app.api.utils import (
    apply_kabkota_filters,
    get_tables,
    normalize_tipe,
    parse_kabkota_codes,
    resolve_year_range,
)
from app.data.analysis.insights import compute_insights

router = APIRouter()


@router.get("", response_model=InsightsResponse)
def get_insights(
    start: int | None = None,
    end: int | None = None,
    tipe: str | None = None,
    kabkota: str | None = None,
) -> InsightsResponse:
    resolved_start, resolved_end = resolve_year_range(start, end)
    tipe = normalize_tipe(tipe)
    codes = parse_kabkota_codes(kabkota)
    tables = get_tables()

    df_pkh = apply_kabkota_filters(tables["fact_pkh"], tipe, codes)
    df_persen = apply_kabkota_filters(tables["fact_kemiskinan_persen"], tipe, codes)

    data = compute_insights(
        df_pkh=df_pkh,
        df_persen=df_persen,
        start=resolved_start,
        end=resolved_end,
    )

    return InsightsResponse(status="ok", start=resolved_start, end=resolved_end, data=data)
