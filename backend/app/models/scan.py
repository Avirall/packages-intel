from datetime import datetime, timezone
from typing import Annotated, Literal

from bson import ObjectId
from pydantic import BaseModel, Field


class ScanSummary(BaseModel):
    total_packages: int = 0
    high_risk: int = 0
    medium_risk: int = 0
    low_risk: int = 0
    avg_bus_factor: float = 0.0
    avg_scorecard: float = 0.0


class ScanDocument(BaseModel):
    id: Annotated[ObjectId | None, Field(alias="_id")] = None
    user_id: ObjectId
    filename: str
    ecosystem: str                             # npm | python | go | rust | java | ruby | php
    status: Literal["pending", "processing", "completed", "failed"] = "pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: datetime | None = None
    summary: ScanSummary = Field(default_factory=ScanSummary)
    package_names: list[str] = Field(default_factory=list)
    neo4j_scan_id: str | None = None          # UUID of the (:Scan) node in AuraDB

    model_config = {"arbitrary_types_allowed": True, "populate_by_name": True}
