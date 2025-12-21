from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.api.utils import get_tables, resolve_year_range
from app.services.report_export import build_summary_csv

router = APIRouter()


@router.get("/summary")
def export_summary_csv(start: int | None = None, end: int | None = None) -> StreamingResponse:
    resolved_start, resolved_end = resolve_year_range(start, end)
    tables = get_tables()

    csv_text = build_summary_csv(
        df_pkh=tables["fact_pkh"],
        df_persen=tables["fact_kemiskinan_persen"],
        df_abs=tables["fact_kemiskinan_abs"],
        start=resolved_start,
        end=resolved_end,
    )

    headers = {"Content-Disposition": "attachment; filename=summary.csv"}
    return StreamingResponse(iter([csv_text]), media_type="text/csv", headers=headers)
