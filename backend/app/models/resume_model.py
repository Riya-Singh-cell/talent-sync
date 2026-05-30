from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class EducationItem(BaseModel):
    school: Optional[str] = ""
    degree: Optional[str] = ""
    field_of_study: Optional[str] = ""
    year: Optional[str] = ""


class ExperienceItem(BaseModel):
    company: Optional[str] = ""
    role: Optional[str] = ""
    description: Optional[str] = ""
    duration: Optional[str] = ""


class ProjectItem(BaseModel):
    title: Optional[str] = ""
    description: Optional[str] = ""
    technologies: List[str] = Field(default_factory=list)


class ResumeUploadResponse(BaseModel):
    """Response model for resume upload"""
    message: str
    resume_id: str
    filename: str
    skills: List[str]
    text_length: int
    education: List[EducationItem] = Field(default_factory=list)
    experience: List[ExperienceItem] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    github_links: List[str] = Field(default_factory=list)
    candidate_name: Optional[str] = "Unknown"


class ResumeData(BaseModel):
    """Resume data model stored in MongoDB"""
    filename: str
    content: str
    skills: List[str]
    text_length: int
    uploaded_at: datetime
    candidate_id: Optional[str] = None
    candidate_name: Optional[str] = "Unknown"
    education: List[EducationItem] = Field(default_factory=list)
    experience: List[ExperienceItem] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    github_links: List[str] = Field(default_factory=list)
    technologies: List[str] = Field(default_factory=list)
    embedding: Optional[List[float]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "filename": "resume.pdf",
                "content": "John Doe...",
                "skills": ["Python", "FastAPI"],
                "text_length": 1500,
                "uploaded_at": "2026-05-28T10:30:00",
                "candidate_name": "John Doe",
                "education": [
                    {"school": "Stanford", "degree": "B.S.", "field_of_study": "Computer Science", "year": "2025"}
                ],
                "experience": [
                    {"company": "Google", "role": "Software Engineer Intern", "description": "Worked on AI pipelines.", "duration": "3 months"}
                ],
                "projects": [
                    {"title": "TalentSync AI", "description": "Semantic ranking platform.", "technologies": ["FastAPI", "React"]}
                ],
                "github_links": ["https://github.com/johndoe"]
            }
        }


class ErrorResponse(BaseModel):
    """Standard error response model"""
    detail: str
    error_code: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
