from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.api.schemas import UploadResponse
from app.core.config import get_settings
from app.data.transform import build_fact_tables

router = APIRouter()


@router.post("/upload", response_model=UploadResponse)
def upload_dataset(
    file: UploadFile = File(...),
    reprocess: bool = False,
) -> UploadResponse:
    settings = get_settings()
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv uploads are supported")

    raw_dir = Path(settings.data_dir_raw)
    raw_dir.mkdir(parents=True, exist_ok=True)

    dest = raw_dir / file.filename
    with dest.open("wb") as buffer:
        buffer.write(file.file.read())

    if reprocess:
        build_fact_tables(source_dir=settings.data_dir_raw, output_dir=settings.data_dir_processed)

    return UploadResponse(status="ok", filename=file.filename)
