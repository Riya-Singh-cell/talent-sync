import logging
from typing import List, Union
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from app.ai.embedding_model import generate_embedding, get_embedding_model

logger = logging.getLogger(__name__)


def calculate_similarity_from_embeddings(emb1: np.ndarray, emb2: np.ndarray) -> float:
    """Calculate the cosine similarity between two embeddings."""
    try:
        e1 = emb1.reshape(1, -1)
        e2 = emb2.reshape(1, -1)
        similarity_score = cosine_similarity(e1, e2)[0][0]
        similarity_score = max(0.0, min(1.0, float(similarity_score)))
        return round(similarity_score * 100, 2)
    except Exception as e:
        logger.error(f"Error calculating similarity: {str(e)}")
        return 0.0


def calculate_similarity(resume_text: str, job_description: str) -> float:
    """Calculate semantic similarity percentage between a resume and job description."""
    if not resume_text or not job_description:
        return 0.0
    
    try:
        resume_embedding = generate_embedding(resume_text)
        job_embedding = generate_embedding(job_description)
        return calculate_similarity_from_embeddings(resume_embedding, job_embedding)
    except Exception as e:
        logger.error(f"Error calculating similarity: {str(e)}")
        return 0.0


def calculate_similarities_batch(job_description: str, resume_texts: List[str]) -> List[float]:
    """Batch calculate similarities of multiple resumes against a job description."""
    if not job_description or not resume_texts:
        return [0.0] * len(resume_texts)
    
    try:
        model = get_embedding_model()
        job_embedding = model.encode(job_description, convert_to_numpy=True).reshape(1, -1)
        
        valid_resumes = []
        valid_indices = []
        
        for i, text in enumerate(resume_texts):
            if text and isinstance(text, str) and text.strip():
                valid_resumes.append(text)
                valid_indices.append(i)
        
        results = [0.0] * len(resume_texts)
        
        if not valid_resumes:
            return results
        
        resume_embeddings = model.encode(valid_resumes, convert_to_numpy=True)
        
        for idx, emb_idx in enumerate(valid_indices):
            sim = cosine_similarity(
                job_embedding,
                resume_embeddings[idx].reshape(1, -1)
            )[0][0]
            results[emb_idx] = round(max(0.0, min(1.0, float(sim))) * 100, 2)
        
        return results
    except Exception as e:
        logger.error(f"Error calculating batch similarities: {str(e)}")
        return [0.0] * len(resume_texts)
