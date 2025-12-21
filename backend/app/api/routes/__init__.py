from fastapi import APIRouter

from app.api.routes.admin_upload import router as admin_upload_router
from app.api.routes.compare import router as compare_router
from app.api.routes.compare_years import router as compare_years_router
from app.api.routes.correlation import router as correlation_router
from app.api.routes.effectiveness import router as effectiveness_router
from app.api.routes.kabkota import router as kabkota_router
from app.api.routes.insights import router as insights_router
from app.api.routes.map import router as map_router
from app.api.routes.regression import router as regression_router
from app.api.routes.report import router as report_router
from app.api.routes.scatter import router as scatter_router
from app.api.routes.summary import router as summary_router
from app.api.routes.trend import router as trend_router

api_router = APIRouter()

api_router.include_router(summary_router, prefix="/summary", tags=["summary"])
api_router.include_router(trend_router, prefix="/trend", tags=["trend"])
api_router.include_router(kabkota_router, prefix="/kabkota", tags=["kabkota"])
api_router.include_router(map_router, prefix="/map", tags=["map"])
api_router.include_router(compare_router, prefix="/compare", tags=["compare"])
api_router.include_router(compare_years_router, prefix="/compare-years", tags=["compare-years"])
api_router.include_router(insights_router, prefix="/insights", tags=["insights"])
api_router.include_router(scatter_router, prefix="/scatter", tags=["scatter"])
api_router.include_router(correlation_router, prefix="/correlation", tags=["correlation"])
api_router.include_router(regression_router, prefix="/regression", tags=["regression"])
api_router.include_router(effectiveness_router, prefix="/effectiveness", tags=["effectiveness"])
api_router.include_router(report_router, prefix="/report", tags=["report"])
api_router.include_router(admin_upload_router, prefix="/admin", tags=["admin"])
