from datetime import datetime, timezone
from typing import Annotated, Literal

from bson import ObjectId
from pydantic import BaseModel, Field


class MessageDocument(BaseModel):
    id: Annotated[ObjectId | None, Field(alias="_id")] = None
    scan_id: ObjectId
    user_id: ObjectId
    role: Literal["user", "assistant"]
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"arbitrary_types_allowed": True, "populate_by_name": True}
