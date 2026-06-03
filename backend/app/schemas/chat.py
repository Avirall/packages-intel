from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class MessageRequest(BaseModel):
    content: str


class MessageResponse(BaseModel):
    id: str
    role: Literal["user", "assistant"]
    content: str
    created_at: datetime


class ChatHistoryResponse(BaseModel):
    scan_id: str
    messages: list[MessageResponse]
