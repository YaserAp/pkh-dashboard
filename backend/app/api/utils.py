from typing import Iterable

from fastapi import HTTPException

from app.core.config import get_settings
from app.data.transform import ensure_processed_tables

VALID_METRICS = {"kemiskinan", "pkh", "kemiskinan_abs"}
VALID_TREND_METRICS = {"kemiskinan", "pkh"}


def resolve_year(year: int | None) -> int:
    settings = get_settings()
    return year or settings.default_end_year


def resolve_year_range(start: int | None, end: int | None) -> tuple[int, int]:
    settings = get_settings()
    resolved_start = start or settings.default_start_year
    resolved_end = end or settings.default_end_year
    if resolved_start > resolved_end:
        raise HTTPException(status_code=400, detail="start must be <= end")
    return resolved_start, resolved_end


def validate_metric(metric: str, allowed: set[str]) -> str:
    metric = metric.strip().lower()
    if metric not in allowed:
        raise HTTPException(status_code=400, detail=f"Invalid metric: {metric}")
    return metric


def get_tables():
    try:
        return ensure_processed_tables()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


def parse_kabkota_codes(raw: str | None) -> list[int]:
    if not raw:
        return []
    codes = []
    for item in raw.split(","):
        item = item.strip()
        if not item:
            continue
        if not item.isdigit():
            raise HTTPException(status_code=400, detail="kabkota must be numeric codes")
        codes.append(int(item))
    return codes


def normalize_tipe(value: str | None) -> str:
    if not value:
        return "all"
    value = value.strip().lower()
    if value in {"kota", "kabupaten", "all"}:
        return value
    raise HTTPException(status_code=400, detail="tipe must be kota, kabupaten, or all")


def apply_kabkota_filters(df, tipe: str, codes: Iterable[int]):
    if codes:
        df = df[df["kode_kabupaten_kota"].isin(list(codes))]
    if tipe == "kota":
        df = df[df["nama_kabupaten_kota"].str.startswith("KOTA ")]
    elif tipe == "kabupaten":
        df = df[df["nama_kabupaten_kota"].str.startswith("KABUPATEN ")]
    return df
