from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_current_user
from app.api.utils import scan_to_response
from app.db.mongodb import scans_collection
from app.schemas.scan import ScanResponse

router = APIRouter(prefix="/history", tags=["history"])

_MAX_LIMIT = 100


@router.get("", response_model=list[ScanResponse])
async def list_scans(
    current_user: dict = Depends(get_current_user),
    limit: int = Query(default=20, ge=1, le=_MAX_LIMIT),
    skip: int = Query(default=0, ge=0),
):
    cursor = (
        scans_collection()
        .find({"user_id": current_user["_id"]})
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    docs = await cursor.to_list(length=limit)
    return [scan_to_response(d) for d in docs]


@router.delete("/{scan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scan(scan_id: str, current_user: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(scan_id)
    except (InvalidId, Exception):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Scan not found")

    result = await scans_collection().delete_one(
        {"_id": oid, "user_id": current_user["_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Scan not found")
