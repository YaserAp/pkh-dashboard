from fastapi import APIRouter

from app.api.schemas import RegressionResponse
from app.api.utils import (
    apply_kabkota_filters,
    get_tables,
    normalize_tipe,
    parse_kabkota_codes,
    resolve_year_range,
)
from app.data.analysis.regression import compute_regression

router = APIRouter()


@router.get("", response_model=RegressionResponse)
def get_regression(
    start: int | None = None,
    end: int | None = None,
    tipe: str | None = None,
    kabkota: str | None = None,
) -> RegressionResponse:
    resolved_start, resolved_end = resolve_year_range(start, end)
    tipe = normalize_tipe(tipe)
    codes = parse_kabkota_codes(kabkota)
    tables = get_tables()

    df_pkh = apply_kabkota_filters(tables["fact_pkh"], tipe, codes)
    df_persen = apply_kabkota_filters(tables["fact_kemiskinan_persen"], tipe, codes)

    data = compute_regression(
        df_pkh=df_pkh,
        df_persen=df_persen,
        start=resolved_start,
        end=resolved_end,
    )

    return RegressionResponse(status="ok", start=resolved_start, end=resolved_end, data=data)
