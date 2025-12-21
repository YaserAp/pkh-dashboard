import json
from pathlib import Path

from app.core.config import get_settings


def load_jabar_geojson() -> dict:
    settings = get_settings()
    path = Path(settings.project_root) / settings.jabar_geojson_path
    if not path.exists():
        raise FileNotFoundError(f"GeoJSON not found: {path}")

    return json.loads(path.read_text(encoding="utf-8"))
