from typing import Any, Optional
from pydantic import BaseModel


class BaseResponse(BaseModel):
    status: str = "not_implemented"
    detail: Optional[str] = None


class SummaryResponse(BaseResponse):
    year: int
    data: Optional[dict[str, Any]] = None


class TrendResponse(BaseResponse):
    metric: str
    data: Optional[list[dict[str, Any]]] = None


class KabkotaResponse(BaseResponse):
    year: int
    metric: str
    data: Optional[list[dict[str, Any]]] = None


class MapResponse(BaseResponse):
    year: int
    metric: str
    data: Optional[list[dict[str, Any]]] = None


class CorrelationResponse(BaseResponse):
    year: int
    data: Optional[dict[str, Any]] = None


class RegressionResponse(BaseResponse):
    start: int
    end: int
    data: Optional[dict[str, Any]] = None


class CompareResponse(BaseResponse):
    year: int
    data: Optional[list[dict[str, Any]]] = None


class EffectivenessResponse(BaseResponse):
    start: int
    end: int
    data: Optional[list[dict[str, Any]]] = None


class InsightsResponse(BaseResponse):
    start: int
    end: int
    data: Optional[dict[str, Any]] = None


class ScatterResponse(BaseResponse):
    year: int
    data: Optional[list[dict[str, Any]]] = None


class CompareYearsResponse(BaseResponse):
    year_a: int
    year_b: int
    metric: str
    data: Optional[list[dict[str, Any]]] = None


class UploadResponse(BaseResponse):
    filename: str
