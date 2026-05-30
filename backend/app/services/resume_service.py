import io
import fitz
import PyPDF2
import logging
from datetime import datetime
from typing import Optional
from fastapi import UploadFile, HTTPException
from app.database.mongodb import resume_collection
from app.services.parser_service import parse_resume_structured
from app.ai.embedding_model import generate_embedding
from app.models.resume_model import ResumeUploadResponse

logger = logging.getLogger(__name__)

# Constants
MAX_PDF_SIZE_MB = 10
MAX_RESUME_TEXT_LENGTH = 1_000_000


async def extract_text_from_pdf(file: UploadFile) -> str:
    """
    Extract text from an uploaded PDF file using PyMuPDF with PyPDF2 fallback.
    
    Args:
        file (UploadFile): The PDF file to extract text from
        
    Returns:
        str: Extracted text from the PDF
        
    Raises:
        HTTPException: If PDF is invalid or cannot be processed
    """
    try:
        pdf_bytes = await file.read()
        
        # Validate file size
        file_size_mb = len(pdf_bytes) / (1024 * 1024)
        if file_size_mb > MAX_PDF_SIZE_MB:
            logger.warning(f"PDF file too large: {file.filename} ({file_size_mb:.2f}MB)")
            raise HTTPException(
                status_code=413,
                detail=f"File size exceeds {MAX_PDF_SIZE_MB}MB limit"
            )
        
        extracted_text = ""
        
        # Method 1: Try PyMuPDF (fitz)
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            for page_num, page in enumerate(doc):
                try:
                    text = page.get_text()
                    extracted_text += text
                except Exception as page_err:
                    logger.warning(f"PyMuPDF error on page {page_num + 1} of {file.filename}: {str(page_err)}")
                    continue
            doc.close()
        except Exception as fitz_err:
            logger.warning(f"PyMuPDF failed to process PDF {file.filename}: {str(fitz_err)}")
            
        # Method 2: Try PyPDF2 as fallback if PyMuPDF returned no text or failed
        if not extracted_text.strip():
            logger.info(f"PyMuPDF returned no text for {file.filename}. Trying PyPDF2 fallback...")
            try:
                pdf_file = io.BytesIO(pdf_bytes)
                reader = PyPDF2.PdfReader(pdf_file)
                for page_num, page in enumerate(reader.pages):
                    try:
                        text = page.extract_text()
                        if text:
                            extracted_text += text + "\n"
                    except Exception as page_err:
                        logger.warning(f"PyPDF2 error on page {page_num + 1} of {file.filename}: {str(page_err)}")
                        continue
            except Exception as pypdf_err:
                logger.error(f"PyPDF2 fallback also failed for {file.filename}: {str(pypdf_err)}")
        
        # Validate extracted text
        if not extracted_text.strip():
            logger.warning(f"No text extracted from PDF: {file.filename}")
            raise HTTPException(
                status_code=400,
                detail="PDF appears to be empty or contains no extractable text"
            )
        
        if len(extracted_text) > MAX_RESUME_TEXT_LENGTH:
            logger.warning(f"Extracted text exceeds maximum length: {file.filename}")
            extracted_text = extracted_text[:MAX_RESUME_TEXT_LENGTH]
        
        logger.info(f"Successfully extracted text from {file.filename} ({len(extracted_text)} characters)")
        return extracted_text
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing PDF {file.filename}: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail="Failed to process PDF file. Please ensure it's a valid PDF."
        )


async def process_resume(file: UploadFile, candidate_id: Optional[str] = None) -> ResumeUploadResponse:
    """
    Process an uploaded resume PDF file:
    - Extracts raw text
    - Parses structured details (experience, education, projects, certifications, etc.)
    - Generates 384-dimensional vector embedding of the resume content
    - Stores the document and embedding in MongoDB
    
    Args:
        file (UploadFile): The resume PDF file to process
        candidate_id (str, optional): The user ID of the candidate uploading this resume
        
    Returns:
        ResumeUploadResponse: Structured response including all parsed fields
    """
    try:
        # Step 1: Extract text from PDF
        resume_text = await extract_text_from_pdf(file)
        
        # Step 2: Run high-fidelity structured parser
        parsed_data = parse_resume_structured(resume_text)
        
        # Step 3: Generate dense embedding vector (384-dim)
        logger.info(f"Generating dense vector representation for {file.filename}...")
        emb = generate_embedding(resume_text)
        embedding_list = emb.tolist() if hasattr(emb, "tolist") else list(emb)
        
        # Step 4: Create MongoDB document mapping
        resume_doc = {
            "filename": file.filename,
            "content": resume_text,
            "skills": parsed_data["skills"],
            "text_length": len(resume_text),
            "uploaded_at": datetime.utcnow(),
            "candidate_id": candidate_id,
            "candidate_name": parsed_data["candidate_name"],
            "education": [e.dict() for e in parsed_data["education"]],
            "experience": [exp.dict() for exp in parsed_data["experience"]],
            "projects": [p.dict() for p in parsed_data["projects"]],
            "certifications": parsed_data["certifications"],
            "technologies": parsed_data["technologies"],
            "embedding": embedding_list
        }
        
        # Step 5: Save in MongoDB
        result = await resume_collection.insert_one(resume_doc)
        resume_id = str(result.inserted_id)
        
        logger.info(f"Resume saved and embedded successfully with ID: {resume_id}")
        
        # Step 6: Formulate Pydantic response
        return ResumeUploadResponse(
            message="Resume uploaded, parsed, and embedded successfully",
            resume_id=resume_id,
            filename=file.filename,
            skills=parsed_data["skills"],
            text_length=len(resume_text),
            education=parsed_data["education"],
            experience=parsed_data["experience"],
            projects=parsed_data["projects"],
            github_links=parsed_data["github_links"],
            candidate_name=parsed_data["candidate_name"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error processing resume: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred while processing the resume: {str(e)}"
        )
