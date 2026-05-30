import os
import logging
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
import bcrypt
from app.database.mongodb import user_collection
from app.models.user_model import TokenData

logger = logging.getLogger(__name__)

# Constants for JWT
SECRET_KEY = os.getenv("JWT_SECRET", "talentsync_ai_very_secret_key_1234567890")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# OAuth2PasswordBearer reads token from Authorization: Bearer <token>
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def hash_password(password: str) -> str:
    """Hash a plaintext password securely using bcrypt."""
    salt = bcrypt.gensalt(rounds=10)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify if plaintext password matches the hashed password."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception as e:
        logger.error(f"Error verifying password: {str(e)}")
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generate a JWT access token with an expiration timeframe."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> dict:
    """
    FastAPI dependency to extract and return the current user document.
    Raises 401 if token is missing or invalid.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None or role is None:
            raise credentials_exception
        token_data = TokenData(username=username, role=role)
    except jwt.PyJWTError as e:
        logger.warning(f"JWT validation failed: {str(e)}")
        raise credentials_exception

    user = await user_collection.find_one({"username": token_data.username})
    if user is None:
        raise credentials_exception
    
    # Standardize string ID representation for easy consumption
    user["id"] = str(user["_id"])
    return user


async def get_current_user_optional(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[dict]:
    """
    FastAPI dependency to retrieve the user if token is provided.
    Returns None if token is absent or invalid, preventing crashes.
    """
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        user = await user_collection.find_one({"username": username})
        if user:
            user["id"] = str(user["_id"])
            return user
    except Exception:
        return None
    return None



async def verify_recruiter(current_user: dict = Depends(get_current_user)) -> dict:
    """Dependency that ensures the authenticated user is a recruiter."""
    if current_user.get("role") != "recruiter":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Recruiter privileges required"
        )
    return current_user


async def verify_candidate(current_user: dict = Depends(get_current_user)) -> dict:
    """Dependency that ensures the authenticated user is a candidate."""
    if current_user.get("role") != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Candidate privileges required"
        )
    return current_user
