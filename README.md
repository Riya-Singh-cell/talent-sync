# TalentSync AI - AI-Powered Resume Screening Platform

A modern, AI-driven recruitment platform that uses semantic similarity matching to rank candidates against job descriptions. Powered by sentence transformers, FAISS vector search, and FastAPI.

## Features

- **Semantic Resume Matching**: Uses SentenceTransformers to understand context beyond keywords
- **Instant Screening**: FAISS-powered vector search for fast candidate ranking
- **Smart Insights**: Detailed candidate profiles with skill analysis and match explanations
- **Vector Embeddings**: 384-dimensional embeddings for precise semantic similarity
- **Hybrid Scoring**: Combines semantic similarity (70%) with skill overlap (30%)
- **Caching**: Redis-backed caching for fast ranking results
- **Modern UI**: React-based responsive interface with Tailwind CSS

## Tech Stack

### Backend
- **FastAPI** - Modern async Python web framework
- **Motor** - Async MongoDB driver
- **SentenceTransformers** - Semantic text embeddings (all-MiniLM-L6-v2 model)
- **FAISS** - Vector similarity search
- **PyJWT** - JWT authentication
- **Pydantic** - Data validation

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Axios** - HTTP client
- **Recharts** - Data visualization

### Infrastructure
- **MongoDB** - NoSQL database
- **Redis** - Caching layer (optional)
- **Docker** - Containerization

## Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB (local or Docker)
- Docker & Docker Compose (for containerized setup)

## Local Setup

### 1. Clone and Navigate
```bash
cd TalentSync-AI
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start MongoDB locally or use Docker:
# docker run -d -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=password mongo

# Set environment variables (create .env file in backend directory)
# MONGO_URL=mongodb://admin:password@localhost:27017
# DATABASE_NAME=talentsync_ai
# ENVIRONMENT=development
# JWT_SECRET=your_secret_key

# Run the backend server
python run.py
```

Backend will be available at: http://localhost:8000

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will be available at: http://localhost:5173

## Docker Setup

### Using Docker Compose

```bash
# From project root directory
docker-compose up --build

# This will start:
# - MongoDB on port 27017
# - Backend on port 8000
# - Frontend on port 5173
```

### Stop Services

```bash
docker-compose down
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (recruiter/candidate)
- `POST /api/auth/login` - Login user

### Resume Management
- `POST /api/resume/upload-resume` - Upload and process resume PDF
- `GET /api/resume` - Resume endpoint status

### Job Management
- `POST /api/job` - Create job posting (recruiters only)
- `GET /api/job` - List all jobs
- `GET /api/job/{job_id}` - Get job details
- `POST /api/job/{job_id}/rank` - Rank candidates for job

### System
- `GET /` - API information
- `GET /health` - Health check endpoint
- `GET /docs` - Interactive API documentation (Swagger UI)

## Usage Flow

### For Recruiters

1. **Register/Login**: Create an account as a recruiter
2. **Post Job**: Create a job posting with title, description, and optionally requirements
3. **Upload Resumes**: Candidates upload their resumes through the platform
4. **Rank Candidates**: Click "Rank Candidates" to see semantic matching results
5. **Review Results**: View ranked candidates with match percentages and insights

### For Candidates

1. **Register/Login**: Create an account as a candidate
2. **Upload Resume**: Upload your resume (PDF format)
3. **View Profiles**: See how your resume matches different job postings

## Environment Variables

### Backend (.env)

```env
ENVIRONMENT=development
MONGO_URL=mongodb://admin:password@localhost:27017
DATABASE_NAME=talentsync_ai
JWT_SECRET=your_secret_key_here
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
REDIS_HOST=localhost
REDIS_PORT=6379
CACHE_ENABLED=false
LOG_LEVEL=INFO
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000
VITE_API_BASE=http://localhost:8000/api
```

## Project Structure

```
TalentSync-AI/
├── backend/
│   ├── app/
│   │   ├── ai/              # AI modules (embeddings, FAISS, skills)
│   │   ├── api/routes/      # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── models/          # Data models
│   │   ├── database/        # MongoDB connection
│   │   └── main.py          # FastAPI app
│   ├── run.py              # Entry point
│   └── requirements.txt    # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── pages/          # Page components
│   │   ├── components/     # Reusable components
│   │   ├── services/       # API services
│   │   ├── App.jsx         # Main app component
│   │   └── index.css       # Global styles
│   ├── package.json        # Node dependencies
│   └── vite.config.js      # Vite configuration
│
├── docker-compose.yml      # Docker Compose configuration
└── README.md              # This file
```

## Key Features Explained

### Semantic Matching
- Uses `all-MiniLM-L6-v2` SentenceTransformer model
- Generates 384-dimensional dense vectors for resumes and job descriptions
- Measures cosine similarity between vectors

### FAISS Vector Search
- Indexes all resume embeddings for fast similarity search
- Supports real-time dynamic index updates
- Handles thousands of candidates efficiently

### Hybrid Scoring
- **70% Semantic Similarity**: Vector-based contextual matching
- **30% Skill Overlap**: Keyword-based exact skill matching
- Final score ranges from 0-100

### Resume Parsing
- Extracts structured information:
  - Candidate name
  - Skills and technologies
  - Education history
  - Work experience
  - Projects and certifications
  - GitHub and social links

## Troubleshooting

### MongoDB Connection Issues
```
Error: Cannot connect to MongoDB
Solution: Ensure MongoDB is running and MONGO_URL is correctly set
```

### Port Already in Use
```bash
# Find process using port
netstat -ano | findstr :8000  # Windows
lsof -i :8000                 # macOS/Linux

# Kill process (Windows)
taskkill /PID <PID> /F
```

### Module Import Errors
```bash
# Reinstall dependencies
pip install --force-reinstall -r requirements.txt
```

## Performance Metrics

- **Resume Upload**: < 2 seconds for typical PDF
- **Candidate Ranking**: < 1 second for 100+ candidates
- **Cache Hit**: < 100ms for cached results
- **Embedding Generation**: ~500ms per resume

## Future Enhancements

- [ ] Advanced filtering and search
- [ ] Batch resume processing
- [ ] Interview scheduling integration
- [ ] ATS integration
- [ ] ML model fine-tuning
- [ ] Multi-language support

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

This project is licensed under the MIT License - see LICENSE file for details.

## Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the development team.

---

**Version**: 2.0.0  
**Last Updated**: May 2026  
**Status**: Production Ready
