from fastapi import APIRouter

from app.api.schemas import EffectivenessResponse
from app.api.utils import (
    apply_kabkota_filters,
    get_tables,
    normalize_tipe,
    parse_kabkota_codes,
    resolve_year_range,
)
from app.data.analysis.effectiveness import compute_effectiveness

router = APIRouter()


@router.get("", response_model=EffectivenessResponse)
def get_effectiveness(
    start: int | None = None,
    end: int | None = None,
    tipe: str | None = None,
    kabkota: str | None = None,
) -> EffectivenessResponse:
    resolved_start, resolved_end = resolve_year_range(start, end)
    tipe = normalize_tipe(tipe)
    codes = parse_kabkota_codes(kabkota)
    tables = get_tables()

    data = compute_effectiveness(
        df_pkh=apply_kabkota_filters(tables["fact_pkh"], tipe, codes),
        df_persen=apply_kabkota_filters(tables["fact_kemiskinan_persen"], tipe, codes),
        start=resolved_start,
        end=resolved_end,
    )

    return EffectivenessResponse(status="ok", start=resolved_start, end=resolved_end, data=data)
