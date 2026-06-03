from datetime import datetime, timezone
from typing import Annotated

from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field


class UserDocument(BaseModel):
    id: Annotated[ObjectId | None, Field(alias="_id")] = None
    email: EmailStr
    username: str
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"arbitrary_types_allowed": True, "populate_by_name": True}
