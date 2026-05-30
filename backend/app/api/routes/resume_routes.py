import logging
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from pydantic import BaseModel
from app.services.resume_service import process_resume
from app.models.resume_model import ResumeUploadResponse, ErrorResponse
from app.services.auth_service import get_current_user_optional
from app.services.ranking_service import match_resume_to_job_description

logger = logging.getLogger(__name__)

router = APIRouter()

# Constants
ALLOWED_EXTENSIONS = {'.pdf'}
MAX_FILENAME_LENGTH = 255


@router.get("/", tags=["Resume"])
async def resume_home() -> dict:
    """Get resume endpoint status"""
    return {
        "message": "Resume API endpoint is operational",
        "endpoints": {
            "upload": "POST /api/resume/upload-resume"
        }
    }


@router.post(
    "/upload-resume",
    response_model=ResumeUploadResponse,
    status_code=status.HTTP_200_OK,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid file format"},
        413: {"model": ErrorResponse, "description": "File too large"},
        500: {"model": ErrorResponse, "description": "Processing error"}
    },
    tags=["Resume"]
)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: Optional[dict] = Depends(get_current_user_optional)
) -> ResumeUploadResponse:
    """
    Upload and process a resume PDF file.
    
    - **file**: PDF file containing the resume (required)
    
    Returns:
        - Resume ID
        - Extracted skills
        - File metadata
    """
    # Validate filename
    if not file.filename:
        logger.warning("Upload attempt with no filename")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required"
        )
    
    if len(file.filename) > MAX_FILENAME_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Filename exceeds {MAX_FILENAME_LENGTH} characters"
        )
    
    # Validate file extension
    file_ext = None
    if '.' in file.filename:
        file_ext = '.' + file.filename.rsplit('.', 1)[-1].lower()
    
    if not file_ext or file_ext not in ALLOWED_EXTENSIONS:
        logger.warning(f"Invalid file type attempted: {file.filename}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only PDF files are allowed. Got: {file_ext or 'no extension'}"
        )
    
    # Validate content type
    if file.content_type and not file.content_type.startswith('application/pdf'):
        logger.warning(f"Invalid content type: {file.content_type}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Expected PDF, got: {file.content_type}"
        )
    
    # Process resume
    logger.info(f"Processing resume: {file.filename}")
    candidate_id = current_user.get("id") if current_user else None
    result = await process_resume(file, candidate_id)
    
    logger.info(f"Resume processed successfully: {result.resume_id}")
    return result


class MatchRequest(BaseModel):
    resume_text: str
    job_description: str
    candidate_name: Optional[str] = "Candidate"


@router.post(
    "/match",
    status_code=status.HTTP_200_OK,
    tags=["Resume"]
)
async def match_resume(
    request: MatchRequest
) -> dict:
    """
    Match a resume against a job description.
    
    This is a simple matching endpoint that doesn't require authentication.
    
    Args:
        - resume_text: Extracted text from the resume
        - job_description: Job posting description
        - candidate_name: Name of the candidate (optional)
    
    Returns:
        - match_score: Overall match percentage (0-100)
        - semantic_similarity: Vector similarity score
        - matched_skills: Skills that match job requirements
        - missing_skills: Required skills not found in resume
        - summary: AI-generated explanation
    """
    try:
        if not request.resume_text or not request.resume_text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Resume text is required"
            )
        
        if not request.job_description or not request.job_description.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job description is required"
            )
        
        result = await match_resume_to_job_description(
            resume_text=request.resume_text,
            job_description=request.job_description,
            candidate_name=request.candidate_name
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in match_resume: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during matching: {str(e)}"
        )
