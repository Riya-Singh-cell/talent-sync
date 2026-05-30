import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, status
from app.database.mongodb import user_collection
from app.models.user_model import UserRegister, UserLogin, UserResponse, Token
from app.services.auth_service import hash_password, verify_password, create_access_token, get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Authentication"]
)
async def register(user_in: UserRegister) -> UserResponse:
    """
    Register a new user (recruiter or candidate).
    
    Checks for email/username uniqueness and hashes the plaintext password.
    """
    # Normalize inputs
    email_norm = user_in.email.lower().strip()
    username_norm = user_in.username.lower().strip()
    role_norm = user_in.role.lower().strip()

    if role_norm not in ["recruiter", "candidate"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be either 'recruiter' or 'candidate'"
        )

    # Check email duplicate
    existing_email = await user_collection.find_one({"email": email_norm})
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )

    # Check username duplicate
    existing_username = await user_collection.find_one({"username": username_norm})
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this username already exists"
        )

    # Hash password and create database document
    hashed_pwd = hash_password(user_in.password)
    user_doc = {
        "email": email_norm,
        "username": username_norm,
        "role": role_norm,
        "full_name": user_in.full_name,
        "password_hash": hashed_pwd,
        "created_at": datetime.utcnow()
    }

    result = await user_collection.insert_one(user_doc)
    
    # Return response model
    return UserResponse(
        id=str(result.inserted_id),
        email=email_norm,
        username=username_norm,
        role=role_norm,
        full_name=user_in.full_name,
        created_at=user_doc["created_at"]
    )


@router.post(
    "/login",
    response_model=Token,
    status_code=status.HTTP_200_OK,
    tags=["Authentication"]
)
async def login(credentials: UserLogin) -> Token:
    """
    Authenticate a user and return a JWT access token.
    
    Allows login via either username or email.
    """
    login_term = credentials.username_or_email.lower().strip()
    
    # Search for user by email or username
    user = await user_collection.find_one({
        "$or": [
            {"email": login_term},
            {"username": login_term}
        ]
    })
    
    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        logger.warning(f"Failed login attempt for: {login_term}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generate JWT token
    token_data = {
        "sub": user["username"],
        "role": user["role"]
    }
    access_token = create_access_token(data=token_data)
    
    logger.info(f"User logged in successfully: {user['username']} ({user['role']})")
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user["role"],
        username=user["username"],
        full_name=user["full_name"]
    )


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    tags=["Authentication"]
)
async def get_my_profile(current_user: dict = Depends(get_current_user)) -> UserResponse:
    """
    Retrieve profile details of the currently authenticated user.
    """
    return UserResponse(
        id=str(current_user["_id"]),
        email=current_user["email"],
        username=current_user["username"],
        role=current_user["role"],
        full_name=current_user["full_name"],
        created_at=current_user["created_at"]
    )
