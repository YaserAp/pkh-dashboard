from fastapi import APIRouter

from app.api.schemas import ScatterResponse
from app.api.utils import (
    apply_kabkota_filters,
    get_tables,
    normalize_tipe,
    parse_kabkota_codes,
    resolve_year,
)
from app.data.analysis.scatter import compute_scatter

router = APIRouter()


@router.get("", response_model=ScatterResponse)
def get_scatter(
    year: int | None = None,
    tipe: str | None = None,
    kabkota: str | None = None,
) -> ScatterResponse:
    resolved_year = resolve_year(year)
    tipe = normalize_tipe(tipe)
    codes = parse_kabkota_codes(kabkota)
    tables = get_tables()

    df_pkh = apply_kabkota_filters(tables["fact_pkh"], tipe, codes)
    df_persen = apply_kabkota_filters(tables["fact_kemiskinan_persen"], tipe, codes)

    data = compute_scatter(
        df_pkh=df_pkh,
        df_persen=df_persen,
        year=resolved_year,
    )

    return ScatterResponse(status="ok", year=resolved_year, data=data)
