"""Shared helpers used across route modules."""
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status

from app.db.mongodb import scans_collection
from app.schemas.scan import ScanResponse, ScanSummaryResponse


async def get_owned_scan(scan_id: str, current_user: dict) -> dict:
    """
    Fetch a scan document, verifying it belongs to current_user.
    Raises 404 for missing, invalid ID, or wrong owner.
    """
    try:
        oid = ObjectId(scan_id)
    except (InvalidId, Exception):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Scan not found")

    doc = await scans_collection().find_one(
        {"_id": oid, "user_id": current_user["_id"]}
    )
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Scan not found")
    return doc


def scan_to_response(doc: dict) -> ScanResponse:
    summary = doc.get("summary") or {}
    return ScanResponse(
        id=str(doc["_id"]),
        filename=doc["filename"],
        ecosystem=doc["ecosystem"],
        status=doc["status"],
        created_at=doc["created_at"],
        completed_at=doc.get("completed_at"),
        summary=ScanSummaryResponse(**summary) if summary else ScanSummaryResponse(
            total_packages=0, high_risk=0, medium_risk=0,
            low_risk=0, avg_bus_factor=0.0, avg_scorecard=0.0,
        ),
        package_names=doc.get("package_names", []),
    )
