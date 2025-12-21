from fastapi import APIRouter

from app.api.schemas import CompareYearsResponse
from app.api.utils import (
    VALID_METRICS,
    apply_kabkota_filters,
    get_tables,
    normalize_tipe,
    parse_kabkota_codes,
    validate_metric,
)
from app.data.analysis.compare_years import compute_compare_years

router = APIRouter()


@router.get("", response_model=CompareYearsResponse)
def get_compare_years(
    year_a: int = 2017,
    year_b: int = 2024,
    metric: str = "kemiskinan",
    tipe: str | None = None,
    kabkota: str | None = None,
) -> CompareYearsResponse:
    metric = validate_metric(metric, VALID_METRICS)
    tipe = normalize_tipe(tipe)
    codes = parse_kabkota_codes(kabkota)
    tables = get_tables()

    if metric == "pkh":
        df = apply_kabkota_filters(tables["fact_pkh"], tipe, codes)
        value_column = "jumlah_penerima_manfaat"
    elif metric == "kemiskinan_abs":
        df = apply_kabkota_filters(tables["fact_kemiskinan_abs"], tipe, codes)
        value_column = "jumlah_penduduk_miskin"
    else:
        df = apply_kabkota_filters(tables["fact_kemiskinan_persen"], tipe, codes)
        value_column = "persentase_penduduk_miskin"

    data = compute_compare_years(df=df, value_column=value_column, year_a=year_a, year_b=year_b)

    return CompareYearsResponse(status="ok", year_a=year_a, year_b=year_b, metric=metric, data=data)
