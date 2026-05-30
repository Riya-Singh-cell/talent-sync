import logging
from datetime import datetime
from typing import List
from fastapi import APIRouter, HTTPException, Depends, status
from bson import ObjectId
from app.database.mongodb import job_collection
from app.models.job_model import JobCreate, JobResponse, RankingResponse
from app.services.auth_service import verify_recruiter, get_current_user
from app.services.ranking_service import rank_candidates_for_job
from app.ai.skill_extractor import extract_skills

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/",
    response_model=JobResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Jobs"]
)
async def create_job_posting(
    job_in: JobCreate,
    current_user: dict = Depends(verify_recruiter)
) -> JobResponse:
    """
    Post a new Job description. Restricted to Recruiter roles.
    
    If requirements are not specified, they will be auto-extracted from the description.
    """
    logger.info(f"Recruiter {current_user['username']} is posting a new job...")
    
    # Auto extract skills if requirements are omitted
    reqs = job_in.requirements
    if not reqs:
        reqs = extract_skills(job_in.description)
    else:
        reqs = [r.lower().strip() for r in reqs]
        
    job_doc = {
        "title": job_in.title,
        "description": job_in.description,
        "company": job_in.company,
        "location": job_in.location,
        "requirements": reqs,
        "created_at": datetime.utcnow(),
        "recruiter_id": current_user["id"]
    }
    
    result = await job_collection.insert_one(job_doc)
    job_id = str(result.inserted_id)
    
    logger.info(f"Job posting successfully created with ID: {job_id}")
    
    return JobResponse(
        id=job_id,
        title=job_doc["title"],
        description=job_doc["description"],
        company=job_doc["company"],
        location=job_doc["location"],
        requirements=job_doc["requirements"],
        created_at=job_doc["created_at"],
        recruiter_id=job_doc["recruiter_id"]
    )


@router.get(
    "/",
    response_model=List[JobResponse],
    status_code=status.HTTP_200_OK,
    tags=["Jobs"]
)
async def list_jobs(
    current_user: dict = Depends(get_current_user)
) -> List[JobResponse]:
    """
    Retrieve all posted jobs in the system. Requires authentication.
    """
    cursor = job_collection.find().sort("created_at", -1)
    documents = await cursor.to_list(length=1000)
    
    jobs = []
    for doc in documents:
        jobs.append(JobResponse(
            id=str(doc["_id"]),
            title=doc["title"],
            description=doc["description"],
            company=doc.get("company", "TalentSync Corp"),
            location=doc.get("location", "Remote"),
            requirements=doc.get("requirements", []),
            created_at=doc["created_at"],
            recruiter_id=doc.get("recruiter_id", "system")
        ))
        
    return jobs


@router.post(
    "/{job_id}/rank",
    response_model=RankingResponse,
    status_code=status.HTTP_200_OK,
    tags=["Jobs"]
)
async def get_ranked_candidates(
    job_id: str,
    current_user: dict = Depends(verify_recruiter)
) -> RankingResponse:
    """
    Run semantic candidate ranking against a specific job posting.
    Restricted to Recruiter roles.
    
    Returns candidates ranked by match percentage (highest first).
    """
    logger.info(f"Recruiter {current_user['username']} requesting candidate rankings for Job ID: {job_id}")
    
    # Verify job exists and recruiter owns it
    try:
        job = await job_collection.find_one({"_id": ObjectId(job_id)})
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job posting with ID {job_id} not found"
            )
        
        # Check authorization - recruiter must own the job
        if job.get("recruiter_id") != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to rank candidates for this job"
            )
        
        # Run ranking pipeline
        result = await rank_candidates_for_job(job_id)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error ranking candidates for job {job_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error ranking candidates. Please try again later."
        )


@router.get(
    "/{job_id}",
    response_model=JobResponse,
    status_code=status.HTTP_200_OK,
    tags=["Jobs"]
)
async def get_job_detail(
    job_id: str,
    current_user: dict = Depends(get_current_user)
) -> JobResponse:
    """Get details for a specific job posting."""
    try:
        job = await job_collection.find_one({"_id": ObjectId(job_id)})
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job posting with ID {job_id} not found"
            )
        
        return JobResponse(
            id=str(job["_id"]),
            title=job["title"],
            description=job["description"],
            company=job.get("company", "TalentSync Corp"),
            location=job.get("location", "Remote"),
            requirements=job.get("requirements", []),
            created_at=job["created_at"],
            recruiter_id=job.get("recruiter_id", "system")
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching job {job_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching job details"
        )
