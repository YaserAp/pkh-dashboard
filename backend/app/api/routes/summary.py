from fastapi import APIRouter

from app.api.schemas import SummaryResponse
from app.api.utils import (
    apply_kabkota_filters,
    get_tables,
    normalize_tipe,
    parse_kabkota_codes,
    resolve_year,
)
from app.data.analysis.descriptive import compute_summary

router = APIRouter()


@router.get("", response_model=SummaryResponse)
def get_summary(
    year: int | None = None,
    tipe: str | None = None,
    kabkota: str | None = None,
) -> SummaryResponse:
    resolved_year = resolve_year(year)
    tipe = normalize_tipe(tipe)
    codes = parse_kabkota_codes(kabkota)
    tables = get_tables()

    df_pkh = apply_kabkota_filters(tables["fact_pkh"], tipe, codes)
    df_persen = apply_kabkota_filters(tables["fact_kemiskinan_persen"], tipe, codes)
    df_abs = apply_kabkota_filters(tables["fact_kemiskinan_abs"], tipe, codes)

    data = compute_summary(
        df_pkh=df_pkh,
        df_persen=df_persen,
        df_abs=df_abs,
        year=resolved_year,
    )

    return SummaryResponse(status="ok", year=resolved_year, data=data)
