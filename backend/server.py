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
try:
    import magic
    MAGIC_AVAILABLE = True
except ImportError:
    MAGIC_AVAILABLE = False
    magic = None
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

# File upload configuration
UPLOAD_DIR = ROOT_DIR / "uploads"
THUMBNAILS_DIR = UPLOAD_DIR / "thumbnails"
VIDEOS_DIR = UPLOAD_DIR / "videos"
TEMP_DIR = UPLOAD_DIR / "temp"

# Create upload directories
UPLOAD_DIR.mkdir(exist_ok=True)
THUMBNAILS_DIR.mkdir(exist_ok=True)
VIDEOS_DIR.mkdir(exist_ok=True)
TEMP_DIR.mkdir(exist_ok=True)

# File upload limits and supported formats
MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024  # 5GB in bytes
CHUNK_SIZE = 1024 * 1024  # 1MB chunks
SUPPORTED_VIDEO_FORMATS = ['.mp4', '.mov', '.avi']
SUPPORTED_IMAGE_FORMATS = ['.jpg', '.jpeg', '.png', '.webp']

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
    INTERVIEW = "Interview"
    TRAVEL = "Travel"
    TUTORIAL = "Tutorial"

class AccentType(str, Enum):
    BRITISH = "British"
    AMERICAN = "American"
    AUSTRALIAN = "Australian"
    CANADIAN = "Canadian"

class GuideType(str, Enum):
    NATIVE_SPEAKER = "Native Speaker"
    ESL_TEACHER = "ESL Teacher"
    LANGUAGE_COACH = "Language Coach"

class VideoType(str, Enum):
    UPLOAD = "upload"
    YOUTUBE = "youtube"

class CountryType(str, Enum):
    USA = "USA"
    UK = "UK"
    CANADA = "Canada"
    AUSTRALIA = "Australia"

# Enhanced Video Model
class Video(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    duration_minutes: int
    level: VideoLevel
    accents: List[AccentType] = []  # Changed to support multiple accents
    tags: List[str] = []  # Comma-separated tags
    instructor_name: str
    country: CountryType
    category: VideoCategory
    thumbnail_url: Optional[str] = None  # Optional for uploads, auto-generated
    is_premium: bool = False
    
    # Video source information
    video_type: VideoType  # "upload" or "youtube"
    video_url: Optional[str] = None  # YouTube URL or local file path
    file_path: Optional[str] = None  # Local file path for uploads
    youtube_video_id: Optional[str] = None  # YouTube video ID
    
    # File information (for uploads)
    file_size: Optional[int] = None  # File size in bytes
    file_format: Optional[str] = None  # MP4, MOV, AVI
    
    # Legacy fields (keep for backward compatibility)
    guide: GuideType = GuideType.NATIVE_SPEAKER
    series_id: Optional[str] = None
    series_order: Optional[int] = None
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = None  # Admin user ID who uploaded

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

# Video Upload and Management Models
class VideoUploadRequest(BaseModel):
    title: str
    description: str
    duration_minutes: int
    level: VideoLevel
    accents: List[AccentType]
    tags: List[str]
    instructor_name: str
    country: CountryType
    category: VideoCategory
    is_premium: bool = False

class YouTubeVideoRequest(BaseModel):
    youtube_url: str
    title: Optional[str] = None  # Auto-fetch if not provided
    description: Optional[str] = None
    level: VideoLevel
    accents: List[AccentType]
    tags: List[str]
    instructor_name: str
    country: CountryType
    category: VideoCategory
    is_premium: bool = False

class VideoUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    level: Optional[VideoLevel] = None
    accents: Optional[List[AccentType]] = None
    tags: Optional[List[str]] = None
    instructor_name: Optional[str] = None
    country: Optional[CountryType] = None
    category: Optional[VideoCategory] = None
    is_premium: Optional[bool] = None

class BulkUploadResponse(BaseModel):
    uploaded_files: List[Dict[str, Any]]
    failed_files: List[Dict[str, str]]
    total_uploaded: int
    total_failed: int

class UploadProgressResponse(BaseModel):
    file_id: str
    filename: str
    progress: float  # 0.0 to 1.0
    status: str  # "uploading", "processing", "completed", "failed"
    message: Optional[str] = None

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

# Content Management Models
class ContentType(str, Enum):
    HERO_SECTION = "hero_section"
    ABOUT_PAGE = "about_page"
    FAQ_PAGE = "faq_page"
    FOOTER = "footer"
    UI_TEXT = "ui_text"

class ContentItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content_type: ContentType
    section_key: str  # e.g., "hero_title", "faq_section_1", "footer_copyright"
    languages: Dict[str, Any] = {}  # {"en": {"title": "...", "content": "..."}, "es": {...}, "pt": {...}}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = None
    updated_by: Optional[str] = None

class ContentUpdateRequest(BaseModel):
    languages: Dict[str, Any]

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

# ==========================================
# FILE HANDLING UTILITIES
# ==========================================

def get_file_extension(filename: str) -> str:
    """Get file extension from filename"""
    return Path(filename).suffix.lower()

def is_video_file(filename: str) -> bool:
    """Check if file is a supported video format"""
    return get_file_extension(filename) in SUPPORTED_VIDEO_FORMATS

def is_image_file(filename: str) -> bool:
    """Check if file is a supported image format"""
    return get_file_extension(filename) in SUPPORTED_IMAGE_FORMATS

async def save_uploaded_file(file: UploadFile, destination: Path) -> bool:
    """Save uploaded file to destination with chunked reading"""
    try:
        async with aiofiles.open(destination, 'wb') as f:
            while chunk := await file.read(CHUNK_SIZE):
                await f.write(chunk)
        return True
    except Exception as e:
        logging.error(f"Error saving file {destination}: {e}")
        if destination.exists():
            destination.unlink()  # Clean up partial file
        return False

def get_video_duration(file_path: Path) -> Optional[int]:
    """Get video duration in minutes using ffprobe"""
    try:
        cmd = [
            'ffprobe', '-v', 'quiet', '-show_entries', 'format=duration',
            '-of', 'csv=p=0', str(file_path)
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            duration_seconds = float(result.stdout.strip())
            return int(duration_seconds / 60)  # Convert to minutes
    except Exception as e:
        logging.error(f"Error getting video duration for {file_path}: {e}")
    return None

def extract_video_thumbnail(video_path: Path, thumbnail_path: Path) -> bool:
    """Extract thumbnail from video file using ffmpeg"""
    try:
        cmd = [
            'ffmpeg', '-i', str(video_path), '-ss', '00:00:01.000',
            '-vframes', '1', '-f', 'image2', str(thumbnail_path), '-y'
        ]
        result = subprocess.run(cmd, capture_output=True)
        return result.returncode == 0 and thumbnail_path.exists()
    except Exception as e:
        logging.error(f"Error extracting thumbnail: {e}")
        return False

def get_youtube_video_id(url: str) -> Optional[str]:
    """Extract YouTube video ID from URL"""
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)',
        r'youtube\.com\/watch\?.*v=([^&\n?#]+)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

async def fetch_youtube_metadata(video_id: str) -> Optional[Dict[str, Any]]:
    """Fetch YouTube video metadata using yt-dlp"""
    try:
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f'https://www.youtube.com/watch?v={video_id}', download=False)
            
            return {
                'title': info.get('title', ''),
                'description': info.get('description', ''),
                'duration': int(info.get('duration', 0) / 60) if info.get('duration') else 0,
                'thumbnail_url': info.get('thumbnail', ''),
                'uploader': info.get('uploader', ''),
                'upload_date': info.get('upload_date', '')
            }
    except Exception as e:
        logging.error(f"Error fetching YouTube metadata for {video_id}: {e}")
        return None

def validate_file_size(file_size: int) -> bool:
    """Validate file size against maximum limit"""
    return file_size <= MAX_FILE_SIZE

def generate_unique_filename(original_filename: str) -> str:
    """Generate unique filename to avoid conflicts"""
    ext = get_file_extension(original_filename)
    unique_id = str(uuid.uuid4())[:8]
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    return f"{timestamp}_{unique_id}{ext}"

# ==========================================
# AUTHENTICATION DEPENDENCIES
# ==========================================

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
        "countries": [country.value for country in CountryType]
    }

# ==========================================
# ADMIN VIDEO UPLOAD ENDPOINTS
# ==========================================

@api_router.post("/admin/videos/upload")
async def upload_video(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(...),
    level: VideoLevel = Form(...),
    accents: str = Form(...),  # JSON string of accent list
    tags: str = Form(...),  # JSON string of tag list
    instructor_name: str = Form(...),
    country: CountryType = Form(...),
    category: VideoCategory = Form(...),
    is_premium: bool = Form(False),
    thumbnail: Optional[UploadFile] = File(None),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Upload a video file with metadata (Admin only)"""
    
    # Validate file type
    if not is_video_file(file.filename):
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file format. Supported formats: {', '.join(SUPPORTED_VIDEO_FORMATS)}"
        )
    
    # Validate file size
    if not validate_file_size(file.size if file.size else 0):
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum limit of {MAX_FILE_SIZE / (1024**3):.1f}GB"
        )
    
    try:
        # Parse JSON fields
        accents_list = json.loads(accents) if accents else []
        tags_list = json.loads(tags) if tags else []
        
        # Generate unique filename
        unique_filename = generate_unique_filename(file.filename)
        video_path = VIDEOS_DIR / unique_filename
        
        # Save video file
        if not await save_uploaded_file(file, video_path):
            raise HTTPException(status_code=500, detail="Failed to save video file")
        
        # Get video duration
        duration_minutes = get_video_duration(video_path)
        if not duration_minutes:
            # Clean up file if duration extraction failed
            video_path.unlink()
            raise HTTPException(status_code=400, detail="Failed to process video file")
        
        # Handle thumbnail
        thumbnail_url = None
        if thumbnail and is_image_file(thumbnail.filename):
            # Save uploaded thumbnail
            thumbnail_filename = generate_unique_filename(thumbnail.filename)
            thumbnail_path = THUMBNAILS_DIR / thumbnail_filename
            if await save_uploaded_file(thumbnail, thumbnail_path):
                thumbnail_url = f"/api/files/thumbnails/{thumbnail_filename}"
        else:
            # Extract thumbnail from video
            thumbnail_filename = f"{Path(unique_filename).stem}.jpg"
            thumbnail_path = THUMBNAILS_DIR / thumbnail_filename
            if extract_video_thumbnail(video_path, thumbnail_path):
                thumbnail_url = f"/api/files/thumbnails/{thumbnail_filename}"
        
        # Create video record
        video_data = {
            "id": str(uuid.uuid4()),
            "title": title,
            "description": description,
            "duration_minutes": duration_minutes,
            "level": level,
            "accents": accents_list,
            "tags": tags_list,
            "instructor_name": instructor_name,
            "country": country,
            "category": category,
            "thumbnail_url": thumbnail_url,
            "is_premium": is_premium,
            "video_type": VideoType.UPLOAD,
            "file_path": str(video_path),
            "video_url": f"/api/files/videos/{unique_filename}",
            "file_size": video_path.stat().st_size,
            "file_format": get_file_extension(file.filename),
            "guide": GuideType.NATIVE_SPEAKER,  # Default value
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "created_by": current_user.id if current_user else None
        }
        
        # Insert into database
        await db.videos.insert_one(video_data)
        
        return {
            "message": "Video uploaded successfully",
            "video_id": video_data["id"],
            "title": title,
            "duration_minutes": duration_minutes,
            "file_size": video_data["file_size"],
            "thumbnail_url": thumbnail_url
        }
        
    except json.JSONDecodeError:
        # Clean up uploaded file
        if video_path.exists():
            video_path.unlink()
        raise HTTPException(status_code=400, detail="Invalid JSON in accents or tags field")
    except Exception as e:
        # Clean up uploaded file
        if video_path.exists():
            video_path.unlink()
        logging.error(f"Error uploading video: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload video")

@api_router.post("/admin/videos/youtube")
async def add_youtube_video(
    request: YouTubeVideoRequest,
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Add a YouTube video with metadata (Admin only)"""
    
    # Extract YouTube video ID
    video_id = get_youtube_video_id(request.youtube_url)
    if not video_id:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")
    
    # Check if video already exists
    existing_video = await db.videos.find_one({"youtube_video_id": video_id}, {"_id": 0})
    if existing_video:
        raise HTTPException(status_code=400, detail="YouTube video already exists in database")
    
    try:
        # Fetch YouTube metadata
        youtube_metadata = await fetch_youtube_metadata(video_id)
        if not youtube_metadata:
            raise HTTPException(status_code=400, detail="Failed to fetch YouTube video metadata")
        
        # Use provided metadata or fallback to YouTube data
        title = request.title or youtube_metadata.get('title', '')
        description = request.description or youtube_metadata.get('description', '')
        duration = youtube_metadata.get('duration', 0)
        
        if not title:
            raise HTTPException(status_code=400, detail="Video title is required")
        
        # Create video record
        video_data = {
            "id": str(uuid.uuid4()),
            "title": title,
            "description": description,
            "duration_minutes": duration,
            "level": request.level,
            "accents": request.accents,
            "tags": request.tags,
            "instructor_name": request.instructor_name,
            "country": request.country,
            "category": request.category,
            "thumbnail_url": youtube_metadata.get('thumbnail_url', ''),
            "is_premium": request.is_premium,
            "video_type": VideoType.YOUTUBE,
            "video_url": request.youtube_url,
            "youtube_video_id": video_id,
            "guide": GuideType.NATIVE_SPEAKER,  # Default value
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "created_by": current_user.id if current_user else None
        }
        
        # Insert into database
        await db.videos.insert_one(video_data)
        
        return {
            "message": "YouTube video added successfully",
            "video_id": video_data["id"],
            "title": title,
            "duration_minutes": duration,
            "youtube_video_id": video_id,
            "thumbnail_url": video_data["thumbnail_url"]
        }
        
    except Exception as e:
        logging.error(f"Error adding YouTube video: {e}")
        raise HTTPException(status_code=500, detail="Failed to add YouTube video")

@api_router.get("/admin/videos")
async def get_admin_videos(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    level: Optional[VideoLevel] = Query(None),
    category: Optional[VideoCategory] = Query(None),
    video_type: Optional[VideoType] = Query(None),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Get all videos for admin management with pagination and filtering"""
    
    # Build filter query
    filter_query = {}
    if search:
        filter_query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"instructor_name": {"$regex": search, "$options": "i"}}
        ]
    if level:
        filter_query["level"] = level
    if category:
        filter_query["category"] = category
    if video_type:
        filter_query["video_type"] = video_type
    
    # Get total count
    total_count = await db.videos.count_documents(filter_query)
    
    # Get videos with pagination
    skip = (page - 1) * limit
    videos = await db.videos.find(
        filter_query, {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return {
        "videos": videos,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total_count,
            "pages": (total_count + limit - 1) // limit
        }
    }

@api_router.put("/admin/videos/{video_id}")
async def update_video(
    video_id: str,
    request: VideoUpdateRequest,
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Update video metadata (Admin only)"""
    
    # Check if video exists
    existing_video = await db.videos.find_one({"id": video_id}, {"_id": 0})
    if not existing_video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Build update query
    update_data = {"updated_at": datetime.utcnow()}
    if request.title is not None:
        update_data["title"] = request.title
    if request.description is not None:
        update_data["description"] = request.description
    if request.duration_minutes is not None:
        update_data["duration_minutes"] = request.duration_minutes
    if request.level is not None:
        update_data["level"] = request.level
    if request.accents is not None:
        update_data["accents"] = request.accents
    if request.tags is not None:
        update_data["tags"] = request.tags
    if request.instructor_name is not None:
        update_data["instructor_name"] = request.instructor_name
    if request.country is not None:
        update_data["country"] = request.country
    if request.category is not None:
        update_data["category"] = request.category
    if request.is_premium is not None:
        update_data["is_premium"] = request.is_premium
    
    # Update video
    await db.videos.update_one({"id": video_id}, {"$set": update_data})
    
    return {"message": "Video updated successfully"}

@api_router.delete("/admin/videos/{video_id}")
async def delete_video(
    video_id: str,
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Delete video and associated files (Admin only)"""
    
    # Get video to delete associated files
    video = await db.videos.find_one({"id": video_id}, {"_id": 0})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    try:
        # Delete associated files for uploaded videos
        if video.get("video_type") == VideoType.UPLOAD:
            if video.get("file_path"):
                file_path = Path(video["file_path"])
                if file_path.exists():
                    file_path.unlink()
            
            # Delete thumbnail if it's a local file
            if video.get("thumbnail_url") and video["thumbnail_url"].startswith("/api/files/thumbnails/"):
                thumbnail_filename = video["thumbnail_url"].split("/")[-1]
                thumbnail_path = THUMBNAILS_DIR / thumbnail_filename
                if thumbnail_path.exists():
                    thumbnail_path.unlink()
        
        # Delete from database
        await db.videos.delete_one({"id": video_id})
        
        # Also delete associated watch progress and stats
        await db.watch_progress.delete_many({"video_id": video_id})
        
        return {"message": "Video deleted successfully"}
        
    except Exception as e:
        logging.error(f"Error deleting video {video_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete video")

@api_router.get("/files/videos/{filename}")
async def serve_video_file(filename: str):
    """Serve uploaded video files"""
    file_path = VIDEOS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found")
    return FileResponse(file_path)

@api_router.get("/files/thumbnails/{filename}")
async def serve_thumbnail_file(filename: str):
    """Serve thumbnail files"""
    file_path = THUMBNAILS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Thumbnail file not found")
    return FileResponse(file_path)

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

# ==========================================
# CONTENT MANAGEMENT ENDPOINTS
# ==========================================

@api_router.get("/content")
async def get_all_content():
    """Get all content items for the public site"""
    content_items = await db.content_items.find({}, {"_id": 0}).to_list(1000)
    
    # Organize content by type and section for easy frontend consumption
    organized_content = {}
    for item in content_items:
        content_type = item["content_type"]
        section_key = item["section_key"]
        
        if content_type not in organized_content:
            organized_content[content_type] = {}
        
        organized_content[content_type][section_key] = {
            "id": item["id"],
            "languages": item.get("languages", {}),
            "updated_at": item["updated_at"]
        }
    
    return organized_content

@api_router.get("/content/{content_type}")
async def get_content_by_type(content_type: ContentType):
    """Get content items by type (hero_section, about_page, etc.)"""
    content_items = await db.content_items.find(
        {"content_type": content_type}, 
        {"_id": 0}
    ).to_list(1000)
    
    return {"content_type": content_type, "items": content_items}

@api_router.get("/content/{content_type}/{section_key}")
async def get_specific_content(content_type: ContentType, section_key: str):
    """Get a specific content item"""
    content_item = await db.content_items.find_one(
        {"content_type": content_type, "section_key": section_key}, 
        {"_id": 0}
    )
    
    if not content_item:
        raise HTTPException(status_code=404, detail="Content not found")
    
    return content_item

@api_router.post("/admin/content")
async def create_content_item(
    content_type: ContentType,
    section_key: str,
    request: ContentUpdateRequest,
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Create a new content item (Admin only)"""
    
    # Check if content item already exists
    existing_item = await db.content_items.find_one({
        "content_type": content_type,
        "section_key": section_key
    })
    
    if existing_item:
        raise HTTPException(status_code=400, detail="Content item already exists")
    
    content_data = {
        "id": str(uuid.uuid4()),
        "content_type": content_type,
        "section_key": section_key,
        "languages": request.languages,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "created_by": current_user.id,
        "updated_by": current_user.id
    }
    
    await db.content_items.insert_one(content_data)
    
    return {"message": "Content created successfully", "content_id": content_data["id"]}

@api_router.put("/admin/content/{content_type}/{section_key}")
async def update_content_item(
    content_type: ContentType,
    section_key: str,
    request: ContentUpdateRequest,
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Update a content item (Admin only)"""
    
    # Check if content item exists
    existing_item = await db.content_items.find_one({
        "content_type": content_type,
        "section_key": section_key
    })
    
    if not existing_item:
        # Create new item if it doesn't exist
        return await create_content_item(content_type, section_key, request, current_user)
    
    # Update existing item
    update_data = {
        "languages": request.languages,
        "updated_at": datetime.utcnow(),
        "updated_by": current_user.id
    }
    
    await db.content_items.update_one(
        {"content_type": content_type, "section_key": section_key},
        {"$set": update_data}
    )
    
    return {"message": "Content updated successfully"}

@api_router.delete("/admin/content/{content_type}/{section_key}")
async def delete_content_item(
    content_type: ContentType,
    section_key: str,
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Delete a content item (Admin only)"""
    
    result = await db.content_items.delete_one({
        "content_type": content_type,
        "section_key": section_key
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Content not found")
    
    return {"message": "Content deleted successfully"}

@api_router.get("/admin/content")
async def get_admin_content_list(
    content_type: Optional[ContentType] = None,
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Get all content items for admin management"""
    
    query = {}
    if content_type:
        query["content_type"] = content_type
    
    content_items = await db.content_items.find(query, {"_id": 0}).sort("content_type", 1).sort("section_key", 1).to_list(1000)
    
    return {
        "content_items": content_items,
        "total": len(content_items),
        "content_types": [ct.value for ct in ContentType]
    }

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