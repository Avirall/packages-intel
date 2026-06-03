from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class ScanSummaryResponse(BaseModel):
    total_packages: int
    high_risk: int
    medium_risk: int
    low_risk: int
    avg_bus_factor: float
    avg_scorecard: float


class ScanResponse(BaseModel):
    id: str
    filename: str
    ecosystem: str
    status: Literal["pending", "processing", "completed", "failed"]
    created_at: datetime
    completed_at: datetime | None
    summary: ScanSummaryResponse
    package_names: list[str]


class PackageRisk(BaseModel):
    name: str
    ecosystem: str
    weekly_downloads: int
    bus_factor: int
    risk_score: float
    risk_label: Literal["HIGH", "MEDIUM", "LOW"]
    last_release_months_ago: float | None
    last_commit_at: str | None
    open_issues: int | None
    scorecard_score: float | None
    maintainers: list[dict]
    hops_from_root: int | None = None
