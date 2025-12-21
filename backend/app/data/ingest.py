from pathlib import Path
from typing import Dict

import pandas as pd

from app.core.config import get_settings
from app.data.paths import DATASET_FILES, resolve_source_path


def load_source_datasets(source_dir: str | None = None) -> Dict[str, pd.DataFrame]:
    settings = get_settings()
    base_dir = source_dir or settings.source_data_dir
    base_path = Path(base_dir)

    if not base_path.exists():
        raise FileNotFoundError(f"Source data dir not found: {base_dir}")

    datasets: Dict[str, pd.DataFrame] = {}
    for key, filename in DATASET_FILES.items():
        path = resolve_source_path(base_dir, filename)
        if not path.exists():
            raise FileNotFoundError(f"Missing dataset: {path}")
        datasets[key] = pd.read_csv(path)

    return datasets
