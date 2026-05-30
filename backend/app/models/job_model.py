from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class JobCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=100)
    description: str = Field(..., min_length=10)
    company: Optional[str] = Field("TalentSync Corp", max_length=100)
    location: Optional[str] = Field("Remote", max_length=100)
    requirements: Optional[List[str]] = Field(default_factory=list)


class JobResponse(BaseModel):
    id: str
    title: str
    description: str
    company: str
    location: str
    requirements: List[str]
    created_at: datetime
    recruiter_id: str

    class Config:
        json_schema_extra = {
            "example": {
                "id": "60c72b2f9b1d8e25b06d8602",
                "title": "Machine Learning Engineer",
                "description": "Seeking an ML Engineer with experience in PyTorch and NLP...",
                "company": "AI Labs",
                "location": "San Francisco, CA",
                "requirements": ["python", "pytorch", "nlp"],
                "created_at": "2026-05-28T12:00:00",
                "recruiter_id": "60c72b2f9b1d8e25b06d8601"
            }
        }


class RankedCandidate(BaseModel):
    resume_id: str
    filename: str
    candidate_name: str
    skills: List[str]
    match_percentage: float
    semantic_similarity: float
    matched_skills: List[str]
    missing_skills: List[str]
    explanation: str
    education: List[dict] = Field(default_factory=list)
    experience: List[dict] = Field(default_factory=list)
    projects: List[dict] = Field(default_factory=list)
    github_links: List[str] = Field(default_factory=list)


class RankingResponse(BaseModel):
    job_id: str
    job_title: str
    total_candidates_screened: int
    rankings: List[RankedCandidate]
