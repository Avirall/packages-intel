import logging

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_current_user
from app.api.utils import get_owned_scan
from app.db.mongodb import messages_collection
from app.models.message import MessageDocument
from app.schemas.chat import ChatHistoryResponse, MessageRequest, MessageResponse
from app.services.aura_agent import query_agent

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])

_MAX_MESSAGES = 200


@router.post("/{scan_id}", response_model=MessageResponse)
async def send_message(
    scan_id: str,
    body: MessageRequest,
    current_user: dict = Depends(get_current_user),
):
    scan = await get_owned_scan(scan_id, current_user)
    if scan["status"] != "completed":
        raise HTTPException(status.HTTP_409_CONFLICT, "Scan is not completed yet")

    col = messages_collection()
    user_id = current_user["_id"]
    scan_oid = ObjectId(scan_id)

    user_doc = MessageDocument(
        scan_id=scan_oid,
        user_id=user_id,
        role="user",
        content=body.content,
    )
    await col.insert_one(user_doc.model_dump(exclude={"id"}))

    try:
        reply = await query_agent(body.content)
    except Exception:
        logger.exception("Aura Agent query failed for scan %s", scan_id)
        reply = "The agent is temporarily unavailable. Please try again shortly."

    assistant_doc = MessageDocument(
        scan_id=scan_oid,
        user_id=user_id,
        role="assistant",
        content=reply,
    )
    result = await col.insert_one(assistant_doc.model_dump(exclude={"id"}))
    saved = await col.find_one({"_id": result.inserted_id})

    return MessageResponse(
        id=str(saved["_id"]),
        role="assistant",
        content=reply,
        created_at=saved["created_at"],
    )


@router.get("/{scan_id}", response_model=ChatHistoryResponse)
async def get_history(
    scan_id: str,
    current_user: dict = Depends(get_current_user),
    limit: int = Query(default=_MAX_MESSAGES, ge=1, le=_MAX_MESSAGES),
    skip: int = Query(default=0, ge=0),
):
    await get_owned_scan(scan_id, current_user)

    cursor = (
        messages_collection()
        .find({"scan_id": ObjectId(scan_id)})
        .sort("created_at", 1)
        .skip(skip)
        .limit(limit)
    )
    docs = await cursor.to_list(length=limit)

    return ChatHistoryResponse(
        scan_id=scan_id,
        messages=[
            MessageResponse(
                id=str(d["_id"]),
                role=d["role"],
                content=d["content"],
                created_at=d["created_at"],
            )
            for d in docs
        ],
    )
