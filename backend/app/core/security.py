from datetime import datetime, timedelta, timezone
from typing import Literal

import bcrypt
from jose import jwt

from app.core.config import settings

# Pre-computed dummy hash used for constant-time comparison when a user is not
# found — prevents timing attacks that could enumerate registered email addresses.
_DUMMY_HASH: bytes = bcrypt.hashpw(b"oss-sentinel-dummy", bcrypt.gensalt(rounds=4))


def hash_password(password: str) -> str:
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12))
    return hashed.decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def safe_verify_password(plain: str, hashed: str | None) -> bool:
    """
    Always runs bcrypt even when hashed is None, preventing timing attacks
    that could reveal whether an email address is registered.
    """
    if hashed is None:
        # Constant-time dummy check — result discarded
        bcrypt.checkpw(plain.encode("utf-8"), _DUMMY_HASH)
        return False
    return verify_password(plain, hashed)


def _create_token(subject: str, kind: Literal["access", "refresh"]) -> str:
    if kind == "access":
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.access_token_expire_minutes
        )
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            days=settings.refresh_token_expire_days
        )

    payload = {
        "sub":  subject,
        "kind": kind,
        "exp":  int(expire.timestamp()),  # Unix timestamp — unambiguous across jose versions
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def create_access_token(user_id: str) -> str:
    return _create_token(user_id, "access")


def create_refresh_token(user_id: str) -> str:
    return _create_token(user_id, "refresh")


def decode_token(token: str) -> dict:
    """
    Returns the decoded payload or raises JWTError.
    Callers must catch JWTError and return 401.
    """
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
