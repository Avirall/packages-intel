from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError

from app.api.deps import get_current_user
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.db.mongodb import users_collection
from app.models.user import UserDocument
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest):
    col = users_collection()

    if await col.find_one({"email": body.email}):
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    if await col.find_one({"username": body.username}):
        raise HTTPException(status.HTTP_409_CONFLICT, "Username already taken")

    doc = UserDocument(
        email=body.email,
        username=body.username,
        hashed_password=hash_password(body.password),
    )
    result = await col.insert_one(doc.model_dump(exclude={"id"}))
    return UserResponse(
        id=str(result.inserted_id),
        email=body.email,
        username=body.username,
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    user = await users_collection().find_one({"email": body.email})
    if not user or not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")

    user_id = str(user["_id"])
    return TokenResponse(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest):
    try:
        payload = decode_token(body.refresh_token)
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token")

    if payload.get("kind") != "refresh":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Expected refresh token")

    user_id = payload["sub"]
    user = await users_collection().find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")

    return TokenResponse(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
    )


@router.get("/me", response_model=UserResponse)
async def me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user["_id"]),
        email=current_user["email"],
        username=current_user["username"],
    )
