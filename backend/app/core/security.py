from datetime import datetime, timedelta, timezone
from typing import Literal

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _create_token(subject: str, kind: Literal["access", "refresh"]) -> str:
    if kind == "access":
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.access_token_expire_minutes
        )
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            days=settings.refresh_token_expire_days
        )

    payload = {"sub": subject, "kind": kind, "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def create_access_token(user_id: str) -> str:
    return _create_token(user_id, "access")


def create_refresh_token(user_id: str) -> str:
    return _create_token(user_id, "refresh")


def decode_token(token: str) -> dict:
    """
    Returns the decoded payload or raises JWTError.
    Callers should catch JWTError and return 401.
    """
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
