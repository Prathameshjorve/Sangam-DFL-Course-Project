"""
Authentication, Password Hashing, and JWT Token Management.
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
import hashlib
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from shared.models import UserRole

SECRET_KEY = os.getenv("JWT_SECRET", "sangam-dfl-distributed-system-secret-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 12

security = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    """Standard SHA-256 with salt for lightweight academic demonstration without platform build issues."""
    salt = "sangam_tactical_salt"
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if not credentials:
        # Default mock guest / analyst for academic convenience if token not passed
        return {"username": "analyst_guest", "role": UserRole.ANALYST, "is_authenticated": False}
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
        return {"username": username, "role": role, "is_authenticated": True}
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

def require_role(allowed_roles: list[UserRole]):
    async def role_checker(user = Depends(get_current_user)):
        # For demonstration purposes, if role in allowed_roles or admin
        user_role = user.get("role")
        if user_role == UserRole.ADMIN or user_role in allowed_roles:
            return user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Operation requires roles: {[r.value for r in allowed_roles]}"
        )
    return role_checker
