import logging
import hashlib
from typing import List, Dict, Any, Optional
import numpy as np
from bson import ObjectId
from app.database.mongodb import resume_collection, job_collection
from app.ai.embedding_model import generate_embedding
from app.ai.vector_search import faiss_manager
from app.ai.skill_extractor import extract_skills
from app.services.cache_service import cache_service
from app.models.job_model import RankedCandidate, RankingResponse

logger = logging.getLogger(__name__)


def generate_ai_explanation(
    name: str,
    match_percentage: float,
    matched_skills: List[str],
    missing_skills: List[str],
    experience: List[dict],
    projects: List[dict]
) -> str:
    """
    Synthesize a rich, descriptive AI reasoning explanation for why a candidate matches a role.
    Integrates structured work history, projects, and skill overlaps.
    """
    if not matched_skills and not missing_skills:
        return f"{name} is matches the baseline criteria for this position. Their background exhibits technical familiarity with standard engineering methodologies."

    # Capitalize skills for readability
    matched_caps = [s.upper() for s in matched_skills]
    missing_caps = [s.upper() for s in missing_skills]
    
    # 1. Base statement
    rating = "an exceptional" if match_percentage >= 85 else "a strong" if match_percentage >= 70 else "a highly potential" if match_percentage >= 50 else "a moderate"
    explanation = f"{name} is {rating} match with a final score of {match_percentage}%. "
    
    # 2. Key matching skills
    if matched_caps:
        explanation += f"They demonstrate core expertise in key technologies such as {', '.join(matched_caps[:4])}, aligning well with the job requirements. "
    
    # 3. Work history reference
    if experience and experience[0].get("company") and experience[0].get("role"):
        exp = experience[0]
        explanation += f"Their professional experience as a {exp['role']} at {exp['company']} provides highly relevant domain expertise. "
    
    # 4. Project reference
    if projects and projects[0].get("title"):
        proj = projects[0]
        explanation += f"Furthermore, their hands-on work on projects like '{proj['title']}' showcases practical implementation of technical solutions. "
        
    # 5. Missing skills note
    if missing_caps:
        explanation += f"To achieve maximum alignment, the candidate could upskill in {', '.join(missing_caps[:3])}."
    else:
        explanation += "The candidate shows comprehensive coverage of all requested technical requirements with zero critical skill gaps."
        
    return explanation


async def rank_candidates_for_job(job_id: str) -> RankingResponse:
    """
    Rank all resumes in the database against a job description.
    
    Workflow:
    1. Checks cache for existing ranking results.
    2. Generates job description embedding.
    3. Searches the FAISS vector index for candidate match rankings.
    4. Combines vector matching with keyword overlap for final match score.
    5. Dynamically builds structured candidate profiles with AI matching insights.
    6. Caches results and returns.
    """
    logger.info(f"Initiating semantic ranking pipeline for Job ID: {job_id}")
    
    # Step 1: Check Cache
    cache_key = f"ranking:{job_id}"
    cached_results = cache_service.get(cache_key)
    if cached_results:
        logger.info(f"Serving cached candidate ranking results for Job: {job_id}")
        return RankingResponse(**cached_results)

    # Fetch Job details from MongoDB
    job = await job_collection.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise ValueError(f"Job posting with ID {job_id} does not exist.")

    job_title = job.get("title", "Software Role")
    job_desc_text = job.get("description", "")
    job_requirements = [req.lower().strip() for req in job.get("requirements", [])]
    
    # If job requirements are empty, extract skills directly from the description text
    if not job_requirements:
        job_requirements = extract_skills(job_desc_text)
        logger.info(f"Extracted {len(job_requirements)} job requirements from description text.")

    # Step 2: Generate Job Embedding
    job_embedding = generate_embedding(job_desc_text)
    
    # Step 3: Run Vector Similarity Search (FAISS)
    # Rebuild FAISS index if it's currently empty
    if not faiss_manager._id_map:
        logger.info("FAISS index is currently empty. Rebuilding index before searching...")
        await faiss_manager.rebuild_index()

    vector_results = faiss_manager.search(job_embedding, top_k=50)
    
    # If FAISS yielded nothing (e.g., no candidates indexed), return empty results
    if not vector_results:
        logger.warning("No candidate records were matched in vector search.")
        return RankingResponse(
            job_id=job_id,
            job_title=job_title,
            total_candidates_screened=0,
            rankings=[]
        )

    rankings: List[RankedCandidate] = []
    
    # Step 4: Enrich Vector results with structured data & keyword overlaps
    for resume_id, similarity_score in vector_results:
        # Fetch candidate resume document
        resume = await resume_collection.find_one({"_id": ObjectId(resume_id)})
        if not resume:
            continue
            
        candidate_skills = [s.lower() for s in resume.get("skills", [])]
        candidate_name = resume.get("candidate_name", "John Doe")
        filename = resume.get("filename", "resume.pdf")
        
        # Calculate skill overlaps
        matched_skills = list(set(candidate_skills) & set(job_requirements))
        missing_skills = list(set(job_requirements) - set(candidate_skills))
        
        # Calculate exact skill overlap percentage
        skill_overlap_percentage = 100.0
        if job_requirements:
            skill_overlap_percentage = (len(matched_skills) / len(job_requirements)) * 100.0
            
        # Hybrid Scoring: 70% Semantic Vector Similarity, 30% Keyword Skill Overlap
        match_percentage = (0.7 * similarity_score) + (0.3 * skill_overlap_percentage)
        match_percentage = round(max(0.0, min(100.0, match_percentage)), 2)

        # Generate AI explanation text
        explanation = generate_ai_explanation(
            name=candidate_name,
            match_percentage=match_percentage,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            experience=resume.get("experience", []),
            projects=resume.get("projects", [])
        )
        
        ranked_candidate = RankedCandidate(
            resume_id=resume_id,
            filename=filename,
            candidate_name=candidate_name,
            skills=resume.get("skills", []),
            match_percentage=match_percentage,
            semantic_similarity=similarity_score,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            explanation=explanation,
            education=resume.get("education", []),
            experience=resume.get("experience", []),
            projects=resume.get("projects", []),
            github_links=resume.get("github_links", [])
        )
        
        rankings.append(ranked_candidate)

    # Sort candidates by final match percentage in descending order
    rankings.sort(key=lambda x: x.match_percentage, reverse=True)

    ranking_response = RankingResponse(
        job_id=job_id,
        job_title=job_title,
        total_candidates_screened=len(rankings),
        rankings=rankings
    )

    # Cache the final serialized results (TTL = 5 minutes / 300 seconds)
    cache_service.set(cache_key, ranking_response.dict(), ttl_seconds=300)
    
    logger.info(f"Semantic ranking complete. Sorted {len(rankings)} candidates for Job: {job_title}")
    return ranking_response


async def match_resume_to_job_description(
    resume_text: str,
    job_description: str,
    candidate_name: str = "Candidate",
    extracted_skills: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Match a single resume against a job description.
    
    This is a simplified matching function that doesn't require storing resume in DB.
    
    Args:
        resume_text: Extracted text from resume
        job_description: Job posting description
        candidate_name: Name of the candidate (optional)
        extracted_skills: Pre-extracted skills from resume (optional)
    
    Returns:
        Dictionary with match results including:
        - match_score: Overall match percentage (0-100)
        - semantic_similarity: Vector similarity score (0-100)
        - matched_skills: Skills that match job requirements
        - missing_skills: Required skills not found in resume
        - summary: AI-generated explanation
    """
    try:
        logger.info(f"Matching resume for {candidate_name} against job description")
        
        # Extract job requirements from description
        job_requirements = extract_skills(job_description)
        logger.info(f"Extracted {len(job_requirements)} job requirements")
        
        # Use provided skills or extract from resume text
        if extracted_skills:
            candidate_skills = [s.lower().strip() for s in extracted_skills]
        else:
            candidate_skills = extract_skills(resume_text)
        logger.info(f"Found {len(candidate_skills)} candidate skills")
        
        # Generate embeddings
        resume_embedding = generate_embedding(resume_text)
        job_embedding = generate_embedding(job_description)
        
        # Calculate semantic similarity (cosine similarity between embeddings)
        # Normalize embeddings and compute dot product
        resume_norm = resume_embedding / (np.linalg.norm(resume_embedding) + 1e-8)
        job_norm = job_embedding / (np.linalg.norm(job_embedding) + 1e-8)
        semantic_similarity = float(np.dot(resume_norm, job_norm)) * 100  # Scale to 0-100
        semantic_similarity = max(0.0, min(100.0, semantic_similarity))
        
        # Calculate skill overlaps
        job_reqs_lower = [req.lower().strip() for req in job_requirements]
        matched_skills = list(set(candidate_skills) & set(job_reqs_lower))
        missing_skills = list(set(job_reqs_lower) - set(candidate_skills))
        
        # Calculate skill overlap percentage
        skill_overlap_percentage = 100.0
        if job_reqs_lower:
            skill_overlap_percentage = (len(matched_skills) / len(job_reqs_lower)) * 100.0
        
        # Hybrid Scoring: 70% Semantic Similarity, 30% Skill Overlap
        match_score = (0.7 * semantic_similarity) + (0.3 * skill_overlap_percentage)
        match_score = round(max(0.0, min(100.0, match_score)), 2)
        
        # Generate AI explanation
        summary = generate_ai_explanation(
            name=candidate_name,
            match_percentage=match_score,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            experience=[],
            projects=[]
        )
        
        result = {
            "match_score": match_score,
            "semantic_similarity": round(semantic_similarity, 2),
            "skill_overlap_percentage": round(skill_overlap_percentage, 2),
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "all_required_skills": job_reqs_lower,
            "candidate_skills": candidate_skills,
            "summary": summary
        }
        
        logger.info(f"Match analysis complete: {match_score}% match score")
        return result
        
    except Exception as e:
        logger.error(f"Error during resume matching: {str(e)}")
        raise
