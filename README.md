PKH Dashboard

Public web dashboard to analyze PKH and poverty data for West Java.

Structure
- backend: FastAPI app, data pipeline, analysis
- frontend: Next.js app (placeholder)
- data: raw, processed, cache
- docs: API and data dictionary

Quickstart (backend)
1) Create venv and install deps
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r backend\requirements.txt
2) Run API
   uvicorn app.main:app --reload --app-dir backend

Notes
- Data sources in D:\!Sains data\data
- This repo currently contains skeleton code only
