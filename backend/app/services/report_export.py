from io import StringIO

import pandas as pd

from app.data.analysis.descriptive import compute_summary


def build_summary_csv(
    df_pkh: pd.DataFrame,
    df_persen: pd.DataFrame,
    df_abs: pd.DataFrame,
    start: int,
    end: int,
) -> str:
    rows = []
    for year in range(start, end + 1):
        rows.append(compute_summary(df_pkh, df_persen, df_abs, year))

    df = pd.DataFrame(rows)
    buffer = StringIO()
    df.to_csv(buffer, index=False)
    return buffer.getvalue()
