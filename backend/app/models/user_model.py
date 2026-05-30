from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    role: str = Field(..., description="Role: recruiter or candidate")
    full_name: str = Field(..., min_length=1, max_length=100)


class UserRegister(UserBase):
    password: str = Field(..., min_length=6, description="Plaintext password")


class UserLogin(BaseModel):
    username_or_email: str
    password: str


class UserResponse(UserBase):
    id: str
    created_at: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "email": "recruiter@company.com",
                "username": "johndoe",
                "role": "recruiter",
                "full_name": "John Doe",
                "id": "60c72b2f9b1d8e25b06d8601",
                "created_at": "2026-05-28T12:00:00"
            }
        }


class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str
    full_name: str


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
