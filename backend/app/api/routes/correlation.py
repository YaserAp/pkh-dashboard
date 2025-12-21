from fastapi import APIRouter

from app.api.schemas import CorrelationResponse
from app.api.utils import (
    apply_kabkota_filters,
    get_tables,
    normalize_tipe,
    parse_kabkota_codes,
    resolve_year,
)
from app.data.analysis.correlation import compute_correlation

router = APIRouter()


@router.get("", response_model=CorrelationResponse)
def get_correlation(
    year: int | None = None,
    tipe: str | None = None,
    kabkota: str | None = None,
) -> CorrelationResponse:
    resolved_year = resolve_year(year)
    tipe = normalize_tipe(tipe)
    codes = parse_kabkota_codes(kabkota)
    tables = get_tables()

    df_pkh = apply_kabkota_filters(tables["fact_pkh"], tipe, codes)
    df_persen = apply_kabkota_filters(tables["fact_kemiskinan_persen"], tipe, codes)

    data = compute_correlation(
        df_pkh=df_pkh,
        df_persen=df_persen,
        year=resolved_year,
    )

    return CorrelationResponse(status="ok", year=resolved_year, data=data)
