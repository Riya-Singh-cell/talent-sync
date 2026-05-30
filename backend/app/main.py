from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging
import os
from datetime import datetime
from app.database.mongodb import database

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

# Configuration from environment variables
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:8080").split(",")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Import Routes
from app.api.routes.resume_routes import router as resume_router
from app.api.routes.auth_routes import router as auth_router
from app.api.routes.job_routes import router as job_router
from app.ai.vector_search import faiss_manager

# Initialize FastAPI App
app = FastAPI(
    title="TalentSync AI",
    description="AI-powered Resume Screening and Candidate Matching System",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configure CORS - Restrict to specific origins in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=600
)

# Include API Routes
app.include_router(
    auth_router,
    prefix="/api/auth",
    tags=["Authentication"]
)

app.include_router(
    resume_router,
    prefix="/api/resume",
    tags=["Resume"]
)

app.include_router(
    job_router,
    prefix="/api/job",
    tags=["Jobs"]
)


# Global Exception Handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    """Handle validation errors"""
    logger.error(f"Validation error: {exc}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": str(exc),
            "timestamp": datetime.utcnow().isoformat()
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle all unhandled exceptions"""
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An unexpected error occurred",
            "timestamp": datetime.utcnow().isoformat()
        },
    )


# Startup Events
@app.on_event("startup")
async def startup_event():
    """Execute on application startup"""
    try:
        logger.info(f"Environment: {ENVIRONMENT}")
        logger.info(f"Allowed Origins: {ALLOWED_ORIGINS}")
        logger.info("TalentSync AI Backend Started Successfully")
        
        # Verify MongoDB connection
        try:
            await database.command("ping")
            logger.info("MongoDB Connected Successfully")
        except Exception as e:
            logger.error(f"MongoDB Connection Failed: {str(e)}")

        # Initialize FAISS Index Manager
        try:
            await faiss_manager.initialize()
            logger.info("FAISS Index Manager initialized successfully")
        except Exception as e:
            logger.error(f"FAISS Index Manager initialization failed: {str(e)}")
    except Exception as e:
        logger.error(f"Startup error: {str(e)}")


@app.on_event("shutdown")
async def shutdown_event():
    """Execute on application shutdown"""
    logger.info("TalentSync AI Backend Shutting Down")


# Root Endpoint
@app.get("/", tags=["Status"])
async def root():
    """Root endpoint - API information"""
    return {
        "message": "TalentSync AI Backend Running Successfully",
        "version": "2.0.0",
        "environment": ENVIRONMENT,
        "docs": "/docs",
        "health": "/health"
    }


# Health Check Endpoint
@app.get("/health", tags=["Status"])
async def health_check():
    """Health check endpoint for monitoring"""
    try:
        await database.command("ping")
        return {
            "status": "healthy",
            "message": "Backend server is running properly",
            "database": "connected",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "message": "Backend server is experiencing issues",
                "database": "disconnected",
                "timestamp": datetime.utcnow().isoformat()
            },
        )


# API Metadata Endpoint
@app.get("/api/info", tags=["Status"])
async def api_info():
    """Get API information and available endpoints"""
    return {
        "name": "TalentSync AI Backend",
        "version": "2.0.0",
        "endpoints": {
            "resume": "/api/resume",
            "auth": "/api/auth",
            "job": "/api/job"
        },
        "docs": "/docs"
    }


# Run Application
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=ENVIRONMENT == "development"
    )
