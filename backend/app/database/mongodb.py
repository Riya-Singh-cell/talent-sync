import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME")

client = AsyncIOMotorClient(MONGO_URL)

database = client[DATABASE_NAME]

# Collections

resume_collection = database["resumes"]
job_collection = database["jobs"]
user_collection = database["users"]
