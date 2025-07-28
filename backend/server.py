from fastapi import FastAPI, APIRouter, HTTPException, Query, Depends, Header, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import requests
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any, Union
import uuid
from datetime import datetime, timedelta
from enum import Enum
import hashlib
import secrets
import aiofiles
import magic
from PIL import Image
import tempfile
import shutil
import json
import re
import yt_dlp
import subprocess
from urllib.parse import urlparse, parse_qs

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer(auto_error=False)

# User Roles Enum
class UserRole(str, Enum):
    GUEST = "guest"
    STUDENT = "student"
    INSTRUCTOR = "instructor"
    ADMIN = "admin"

# Enums
class VideoLevel(str, Enum):
    NEW_BEGINNER = "New Beginner"
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"

class VideoCategory(str, Enum):
    CONVERSATION = "Conversation"
    GRAMMAR = "Grammar"
    VOCABULARY = "Vocabulary"
    PRONUNCIATION = "Pronunciation"
    CULTURE = "Culture"
    BUSINESS = "Business"

class AccentType(str, Enum):
    BRITISH = "British"
    AMERICAN = "American"
    AUSTRALIAN = "Australian"
    CANADIAN = "Canadian"

class GuideType(str, Enum):
    NATIVE_SPEAKER = "Native Speaker"
    ESL_TEACHER = "ESL Teacher"
    LANGUAGE_COACH = "Language Coach"

# Models
class Video(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    thumbnail_url: str
    video_url: str
    duration_minutes: int
    level: VideoLevel
    category: VideoCategory
    accent: AccentType
    guide: GuideType
    country: str
    is_premium: bool = False
    series_id: Optional[str] = None
    series_order: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VideoSeries(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    thumbnail_url: str
    level: VideoLevel
    category: VideoCategory
    video_count: int
    total_duration_minutes: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

class WatchProgress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None  # For guest users, this will be None
    session_id: str  # For tracking guest progress
    video_id: str
    watched_minutes: int
    completed: bool = False
    watched_at: datetime = Field(default_factory=datetime.utcnow)

class DailyProgress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    session_id: str
    date: str  # Format: YYYY-MM-DD
    total_minutes_watched: int
    videos_watched: List[str] = []
    streak_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserStats(BaseModel):
    user_id: Optional[str] = None
    session_id: str
    total_minutes_watched: int = 0
    current_streak: int = 0
    longest_streak: int = 0
    personal_best_day: int = 0
    level_progress: Dict[str, int] = {}
    milestones_achieved: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class VideoFilterRequest(BaseModel):
    level: Optional[VideoLevel] = None
    category: Optional[VideoCategory] = None
    accent: Optional[AccentType] = None
    guide: Optional[GuideType] = None
    country: Optional[str] = None
    is_premium: Optional[bool] = None
    search: Optional[str] = None
    max_duration: Optional[int] = None
    sort_by: Optional[str] = "newest"  # newest, popular, shortest, longest

class EmailSubscribeRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    source: str = "english_fiesta"

# Authentication Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    picture: Optional[str] = None
    role: UserRole = UserRole.STUDENT
    emergent_user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class UserSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_token: str
    emergent_session_id: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class AuthSessionRequest(BaseModel):
    session_id: str

class UserProfileResponse(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str]
    role: UserRole
    created_at: datetime
    session_token: str

class RoleUpdateRequest(BaseModel):
    user_id: str
    new_role: UserRole

# Manual Activity Tracking Models
class ActivityType(str, Enum):
    MOVIES_TV = "Movies/TV Shows"
    AUDIOBOOKS_PODCASTS = "Audiobooks/Podcasts"
    TALKING_FRIENDS = "Talking with friends"

class ActivityLevel(str, Enum):
    NEW_BEGINNER = "New Beginner"
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"

class ManualActivity(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    session_id: str
    activity_type: ActivityType
    duration_minutes: int
    date: str  # Format: YYYY-MM-DD
    title: Optional[str] = None
    difficulty_level: Optional[ActivityLevel] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ManualActivityRequest(BaseModel):
    activity_type: ActivityType
    duration_minutes: int
    date: str  # Format: YYYY-MM-DD
    title: Optional[str] = None
    difficulty_level: Optional[ActivityLevel] = None

class MarkAsWatchedRequest(BaseModel):
    difficulty_level: Optional[ActivityLevel] = None

# Current User Dependency
async def get_current_user(authorization: HTTPAuthorizationCredentials = Depends(security)) -> Optional[User]:
    """Get current authenticated user from session token"""
    if not authorization:
        return None
    
    session_token = authorization.credentials
    
    # Find active session
    session = await db.user_sessions.find_one({
        "session_token": session_token,
        "is_active": True,
        "expires_at": {"$gt": datetime.utcnow()}
    })
    
    if not session:
        return None
    
    # Get user
    user = await db.users.find_one({"id": session["user_id"]}, {"_id": 0})
    if not user:
        return None
    
    return User(**user)

# Role-based access decorators
def require_role(required_role: UserRole):
    """Decorator to require specific role or higher"""
    role_hierarchy = {
        UserRole.GUEST: 0,
        UserRole.STUDENT: 1, 
        UserRole.INSTRUCTOR: 2,
        UserRole.ADMIN: 3
    }
    
    async def role_checker(current_user: User = Depends(get_current_user)):
        if not current_user:
            if required_role == UserRole.GUEST:
                return None
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_level = role_hierarchy.get(current_user.role, 0)
        required_level = role_hierarchy.get(required_role, 0)
        
        if user_level < required_level:
            raise HTTPException(
                status_code=403, 
                detail=f"Insufficient permissions. Required: {required_role}, Current: {current_user.role}"
            )
        
        return current_user
    
    return role_checker

# Role helpers
require_student = require_role(UserRole.STUDENT)
require_instructor = require_role(UserRole.INSTRUCTOR)  
require_admin = require_role(UserRole.ADMIN)

# Initialize sample data
async def init_sample_data():
    """Initialize sample video data if database is empty"""
    video_count = await db.videos.count_documents({})
    if video_count == 0:
        sample_videos = [
            {
                "id": str(uuid.uuid4()),
                "title": "Basic English Greetings",
                "description": "Learn how to greet people in English with proper pronunciation and cultural context.",
                "thumbnail_url": "https://images.unsplash.com/photo-1645594287996-086e2217a809?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwzfHxsYW5ndWFnZSUyMGxlYXJuaW5nfGVufDB8fHxibHVlfDE3NTMxNzE5NDR8MA&ixlib=rb-4.1.0&q=85",
                "video_url": "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
                "duration_minutes": 8,
                "level": "New Beginner",
                "category": "Conversation",
                "accent": "American",
                "guide": "Native Speaker",
                "country": "United States",
                "is_premium": False,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Present Simple vs Present Continuous",
                "description": "Master the difference between present simple and present continuous tenses with examples.",
                "thumbnail_url": "https://images.unsplash.com/photo-1426024120108-99cc76989c71?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwyfHxvbmxpbmUlMjBlZHVjYXRpb258ZW58MHx8fGJsdWV8MTc1MzE3MTk1N3ww&ixlib=rb-4.1.0&q=85",
                "video_url": "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4",
                "duration_minutes": 15,
                "level": "Beginner",
                "category": "Grammar",
                "accent": "British",
                "guide": "ESL Teacher",
                "country": "United Kingdom",
                "is_premium": False,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Business Meeting Vocabulary",
                "description": "Essential vocabulary and phrases for professional English business meetings.",
                "thumbnail_url": "https://images.unsplash.com/photo-1651796704084-a115817945b2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwzfHxvbmxpbmUlMjBlZHVjYXRpb258ZW58MHx8fGJsdWV8MTc1MzE3MTk1N3ww&ixlib=rb-4.1.0&q=85",
                "video_url": "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4",
                "duration_minutes": 25,
                "level": "Advanced",
                "category": "Business",
                "accent": "American",
                "guide": "Language Coach",
                "country": "United States",
                "is_premium": True,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Australian Pronunciation Guide",
                "description": "Learn the unique sounds and pronunciation patterns of Australian English.",
                "thumbnail_url": "https://images.unsplash.com/photo-1527871369852-eb58cb2b54e2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwxfHxhY2hpZXZlbWVudHxlbnwwfHx8Ymx1ZXwxNzUzMTcxOTc1fDA&ixlib=rb-4.1.0&q=85",
                "video_url": "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_7mb.mp4",
                "duration_minutes": 18,
                "level": "Intermediate",
                "category": "Pronunciation",
                "accent": "Australian",
                "guide": "Native Speaker",
                "country": "Australia",
                "is_premium": False,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Cultural Differences: Small Talk",
                "description": "Understanding cultural context when making small talk in English-speaking countries.",
                "thumbnail_url": "https://images.unsplash.com/photo-1645594287996-086e2217a809?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwzfHxsYW5ndWFnZSUyMGxlYXJuaW5nfGVufDB8fHxibHVlfDE3NTMxNzE5NDR8MA&ixlib=rb-4.1.0&q=85",
                "video_url": "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_10mb.mp4",
                "duration_minutes": 12,
                "level": "Intermediate",
                "category": "Culture",
                "accent": "Canadian",
                "guide": "ESL Teacher",
                "country": "Canada",
                "is_premium": False,
                "created_at": datetime.utcnow()
            }
        ]
        await db.videos.insert_many(sample_videos)

# API Routes
@api_router.get("/videos")
async def get_videos(
    level: Optional[VideoLevel] = None,
    category: Optional[VideoCategory] = None,
    accent: Optional[AccentType] = None,
    guide: Optional[GuideType] = None,
    country: Optional[str] = None,
    is_premium: Optional[bool] = None,
    search: Optional[str] = None,
    max_duration: Optional[int] = None,
    sort_by: str = "newest",
    limit: int = 20,
    offset: int = 0
):
    """Get videos with filtering and sorting"""
    query = {}
    
    if level:
        query["level"] = level
    if category:
        query["category"] = category
    if accent:
        query["accent"] = accent
    if guide:
        query["guide"] = guide
    if country:
        query["country"] = country
    if is_premium is not None:
        query["is_premium"] = is_premium
    if max_duration:
        query["duration_minutes"] = {"$lte": max_duration}
    
    # Text search
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    # Sort options
    sort_options = {
        "newest": [("created_at", -1)],
        "popular": [("created_at", -1)],  # TODO: Add popularity metric
        "shortest": [("duration_minutes", 1)],
        "longest": [("duration_minutes", -1)]
    }
    
    sort_criteria = sort_options.get(sort_by, sort_options["newest"])
    
    videos = await db.videos.find(query, {"_id": 0}).sort(sort_criteria).skip(offset).limit(limit).to_list(limit)
    total_count = await db.videos.count_documents(query)
    
    return {
        "videos": videos,
        "total": total_count,
        "limit": limit,
        "offset": offset
    }

@api_router.get("/videos/{video_id}")
async def get_video(video_id: str):
    """Get a specific video by ID"""
    video = await db.videos.find_one({"id": video_id}, {"_id": 0})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return video

class WatchRequest(BaseModel):
    watched_minutes: int

@api_router.post("/videos/{video_id}/mark-watched")
async def mark_video_as_watched(
    video_id: str,
    request: MarkAsWatchedRequest,
    session_id: str = Query(...),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Mark a video as already watched (for external content)"""
    video = await db.videos.find_one({"id": video_id}, {"_id": 0})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    user_id = current_user.id if current_user else None
    watched_minutes = video["duration_minutes"]  # Credit full duration
    
    # Check if already marked as watched
    existing_progress = await db.watch_progress.find_one({
        "session_id": session_id,
        "video_id": video_id
    })
    
    if existing_progress and existing_progress.get("completed", False):
        return {"message": "Video already marked as watched", "already_watched": True}
    
    # Create or update watch progress
    progress_data = {
        "user_id": user_id,
        "session_id": session_id,
        "video_id": video_id,
        "watched_minutes": watched_minutes,
        "completed": True,
        "watched_at": datetime.utcnow(),
        "marked_as_watched": True  # Flag to indicate manual marking
    }
    
    if existing_progress:
        await db.watch_progress.update_one(
            {"session_id": session_id, "video_id": video_id},
            {"$set": progress_data}
        )
    else:
        progress = WatchProgress(**{**progress_data, "id": str(uuid.uuid4())})
        await db.watch_progress.insert_one(progress.dict())
    
    # Update daily progress
    await update_daily_progress(session_id, video_id, watched_minutes, user_id)
    
    return {
        "message": "Video marked as watched successfully",
        "credited_minutes": watched_minutes,
        "already_watched": False
    }

@api_router.post("/activities/manual")
async def log_manual_activity(
    request: ManualActivityRequest,
    session_id: str = Query(...),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Log manual learning activity (movies, podcasts, conversations)"""
    user_id = current_user.id if current_user else None
    
    # Create manual activity record
    activity_data = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "session_id": session_id,
        "activity_type": request.activity_type,
        "duration_minutes": request.duration_minutes,
        "date": request.date,
        "title": request.title,
        "difficulty_level": request.difficulty_level,
        "created_at": datetime.utcnow()
    }
    
    activity = ManualActivity(**activity_data)
    await db.manual_activities.insert_one(activity.dict())
    
    # Update daily progress for the specified date
    await update_daily_progress_for_date(
        session_id, 
        request.date, 
        request.duration_minutes, 
        user_id,
        activity_type=request.activity_type
    )
    
    return {
        "message": "Manual activity logged successfully",
        "activity": {
            "type": request.activity_type,
            "duration": request.duration_minutes,
            "date": request.date,
            "title": request.title
        }
    }

@api_router.get("/activities/manual")
async def get_manual_activities(
    session_id: str = Query(...),
    current_user: Optional[User] = Depends(get_current_user),
    limit: int = 50,
    offset: int = 0
):
    """Get user's manual activities"""
    activities = await db.manual_activities.find(
        {"session_id": session_id},
        {"_id": 0}
    ).sort("date", -1).skip(offset).limit(limit).to_list(limit)
    
    total_count = await db.manual_activities.count_documents({"session_id": session_id})
    
    return {
        "activities": activities,
        "total": total_count,
        "limit": limit,
        "offset": offset
    }

async def update_daily_progress_for_date(
    session_id: str, 
    date: str, 
    duration_minutes: int, 
    user_id: Optional[str] = None,
    activity_type: Optional[str] = None
):
    """Update daily progress for a specific date (used for manual activities)"""
    
    # Find or create daily progress for the specified date
    daily_progress = await db.daily_progress.find_one({
        "session_id": session_id,
        "date": date
    })
    
    if daily_progress:
        # Update existing daily progress
        daily_progress["total_minutes_watched"] += duration_minutes
        daily_progress["updated_at"] = datetime.utcnow()
        daily_progress["user_id"] = user_id
        
        # Add to manual activity tracking
        if "manual_activities" not in daily_progress:
            daily_progress["manual_activities"] = {}
        
        if activity_type:
            daily_progress["manual_activities"][activity_type] = daily_progress["manual_activities"].get(activity_type, 0) + duration_minutes
        
        await db.daily_progress.update_one(
            {"session_id": session_id, "date": date},
            {"$set": daily_progress}
        )
    else:
        # Create new daily progress for the date
        # Calculate streak based on consecutive days
        all_dates = await db.daily_progress.find(
            {"session_id": session_id},
            {"date": 1, "_id": 0}
        ).sort("date", 1).to_list(1000)
        
        existing_dates = [record["date"] for record in all_dates]
        streak_count = calculate_streak_up_to_date(existing_dates, date)
        
        manual_activities = {}
        if activity_type:
            manual_activities[activity_type] = duration_minutes
        
        new_daily_progress = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "session_id": session_id,
            "date": date,
            "total_minutes_watched": duration_minutes,
            "videos_watched": [],  # No videos for manual activities
            "manual_activities": manual_activities,
            "streak_count": streak_count,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await db.daily_progress.insert_one(new_daily_progress)
        
        # Recalculate streaks for all subsequent dates
        await recalculate_streaks_from_date(session_id, date)
    
    # Update user stats
    await update_user_stats(session_id, user_id)

def calculate_streak_up_to_date(existing_dates: List[str], target_date: str) -> int:
    """Calculate streak count up to a specific date"""
    from datetime import datetime, timedelta
    
    # Sort all dates including the target date
    all_dates = sorted(existing_dates + [target_date])
    target_idx = all_dates.index(target_date)
    
    # Calculate streak ending at target date
    streak = 1
    current_date = datetime.strptime(target_date, "%Y-%m-%d")
    
    for i in range(target_idx - 1, -1, -1):
        prev_date = datetime.strptime(all_dates[i], "%Y-%m-%d")
        if (current_date - prev_date).days == 1:
            streak += 1
            current_date = prev_date
        else:
            break
    
    return streak

async def recalculate_streaks_from_date(session_id: str, from_date: str):
    """Recalculate streak counts for all dates from the given date onwards"""
    # Get all daily progress records from the date onwards
    daily_records = await db.daily_progress.find(
        {"session_id": session_id, "date": {"$gte": from_date}},
        {"_id": 0}
    ).sort("date", 1).to_list(1000)
    
    if not daily_records:
        return
    
    # Get all dates for streak calculation
    all_dates = [record["date"] for record in daily_records]
    
    # Update each record with correct streak
    for i, record in enumerate(daily_records):
        new_streak = calculate_streak_up_to_date(all_dates[:i+1], record["date"])
        await db.daily_progress.update_one(
            {"session_id": session_id, "date": record["date"]},
            {"$set": {"streak_count": new_streak}}
        )

@api_router.post("/videos/{video_id}/watch")
async def record_watch_progress(
    video_id: str, 
    request: WatchRequest, 
    session_id: str = Query(...),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Record video watch progress"""
    video = await db.videos.find_one({"id": video_id}, {"_id": 0})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Check if video is premium and user has access
    if video.get("is_premium", False):
        if not current_user or current_user.role == UserRole.GUEST:
            raise HTTPException(status_code=403, detail="Premium content requires student account or higher")
    
    watched_minutes = request.watched_minutes
    user_id = current_user.id if current_user else None
    
    # Create or update watch progress
    progress_data = {
        "user_id": user_id,
        "session_id": session_id,
        "video_id": video_id,
        "watched_minutes": watched_minutes,
        "completed": watched_minutes >= video["duration_minutes"],
        "watched_at": datetime.utcnow()
    }
    
    existing_progress = await db.watch_progress.find_one({
        "session_id": session_id,
        "video_id": video_id
    })
    
    if existing_progress:
        # Update existing progress
        await db.watch_progress.update_one(
            {"session_id": session_id, "video_id": video_id},
            {"$set": {
                "user_id": user_id,  # Update user_id if now authenticated
                "watched_minutes": max(watched_minutes, existing_progress["watched_minutes"]),
                "completed": watched_minutes >= video["duration_minutes"],
                "watched_at": datetime.utcnow()
            }}
        )
    else:
        # Create new progress record
        progress = WatchProgress(**progress_data)
        await db.watch_progress.insert_one(progress.dict())
    
    # Update daily progress
    await update_daily_progress(session_id, video_id, watched_minutes, user_id)
    
    return {"message": "Progress recorded successfully"}

async def update_daily_progress(session_id: str, video_id: str, watched_minutes: int, user_id: Optional[str] = None):
    """Update daily progress and streak tracking"""
    today = datetime.utcnow().strftime("%Y-%m-%d")
    
    # Find or create today's progress
    daily_progress = await db.daily_progress.find_one({
        "session_id": session_id,
        "date": today
    })
    
    if daily_progress:
        # Update existing daily progress
        if video_id not in daily_progress["videos_watched"]:
            daily_progress["videos_watched"].append(video_id)
        daily_progress["total_minutes_watched"] += watched_minutes
        daily_progress["updated_at"] = datetime.utcnow()
        daily_progress["user_id"] = user_id  # Update user_id if now authenticated
        
        await db.daily_progress.update_one(
            {"session_id": session_id, "date": today},
            {"$set": daily_progress}
        )
    else:
        # Create new daily progress
        # Calculate streak
        yesterday = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")
        yesterday_progress = await db.daily_progress.find_one({
            "session_id": session_id,
            "date": yesterday
        })
        
        streak_count = (yesterday_progress["streak_count"] + 1) if yesterday_progress else 1
        
        new_daily_progress = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "session_id": session_id,
            "date": today,
            "total_minutes_watched": watched_minutes,
            "videos_watched": [video_id],
            "streak_count": streak_count,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await db.daily_progress.insert_one(new_daily_progress)
    
    # Update user stats
    await update_user_stats(session_id, user_id)

async def update_user_stats(session_id: str, user_id: Optional[str] = None):
    """Update comprehensive user statistics"""
    # Get all daily progress records
    daily_records = await db.daily_progress.find({"session_id": session_id}, {"_id": 0}).to_list(1000)
    
    total_minutes = sum(record["total_minutes_watched"] for record in daily_records)
    current_streak = daily_records[-1]["streak_count"] if daily_records else 0
    longest_streak = max([record["streak_count"] for record in daily_records], default=0)
    personal_best = max([record["total_minutes_watched"] for record in daily_records], default=0)
    
    # Calculate level progress
    watch_records = await db.watch_progress.find({"session_id": session_id}, {"_id": 0}).to_list(1000)
    level_progress = {}
    
    for record in watch_records:
        video = await db.videos.find_one({"id": record["video_id"]}, {"_id": 0})
        if video:
            level = video["level"]
            level_progress[level] = level_progress.get(level, 0) + record["watched_minutes"]
    
    # Calculate milestones
    milestones = []
    if total_minutes >= 60:
        milestones.append("First Hour")
    if total_minutes >= 600:  # 10 hours
        milestones.append("Intermediate Unlocked")
    if total_minutes >= 3600:  # 60 hours = 100 hours milestone
        milestones.append("Century Club")
    if current_streak >= 7:
        milestones.append("Week Warrior")
    if current_streak >= 30:
        milestones.append("Month Master")
    
    # Update or create user stats
    stats_data = {
        "user_id": user_id,
        "session_id": session_id,
        "total_minutes_watched": total_minutes,
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "personal_best_day": personal_best,
        "level_progress": level_progress,
        "milestones_achieved": milestones,
        "updated_at": datetime.utcnow()
    }
    
    existing_stats = await db.user_stats.find_one({"session_id": session_id})
    if existing_stats:
        await db.user_stats.update_one(
            {"session_id": session_id},
            {"$set": stats_data}
        )
    else:
        stats_data["created_at"] = datetime.utcnow()
        await db.user_stats.insert_one(stats_data)

@api_router.get("/progress/{session_id}")
async def get_user_progress(session_id: str):
    """Get comprehensive user progress and statistics including manual activities"""
    stats = await db.user_stats.find_one({"session_id": session_id}, {"_id": 0})
    
    if not stats:
        # Initialize empty stats if none exist
        stats = {
            "total_minutes_watched": 0,
            "platform_minutes": 0,
            "manual_minutes": 0,
            "current_streak": 0,
            "longest_streak": 0,
            "personal_best_day": 0,
            "level_progress": {},
            "milestones_achieved": [],
            "manual_activity_breakdown": {}
        }
    
    # Get recent daily progress for heatmap (last 90 days)
    recent_progress = await db.daily_progress.find(
        {"session_id": session_id}, {"_id": 0}
    ).sort("date", -1).limit(90).to_list(90)
    
    # Format for heatmap and calculate breakdowns
    heatmap_data = []
    total_platform_minutes = 0
    total_manual_minutes = 0
    activity_breakdown = {
        "Movies/TV Shows": 0,
        "Audiobooks/Podcasts": 0,
        "Talking with friends": 0
    }
    
    for progress in recent_progress:
        platform_minutes = 0
        manual_minutes = 0
        
        # Calculate platform minutes (from videos watched)
        if progress.get("videos_watched"):
            for video_id in progress["videos_watched"]:
                video = await db.videos.find_one({"id": video_id}, {"duration_minutes": 1, "_id": 0})
                if video:
                    platform_minutes += video["duration_minutes"]
        
        # Calculate manual minutes (from manual activities)
        manual_activities = progress.get("manual_activities", {})
        for activity_type, minutes in manual_activities.items():
            manual_minutes += minutes
            activity_breakdown[activity_type] = activity_breakdown.get(activity_type, 0) + minutes
        
        total_platform_minutes += platform_minutes
        total_manual_minutes += manual_minutes
        
        heatmap_data.append({
            "date": progress["date"],
            "minutes": progress["total_minutes_watched"],
            "platform_minutes": platform_minutes,
            "manual_minutes": manual_minutes
        })
    
    # Get total video count
    watch_progress_count = await db.watch_progress.count_documents({"session_id": session_id})
    
    # Get manual activity count
    manual_activity_count = await db.manual_activities.count_documents({"session_id": session_id})
    
    # Update stats with breakdown
    stats.update({
        "platform_minutes": total_platform_minutes,
        "manual_minutes": total_manual_minutes,
        "manual_activity_breakdown": activity_breakdown
    })
    
    return {
        "stats": stats,
        "recent_activity": heatmap_data,
        "total_videos_watched": watch_progress_count,
        "total_manual_activities": manual_activity_count,
        "breakdown": {
            "platform_hours": round(total_platform_minutes / 60, 1),
            "manual_hours": round(total_manual_minutes / 60, 1),
            "total_hours": round((total_platform_minutes + total_manual_minutes) / 60, 1)
        }
    }

@api_router.get("/filters/options")
async def get_filter_options():
    """Get available filter options"""
    return {
        "levels": [level.value for level in VideoLevel],
        "categories": [category.value for category in VideoCategory],
        "accents": [accent.value for accent in AccentType],
        "guides": [guide.value for guide in GuideType],
        "countries": ["United States", "United Kingdom", "Australia", "Canada"]
    }

@api_router.post("/email/subscribe")
async def subscribe_email(request: EmailSubscribeRequest):
    """Subscribe email to Kit (ConvertKit) for motivational messages and updates"""
    try:
        # Get ConvertKit credentials
        api_key = os.environ.get('CONVERTKIT_API_KEY')
        form_id = os.environ.get('CONVERTKIT_FORM_ID')
        
        if not api_key or not form_id:
            raise HTTPException(status_code=500, detail="Email service configuration missing")
        
        # Store subscription in MongoDB first
        subscription_data = {
            "id": str(uuid.uuid4()),
            "email": request.email,
            "name": request.name,
            "source": request.source,
            "subscribed_at": datetime.utcnow(),
            "active": True
        }
        
        # Check if email already exists
        existing_subscription = await db.email_subscriptions.find_one({"email": request.email})
        if existing_subscription:
            return {"message": "Email already subscribed", "status": "existing"}
        
        # Save to MongoDB
        await db.email_subscriptions.insert_one(subscription_data)
        
        # Subscribe to ConvertKit
        convertkit_url = f"https://api.convertkit.com/v3/forms/{form_id}/subscribe"
        convertkit_data = {
            "api_key": api_key,
            "email": request.email
        }
        
        if request.name:
            convertkit_data["first_name"] = request.name
        
        # Add custom fields for segmentation
        convertkit_data["fields"] = {
            "source": request.source,
            "signup_date": datetime.utcnow().isoformat(),
            "platform": "English Fiesta"
        }
        
        response = requests.post(convertkit_url, json=convertkit_data, timeout=10)
        
        if response.status_code == 200:
            # Update MongoDB record with ConvertKit subscriber ID
            convertkit_response = response.json()
            convertkit_subscriber_id = convertkit_response.get("subscription", {}).get("subscriber", {}).get("id")
            
            if convertkit_subscriber_id:
                await db.email_subscriptions.update_one(
                    {"email": request.email},
                    {"$set": {"convertkit_subscriber_id": convertkit_subscriber_id}}
                )
            
            return {
                "message": "Successfully subscribed to English Fiesta updates!",
                "status": "success"
            }
        else:
            # Log error but don't fail completely since we saved to MongoDB
            logger.error(f"ConvertKit API error: {response.status_code} - {response.text}")
            return {
                "message": "Subscription saved locally, email service temporarily unavailable",
                "status": "partial_success"
            }
            
    except requests.RequestException as e:
        logger.error(f"ConvertKit request error: {str(e)}")
        # Still return success since we saved to MongoDB
        return {
            "message": "Subscription saved, email service will sync later",
            "status": "partial_success"
        }
    except Exception as e:
        logger.error(f"Email subscription error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process email subscription")

@api_router.get("/email/subscriptions/{email}")
async def check_subscription_status(email: str):
    """Check if an email is already subscribed"""
    subscription = await db.email_subscriptions.find_one({"email": email}, {"_id": 0})
    if subscription:
        return {"subscribed": True, "subscription": subscription}
    return {"subscribed": False}

# Initialize sample data on startup
@app.on_event("startup")
async def startup_event():
    await init_sample_data()
    await create_default_admin()

async def create_default_admin():
    """Create default admin user if none exists"""
    admin_count = await db.users.count_documents({"role": UserRole.ADMIN})
    if admin_count == 0:
        # Create a placeholder admin - in production, this should be done via secure process
        logger.info("No admin users found. First user to login will be promoted to admin.")

# Authentication Endpoints
@api_router.post("/auth/session", response_model=UserProfileResponse)
async def create_auth_session(request: AuthSessionRequest):
    """Create user session from Emergent auth session ID"""
    try:
        # Call Emergent auth API to get user data
        emergent_response = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": request.session_id},
            timeout=10
        )
        
        if emergent_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session ID")
        
        emergent_data = emergent_response.json()
        
        # Check if user exists
        existing_user = await db.users.find_one({"email": emergent_data["email"]}, {"_id": 0})
        
        if existing_user:
            user = User(**existing_user)
        else:
            # Create new user with default student role
            user_data = {
                "id": str(uuid.uuid4()),
                "email": emergent_data["email"],
                "name": emergent_data["name"],
                "picture": emergent_data.get("picture"),
                "role": UserRole.STUDENT,
                "emergent_user_id": emergent_data["id"],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "is_active": True
            }
            
            # Check if this is the first user - make them admin
            user_count = await db.users.count_documents({})
            if user_count == 0:
                user_data["role"] = UserRole.ADMIN
                logger.info(f"Creating first admin user: {emergent_data['email']}")
            
            await db.users.insert_one(user_data)
            user = User(**user_data)
            
            # Migrate any guest session data to this user
            await migrate_guest_data_to_user(user.id, request.session_id)
        
        # Create session token
        session_token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(days=7)
        
        # Deactivate old sessions for this user
        await db.user_sessions.update_many(
            {"user_id": user.id},
            {"$set": {"is_active": False}}
        )
        
        # Create new session
        session_data = {
            "id": str(uuid.uuid4()),
            "user_id": user.id,
            "session_token": session_token,
            "emergent_session_id": request.session_id,
            "expires_at": expires_at,
            "created_at": datetime.utcnow(),
            "is_active": True
        }
        
        await db.user_sessions.insert_one(session_data)
        
        return UserProfileResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            picture=user.picture,
            role=user.role,
            created_at=user.created_at,
            session_token=session_token
        )
        
    except requests.RequestException as e:
        logger.error(f"Emergent auth API error: {str(e)}")
        raise HTTPException(status_code=500, detail="Authentication service unavailable")
    except Exception as e:
        logger.error(f"Session creation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create session")

async def migrate_guest_data_to_user(user_id: str, guest_session_id: str):
    """Migrate guest session data to authenticated user"""
    try:
        # Update watch progress
        await db.watch_progress.update_many(
            {"session_id": guest_session_id},
            {"$set": {"user_id": user_id}}
        )
        
        # Update daily progress
        await db.daily_progress.update_many(
            {"session_id": guest_session_id},
            {"$set": {"user_id": user_id}}
        )
        
        # Update user stats
        await db.user_stats.update_many(
            {"session_id": guest_session_id},
            {"$set": {"user_id": user_id}}
        )
        
        logger.info(f"Migrated guest data from session {guest_session_id} to user {user_id}")
    except Exception as e:
        logger.error(f"Data migration error: {str(e)}")

@api_router.get("/auth/profile")
async def get_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "picture": current_user.picture,
        "role": current_user.role,
        "created_at": current_user.created_at
    }

@api_router.post("/auth/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Logout current user"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get session token from request (we'd need to modify this to get the actual token)
    # For now, deactivate all sessions for the user
    await db.user_sessions.update_many(
        {"user_id": current_user.id},
        {"$set": {"is_active": False}}
    )
    
    return {"message": "Logged out successfully"}

# Admin endpoints
@api_router.get("/admin/users")
async def get_all_users(current_user: User = Depends(require_admin)):
    """Get all users (admin only)"""
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    return {"users": users}

@api_router.post("/admin/users/role")
async def update_user_role(request: RoleUpdateRequest, current_user: User = Depends(require_admin)):
    """Update user role (admin only)"""
    # Find target user
    target_user = await db.users.find_one({"id": request.user_id}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent admin from demoting themselves if they're the only admin
    if current_user.id == request.user_id and request.new_role != UserRole.ADMIN:
        admin_count = await db.users.count_documents({"role": UserRole.ADMIN})
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot remove the last admin")
    
    # Update role
    await db.users.update_one(
        {"id": request.user_id},
        {"$set": {
            "role": request.new_role,
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {
        "message": f"User role updated to {request.new_role}",
        "user_id": request.user_id,
        "new_role": request.new_role
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()