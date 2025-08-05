from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Form, Query
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timedelta
from enum import Enum
import os
import uuid
import bcrypt
import re
import json
# Mock auth for testing
class MockAuth:
    def get_token(self):
        return None
    
    async def get_user(self, token):
        return None

emergent_auth = MockAuth()
import shutil
import subprocess
import urllib.parse

# MongoDB connection
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

# Initialize FastAPI
app = FastAPI(title="English Fiesta API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB setup
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/english_fiesta')
client = AsyncIOMotorClient(MONGO_URL)
db = client.english_fiesta

# Initialize Emergent Auth
auth = emergent_auth.auth()

# Enums
class UserRole(str, Enum):
    GUEST = "guest"
    STUDENT = "student"
    INSTRUCTOR = "instructor"
    ADMIN = "admin"

class VideoLevel(str, Enum):
    NEW_BEGINNER = "New Beginner"
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"

class AccentType(str, Enum):
    BRITISH = "British"
    AMERICAN = "American"
    AUSTRALIAN = "Australian"
    CANADIAN = "Canadian"
    INDIAN = "Indian"
    SOUTH_AFRICAN = "South African"

class VideoType(str, Enum):
    LOCAL = "local"
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
    topics: List[str] = []  # Topics instead of category - list of topic IDs or slugs
    thumbnail_url: Optional[str] = None  # Optional for uploads, auto-generated
    is_premium: bool = False
    
    # Video source information
    video_type: VideoType = VideoType.LOCAL
    video_url: Optional[str] = None  # For local videos
    youtube_video_id: Optional[str] = None  # For YouTube videos
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class VideoRequest(BaseModel):
    title: str
    description: str
    duration_minutes: int
    level: VideoLevel
    accents: List[AccentType] = []
    tags: List[str] = []
    instructor_name: str
    country: CountryType
    topics: List[str] = []  # Topics instead of category
    is_premium: bool = False

class Topic(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    slug: str
    visible: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Country(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    slug: str
    visible: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Guide(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    slug: str
    visible: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VideoSearchRequest(BaseModel):
    query: Optional[str] = None
    level: Optional[VideoLevel] = None
    accents: Optional[List[AccentType]] = None
    topics: Optional[List[str]] = []  # Topics instead of category
    instructor_name: Optional[str] = None
    country: Optional[CountryType] = None
    is_premium: Optional[bool] = None
    sort_by: Optional[str] = "created_at"
    sort_order: Optional[str] = "desc"
    limit: Optional[int] = 50

class User(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole
    created_at: datetime
    
class UserSettings(BaseModel):
    daily_minutes_goal: int = 30
    email_notifications: bool = True
    weekly_email_digest: bool = True

class UserProgress(BaseModel):
    user_id: str
    video_id: str
    session_id: str
    minutes_watched: int
    completed: bool = False
    last_watched_at: datetime = Field(default_factory=datetime.utcnow)

class WatchRequest(BaseModel):
    watched_minutes: int

class UserList(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    video_id: str
    added_at: datetime = Field(default_factory=datetime.utcnow)

class VideoListRequest(BaseModel):
    video_id: str

class ManualActivityRequest(BaseModel):
    date: str
    minutes: int
    activity_type: str = "video"

class DailyGoalRequest(BaseModel):
    daily_minutes_goal: int

class Content(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    section: str
    key: str
    content: str
    language: str = "en"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ContentRequest(BaseModel):
    section: str
    key: str
    content: str
    language: str = "en"

class Comment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    video_id: str
    user_id: str
    user_name: str
    text: str
    pinned: bool = False  # New field for pinned comments
    parent_comment_id: Optional[str] = None  # For threaded replies
    like_count: int = 0  # Number of likes
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CommentRequest(BaseModel):
    text: str = Field(min_length=1, max_length=500)  # Limit comment length
    parent_comment_id: Optional[str] = None  # For replies

class UserCommentLike(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    comment_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TopicRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    slug: str = Field(min_length=1, max_length=100)
    visible: bool = True

class CountryRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    slug: str = Field(min_length=1, max_length=100)
    visible: bool = True

class GuideRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    slug: str = Field(min_length=1, max_length=100)
    visible: bool = True

# =========== AUTH DEPENDENCIES ===========

async def get_current_user(token: str = Depends(auth.get_token)):
    """Get current user from token (optional - returns None if not authenticated)"""
    if not token:
        return None
    try:
        user_data = await auth.get_user(token)
        if user_data:
            return User(
                id=user_data["id"],
                name=user_data["name"],
                email=user_data["email"],
                role=UserRole(user_data.get("role", "student")),
                created_at=datetime.fromisoformat(user_data["created_at"].replace("Z", "+00:00"))
            )
    except Exception as e:
        print(f"Auth error: {e}")
    return None

def require_role(required_role: UserRole):
    """Dependency to require a specific role"""
    async def check_role(current_user: User = Depends(get_current_user)):
        if not current_user:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        # Role hierarchy check
        role_hierarchy = {
            UserRole.GUEST: 0,
            UserRole.STUDENT: 1,
            UserRole.INSTRUCTOR: 2,
            UserRole.ADMIN: 3
        }
        
        if role_hierarchy.get(current_user.role, 0) < role_hierarchy.get(required_role, 99):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        return current_user
    return check_role

# =========== STATIC FILE SERVING ===========

# Create necessary directories
UPLOAD_DIR = "/app/backend/uploads"
VIDEO_DIR = os.path.join(UPLOAD_DIR, "videos")
THUMBNAIL_DIR = os.path.join(UPLOAD_DIR, "thumbnails")

os.makedirs(VIDEO_DIR, exist_ok=True)
os.makedirs(THUMBNAIL_DIR, exist_ok=True)

# Mount static files for serving uploaded content
app.mount("/files", StaticFiles(directory=UPLOAD_DIR), name="files")

# =========== UTILITY FUNCTIONS ===========

def extract_youtube_video_id(url: str) -> Optional[str]:
    """Extract YouTube video ID from various YouTube URL formats"""
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})',
        r'youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    return None

def get_video_duration(video_path: str) -> int:
    """Get video duration in minutes using ffmpeg"""
    try:
        result = subprocess.run([
            'ffmpeg', '-i', video_path, '-f', 'null', '-'
        ], capture_output=True, text=True, stderr=subprocess.STDOUT)
        
        # Parse duration from ffmpeg output
        duration_line = None
        for line in result.stdout.split('\n'):
            if 'Duration:' in line:
                duration_line = line
                break
        
        if duration_line:
            # Extract duration (format: HH:MM:SS.ms)
            duration_str = duration_line.split('Duration: ')[1].split(',')[0]
            hours, minutes, seconds = duration_str.split(':')
            total_minutes = int(hours) * 60 + int(minutes) + (float(seconds) / 60)
            return max(1, int(total_minutes))  # At least 1 minute
        
    except Exception as e:
        print(f"Error getting video duration: {e}")
    
    return 5  # Default fallback

def generate_thumbnail(video_path: str, thumbnail_path: str) -> bool:
    """Generate thumbnail from video using ffmpeg"""
    try:
        subprocess.run([
            'ffmpeg', '-i', video_path, '-ss', '00:00:05', '-vframes', '1', 
            '-y', thumbnail_path
        ], check=True, capture_output=True)
        return True
    except Exception as e:
        print(f"Error generating thumbnail: {e}")
        return False

# =========== VIDEO ENDPOINTS ===========

@app.get("/api/videos")
async def get_videos(
    search: Optional[str] = Query(None),
    level: Optional[VideoLevel] = Query(None),
    topics: Optional[str] = Query(None),  # Topics instead of category - comma-separated
    instructor_name: Optional[str] = Query(None),
    country: Optional[CountryType] = Query(None),
    is_premium: Optional[bool] = Query(None),
    sort_by: Optional[str] = Query("created_at"),
    limit: int = Query(50, le=100),
    skip: int = Query(0, ge=0)
):
    """Get videos with filtering and pagination"""
    
    # Build query
    query = {}
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"instructor_name": {"$regex": search, "$options": "i"}}
        ]
    
    if level:
        query["level"] = level.value
    
    if topics:
        # Support comma-separated topics
        topic_list = [t.strip() for t in topics.split(",")]
        query["topics"] = {"$in": topic_list}
    
    if instructor_name:
        query["instructor_name"] = {"$regex": instructor_name, "$options": "i"}
    
    if country:
        query["country"] = country.value
    
    if is_premium is not None:
        query["is_premium"] = is_premium
    
    # Sort options
    sort_options = {
        "created_at": [("created_at", -1)],
        "title": [("title", 1)],
        "level": [("level", 1)],
        "duration": [("duration_minutes", 1)],
        "random": None  # Special case for random
    }
    
    sort_criteria = sort_options.get(sort_by, [("created_at", -1)])
    
    try:
        if sort_by == "random":
            # MongoDB aggregation pipeline for random sampling
            pipeline = [
                {"$match": query},
                {"$sample": {"size": limit}},
                {"$skip": skip}
            ]
            cursor = db.videos.aggregate(pipeline)
            videos = await cursor.to_list(length=limit)
        else:
            videos = await db.videos.find(query, {"_id": 0}).sort(sort_criteria).skip(skip).limit(limit).to_list(limit)
        
        return {
            "videos": videos,
            "count": len(videos),
            "total": await db.videos.count_documents(query)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching videos: {str(e)}")

@app.get("/api/videos/{video_id}")
async def get_video(video_id: str):
    """Get a specific video by ID"""
    video = await db.videos.find_one({"id": video_id}, {"_id": 0})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return video

@app.post("/api/videos/{video_id}/watch")
async def track_video_watch(
    video_id: str,
    watch_data: WatchRequest,
    session_id: str = Query(...),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Track video watch progress"""
    
    # Verify video exists
    video = await db.videos.find_one({"id": video_id}, {"_id": 0})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Create or update progress record
    progress_data = {
        "user_id": current_user.id if current_user else None,
        "video_id": video_id,
        "session_id": session_id,
        "minutes_watched": watch_data.watched_minutes,
        "completed": watch_data.watched_minutes >= video["duration_minutes"] * 0.8,  # 80% completion
        "last_watched_at": datetime.utcnow()
    }
    
    # Update or insert progress
    await db.user_progress.update_one(
        {
            "session_id": session_id,
            "video_id": video_id
        },
        {"$set": progress_data},
        upsert=True
    )
    
    return {"message": "Progress tracked successfully", "progress": progress_data}

# =========== FILTER OPTIONS ===========

@app.get("/api/filters/options")
async def get_filter_options():
    """Get all available filter options"""
    
    # Get topics from database
    topics = await db.topics.find({"visible": True}, {"_id": 0}).to_list(100)
    
    # Get countries from database
    countries = await db.countries.find({"visible": True}, {"_id": 0}).to_list(100)
    
    # Get guides from database
    guides = await db.guides.find({"visible": True}, {"_id": 0}).to_list(100)
    
    return {
        "levels": [level.value for level in VideoLevel],
        "accents": [accent.value for accent in AccentType],
        "countries": [country.value for country in CountryType],
        "topics": topics,  # Topics from database instead of categories
        "guides": guides
    }

# =========== PROGRESS ENDPOINTS ===========

@app.get("/api/progress/{session_id}")
async def get_user_progress(
    session_id: str,
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get user's learning progress and statistics"""
    
    # Build query based on authentication status
    if current_user:
        query = {"$or": [{"user_id": current_user.id}, {"session_id": session_id}]}
    else:
        query = {"session_id": session_id}
    
    # Get all progress records
    progress_records = await db.user_progress.find(query).to_list(1000)
    
    # Calculate statistics
    total_minutes = sum(record.get("minutes_watched", 0) for record in progress_records)
    unique_videos = len(set(record["video_id"] for record in progress_records))
    completed_videos = len([r for r in progress_records if r.get("completed", False)])
    
    # Calculate streak (simplified)
    today = datetime.utcnow().date()
    recent_days = []
    for i in range(30):  # Check last 30 days
        day = today - timedelta(days=i)
        day_records = [r for r in progress_records 
                      if r.get("last_watched_at", datetime.min).date() == day]
        if day_records:
            recent_days.append(day)
        elif i == 0:  # If no activity today, streak is broken
            break
    
    current_streak = len(recent_days)
    
    # Get today's progress
    today_records = [r for r in progress_records 
                    if r.get("last_watched_at", datetime.min).date() == today]
    today_minutes = sum(record.get("minutes_watched", 0) for record in today_records)
    
    return {
        "total_minutes_watched": total_minutes,
        "unique_videos_watched": unique_videos,
        "completed_videos": completed_videos,
        "current_streak": current_streak,
        "today_minutes": today_minutes,
        "recent_activity": [
            {
                "date": day.isoformat(),
                "minutes": sum(r.get("minutes_watched", 0) for r in progress_records 
                             if r.get("last_watched_at", datetime.min).date() == day),
                "videos_count": len([r for r in progress_records 
                                   if r.get("last_watched_at", datetime.min).date() == day])
            }
            for day in sorted(set(r.get("last_watched_at", datetime.min).date() 
                                for r in progress_records if r.get("last_watched_at")), reverse=True)[:10]
        ]
    }

# =========== ADMIN VIDEO UPLOAD ===========

@app.post("/api/admin/videos/upload")
async def upload_video(
    title: str = Form(...),
    description: str = Form(...),
    level: VideoLevel = Form(...),
    accents: str = Form(...),  # JSON string of accents
    tags: str = Form(...),  # JSON string of tags
    instructor_name: str = Form(...),
    country: CountryType = Form(...),
    topics: str = Form(...),  # JSON string of topics instead of category
    is_premium: bool = Form(False),
    video_file: UploadFile = File(...),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Upload a video file (Admin only)"""
    
    # Validate file type
    if not video_file.content_type or not video_file.content_type.startswith('video/'):
        raise HTTPException(status_code=400, detail="File must be a video")
    
    try:
        # Parse JSON fields
        accents_list = json.loads(accents) if accents else []
        tags_list = json.loads(tags) if tags else []
        topics_list = json.loads(topics) if topics else []
        
        # Generate unique filename
        video_id = str(uuid.uuid4())
        file_extension = os.path.splitext(video_file.filename)[1]
        video_filename = f"{video_id}{file_extension}"
        video_path = os.path.join(VIDEO_DIR, video_filename)
        
        # Save video file
        with open(video_path, "wb") as buffer:
            content = await video_file.read()
            buffer.write(content)
        
        # Get video duration
        duration_minutes = get_video_duration(video_path)
        
        # Generate thumbnail
        thumbnail_filename = f"{video_id}.jpg"
        thumbnail_path = os.path.join(THUMBNAIL_DIR, thumbnail_filename)
        thumbnail_generated = generate_thumbnail(video_path, thumbnail_path)
        
        # Create video record
        video_data = {
            "id": video_id,
            "title": title,
            "description": description,
            "duration_minutes": duration_minutes,
            "level": level.value,
            "accents": accents_list,
            "tags": tags_list,
            "instructor_name": instructor_name,
            "country": country.value,
            "topics": topics_list,  # Topics instead of category
            "thumbnail_url": f"/files/thumbnails/{thumbnail_filename}" if thumbnail_generated else None,
            "is_premium": is_premium,
            "video_type": "local",
            "video_url": f"/files/videos/{video_filename}",
            "youtube_video_id": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Save to database
        await db.videos.insert_one(video_data)
        
        return {
            "message": "Video uploaded successfully",
            "video": video_data
        }
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in accents, tags, or topics fields")
    except Exception as e:
        # Clean up file if something goes wrong
        if os.path.exists(video_path):
            os.remove(video_path)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.post("/api/admin/videos/youtube")
async def add_youtube_video(
    youtube_url: str = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    level: VideoLevel = Form(...),
    accents: List[AccentType] = Form(...),
    tags: List[str] = Form(...),
    instructor_name: str = Form(...),
    country: CountryType = Form(...),
    topics: List[str] = Form(...),  # Topics instead of category
    is_premium: bool = Form(False),
    duration_minutes: int = Form(...),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Add a YouTube video (Admin only)"""
    
    # Extract YouTube video ID
    video_id_youtube = extract_youtube_video_id(youtube_url)
    if not video_id_youtube:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")
    
    try:
        # Generate unique ID for our database
        video_id = str(uuid.uuid4())
        
        # Create video record
        video_data = {
            "id": video_id,
            "title": title,
            "description": description,
            "duration_minutes": duration_minutes,
            "level": level.value,
            "accents": [accent.value for accent in accents],
            "tags": tags,
            "instructor_name": instructor_name,
            "country": country.value,
            "topics": topics,  # Topics instead of category
            "thumbnail_url": f"https://img.youtube.com/vi/{video_id_youtube}/maxresdefault.jpg",
            "is_premium": is_premium,
            "video_type": "youtube",
            "video_url": None,
            "youtube_video_id": video_id_youtube,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Save to database
        await db.videos.insert_one(video_data)
        
        return {
            "message": "YouTube video added successfully",
            "video": video_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add YouTube video: {str(e)}")

# =========== USER LIST ENDPOINTS ===========

@app.get("/api/user/list")
async def get_user_list(current_user: User = Depends(require_role(UserRole.STUDENT))):
    """Get user's video list"""
    
    # Get user's list
    user_lists = await db.user_lists.find({"user_id": current_user.id}).to_list(1000)
    video_ids = [item["video_id"] for item in user_lists]
    
    # Get videos
    videos = await db.videos.find({"id": {"$in": video_ids}}, {"_id": 0}).to_list(1000)
    
    return {"videos": videos}

@app.post("/api/user/list")
async def add_to_user_list(
    request: VideoListRequest,
    current_user: User = Depends(require_role(UserRole.STUDENT))
):
    """Add video to user's list"""
    
    # Check if video exists
    video = await db.videos.find_one({"id": request.video_id}, {"_id": 0})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Check if already in list
    existing = await db.user_lists.find_one({
        "user_id": current_user.id,
        "video_id": request.video_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Video already in list")
    
    # Add to list
    list_item = {
        "id": str(uuid.uuid4()),
        "user_id": current_user.id,
        "video_id": request.video_id,
        "added_at": datetime.utcnow()
    }
    
    await db.user_lists.insert_one(list_item)
    
    return {"message": "Video added to list", "list_item": list_item}

@app.delete("/api/user/list/{video_id}")
async def remove_from_user_list(
    video_id: str,
    current_user: User = Depends(require_role(UserRole.STUDENT))
):
    """Remove video from user's list"""
    
    result = await db.user_lists.delete_one({
        "user_id": current_user.id,
        "video_id": video_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Video not found in list")
    
    return {"message": "Video removed from list"}

@app.get("/api/user/list/status/{video_id}")
async def get_list_status(
    video_id: str,
    current_user: User = Depends(require_role(UserRole.STUDENT))
):
    """Check if video is in user's list"""
    
    existing = await db.user_lists.find_one({
        "user_id": current_user.id,
        "video_id": video_id
    })
    
    return {"in_list": existing is not None}

# =========== DAILY GOAL ENDPOINTS ===========

@app.get("/api/user/daily-goal")
async def get_daily_goal(current_user: User = Depends(require_role(UserRole.STUDENT))):
    """Get user's daily goal"""
    
    settings = await db.user_settings.find_one({"user_id": current_user.id}, {"_id": 0})
    daily_goal = settings.get("daily_minutes_goal", 30) if settings else 30
    
    return {"daily_goal": daily_goal}

@app.post("/api/user/daily-goal")
async def set_daily_goal(
    request: DailyGoalRequest,
    current_user: User = Depends(require_role(UserRole.STUDENT))
):
    """Set user's daily goal"""
    
    if request.daily_minutes_goal < 5 or request.daily_minutes_goal > 300:
        raise HTTPException(status_code=400, detail="Daily goal must be between 5 and 300 minutes")
    
    await db.user_settings.update_one(
        {"user_id": current_user.id},
        {
            "$set": {
                "daily_minutes_goal": request.daily_minutes_goal,
                "updated_at": datetime.utcnow()
            }
        },
        upsert=True
    )
    
    return {"message": "Daily goal updated", "daily_goal": request.daily_minutes_goal}

# =========== MANUAL ACTIVITY ENDPOINTS ===========

@app.post("/api/user/manual-activity")
async def add_manual_activity(
    request: ManualActivityRequest,
    current_user: User = Depends(require_role(UserRole.STUDENT))
):
    """Add manual activity (outside hours)"""
    
    activity_data = {
        "id": str(uuid.uuid4()),
        "user_id": current_user.id,
        "date": request.date,
        "minutes": request.minutes,
        "activity_type": request.activity_type,
        "created_at": datetime.utcnow()
    }
    
    await db.manual_activities.insert_one(activity_data)
    
    return {"message": "Manual activity added", "activity": activity_data}

# =========== MARK AS WATCHED ENDPOINTS ===========

@app.post("/api/videos/{video_id}/mark-watched")
async def mark_video_watched(
    video_id: str,
    session_id: str = Query(...),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Mark video as watched"""
    
    # Verify video exists
    video = await db.videos.find_one({"id": video_id}, {"_id": 0})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Create progress record marking as completed
    progress_data = {
        "user_id": current_user.id if current_user else None,
        "video_id": video_id,
        "session_id": session_id,
        "minutes_watched": video["duration_minutes"],  # Mark as fully watched
        "completed": True,
        "last_watched_at": datetime.utcnow()
    }
    
    await db.user_progress.update_one(
        {
            "session_id": session_id,
            "video_id": video_id
        },
        {"$set": progress_data},
        upsert=True
    )
    
    return {"message": "Video marked as watched", "progress": progress_data}

@app.post("/api/user/unmark-watched")
async def unmark_video_watched(
    request: VideoListRequest,
    session_id: str = Query(...),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Unmark video as watched"""
    
    result = await db.user_progress.delete_one({
        "session_id": session_id,
        "video_id": request.video_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Video progress not found")
    
    return {"message": "Video unmarked as watched"}

# =========== COMMENT ENDPOINTS ===========

@app.get("/api/comments/{video_id}")
async def get_video_comments(video_id: str, current_user: Optional[User] = Depends(get_current_user)):
    """Get comments for a specific video with threading support"""
    # Verify video exists
    video = await db.videos.find_one({"id": video_id}, {"_id": 0})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Get all comments for this video
    all_comments = await db.comments.find(
        {"video_id": video_id},
        {"_id": 0}
    ).sort([("pinned", -1), ("created_at", -1)]).to_list(500)
    
    # Separate top-level comments and replies
    top_level_comments = []
    replies_map = {}
    
    for comment in all_comments:
        # Add user_liked field if user is authenticated
        if current_user:
            user_like = await db.user_comment_likes.find_one({
                "user_id": current_user.id,
                "comment_id": comment["id"]
            })
            comment["user_liked"] = user_like is not None
        else:
            comment["user_liked"] = False
        
        if comment.get("parent_comment_id"):
            # This is a reply
            parent_id = comment["parent_comment_id"]
            if parent_id not in replies_map:
                replies_map[parent_id] = []
            replies_map[parent_id].append(comment)
        else:
            # This is a top-level comment
            comment["replies"] = []
            top_level_comments.append(comment)
    
    # Attach replies to their parent comments
    for comment in top_level_comments:
        comment_id = comment["id"]
        if comment_id in replies_map:
            comment["replies"] = sorted(replies_map[comment_id], key=lambda x: x["created_at"])
    
    return {
        "video_id": video_id,
        "comments": top_level_comments,
        "total": len(all_comments)
    }

@app.post("/api/comments/{video_id}")
async def create_comment(
    video_id: str,
    comment_request: CommentRequest,
    current_user: User = Depends(require_role(UserRole.STUDENT))
):
    """Create a new comment (requires authentication)"""
    
    # Verify video exists
    video = await db.videos.find_one({"id": video_id}, {"_id": 0})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # If this is a reply, verify parent comment exists
    if comment_request.parent_comment_id:
        parent_comment = await db.comments.find_one({"id": comment_request.parent_comment_id}, {"_id": 0})
        if not parent_comment:
            raise HTTPException(status_code=404, detail="Parent comment not found")
        if parent_comment["video_id"] != video_id:
            raise HTTPException(status_code=400, detail="Parent comment is not for this video")
    
    # Create comment
    comment_data = {
        "id": str(uuid.uuid4()),
        "video_id": video_id,
        "user_id": current_user.id,
        "user_name": current_user.name,
        "text": comment_request.text.strip(),
        "pinned": False,  # New comments are not pinned by default
        "parent_comment_id": comment_request.parent_comment_id,
        "like_count": 0,
        "created_at": datetime.utcnow()
    }
    
    await db.comments.insert_one(comment_data)
    
    return {
        "message": "Comment created successfully",
        "comment": comment_data
    }

@app.delete("/api/comments/{comment_id}")
async def delete_comment(
    comment_id: str,
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Delete a comment (admin only)"""
    # Find and delete the comment
    result = await db.comments.delete_one({"id": comment_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    return {"message": "Comment deleted successfully"}

@app.put("/api/comments/{comment_id}/pin")
async def pin_comment(
    comment_id: str,
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Pin a comment (admin only)"""
    # Update comment to set pinned = True
    result = await db.comments.update_one(
        {"id": comment_id},
        {"$set": {"pinned": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Get the updated comment
    comment = await db.comments.find_one({"id": comment_id}, {"_id": 0})
    
    return {
        "message": "Comment pinned successfully",
        "comment": comment
    }

@app.put("/api/comments/{comment_id}/unpin")
async def unpin_comment(
    comment_id: str,
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Unpin a comment (admin only)"""
    # Update comment to set pinned = False
    result = await db.comments.update_one(
        {"id": comment_id},
        {"$set": {"pinned": False}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Get the updated comment
    comment = await db.comments.find_one({"id": comment_id}, {"_id": 0})
    
    return {
        "message": "Comment unpinned successfully",
        "comment": comment
    }

@app.post("/api/comments/{comment_id}/like")
async def like_comment(
    comment_id: str,
    current_user: User = Depends(require_role(UserRole.STUDENT))
):
    """Like a comment (authenticated users only)"""
    # Check if comment exists
    comment = await db.comments.find_one({"id": comment_id}, {"_id": 0})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check if user already liked this comment
    existing_like = await db.user_comment_likes.find_one({
        "user_id": current_user.id,
        "comment_id": comment_id
    })
    
    if existing_like:
        return {"message": "Comment already liked", "already_liked": True}
    
    # Add like
    like_data = {
        "id": str(uuid.uuid4()),
        "user_id": current_user.id,
        "comment_id": comment_id,
        "created_at": datetime.utcnow()
    }
    
    await db.user_comment_likes.insert_one(like_data)
    
    # Update comment like count
    await db.comments.update_one(
        {"id": comment_id},
        {"$inc": {"like_count": 1}}
    )
    
    # Get updated comment
    updated_comment = await db.comments.find_one({"id": comment_id}, {"_id": 0})
    
    return {
        "message": "Comment liked successfully",
        "comment": updated_comment,
        "already_liked": False
    }

@app.delete("/api/comments/{comment_id}/like")
async def unlike_comment(
    comment_id: str,
    current_user: User = Depends(require_role(UserRole.STUDENT))
):
    """Unlike a comment (authenticated users only)"""
    # Check if comment exists
    comment = await db.comments.find_one({"id": comment_id}, {"_id": 0})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Find and remove like
    result = await db.user_comment_likes.delete_one({
        "user_id": current_user.id,
        "comment_id": comment_id
    })
    
    if result.deleted_count == 0:
        return {"message": "Comment was not liked", "was_liked": False}
    
    # Update comment like count
    await db.comments.update_one(
        {"id": comment_id},
        {"$inc": {"like_count": -1}}
    )
    
    # Get updated comment
    updated_comment = await db.comments.find_one({"id": comment_id}, {"_id": 0})
    
    return {
        "message": "Comment unliked successfully",
        "comment": updated_comment,
        "was_liked": True
    }

# =========== CONTENT MANAGEMENT ENDPOINTS ===========

@app.get("/api/content/{section}")
async def get_content_section(section: str, language: str = Query("en")):
    """Get all content for a section"""
    content_items = await db.content.find(
        {"section": section, "language": language},
        {"_id": 0}
    ).to_list(100)
    
    # Convert to key-value pairs
    content_dict = {item["key"]: item["content"] for item in content_items}
    
    return {"section": section, "language": language, "content": content_dict}

@app.post("/api/content")
async def update_content(
    content_request: ContentRequest,
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Update content (admin only)"""
    
    content_data = {
        "section": content_request.section,
        "key": content_request.key,
        "content": content_request.content,
        "language": content_request.language,
        "updated_at": datetime.utcnow()
    }
    
    await db.content.update_one(
        {
            "section": content_request.section,
            "key": content_request.key,
            "language": content_request.language
        },
        {"$set": content_data},
        upsert=True
    )
    
    return {"message": "Content updated successfully", "content": content_data}

# =========== ADMIN TOPIC MANAGEMENT ===========

@app.get("/api/admin/topics")
async def get_topics(current_user: User = Depends(require_role(UserRole.ADMIN))):
    """Get all topics (admin only)"""
    topics = await db.topics.find({}, {"_id": 0}).sort([("name", 1)]).to_list(100)
    return {"topics": topics}

@app.post("/api/admin/topics")
async def create_topic(
    topic_request: TopicRequest,
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Create a new topic (admin only)"""
    
    # Check if topic with same slug exists
    existing = await db.topics.find_one({"slug": topic_request.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Topic with this slug already exists")
    
    topic_data = {
        "id": str(uuid.uuid4()),
        "name": topic_request.name,
        "slug": topic_request.slug,
        "visible": topic_request.visible,
        "created_at": datetime.utcnow()
    }
    
    await db.topics.insert_one(topic_data)
    
    return {"message": "Topic created successfully", "topic": topic_data}

@app.put("/api/admin/topics/{topic_id}")
async def update_topic(
    topic_id: str,
    topic_request: TopicRequest,
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Update a topic (admin only)"""
    
    result = await db.topics.update_one(
        {"id": topic_id},
        {"$set": {
            "name": topic_request.name,
            "slug": topic_request.slug,
            "visible": topic_request.visible
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    updated_topic = await db.topics.find_one({"id": topic_id}, {"_id": 0})
    
    return {"message": "Topic updated successfully", "topic": updated_topic}

@app.delete("/api/admin/topics/{topic_id}")
async def delete_topic(
    topic_id: str,
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Delete a topic (admin only)"""
    
    result = await db.topics.delete_one({"id": topic_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    return {"message": "Topic deleted successfully"}

# =========== ADMIN COUNTRY MANAGEMENT ===========

@app.get("/api/admin/countries")
async def get_countries_admin(current_user: User = Depends(require_role(UserRole.ADMIN))):
    """Get all countries (admin only)"""
    countries = await db.countries.find({}, {"_id": 0}).sort([("name", 1)]).to_list(100)
    return {"countries": countries}

@app.post("/api/admin/countries")
async def create_country(
    country_request: CountryRequest,
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Create a new country (admin only)"""
    
    existing = await db.countries.find_one({"slug": country_request.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Country with this slug already exists")
    
    country_data = {
        "id": str(uuid.uuid4()),
        "name": country_request.name,
        "slug": country_request.slug,
        "visible": country_request.visible,
        "created_at": datetime.utcnow()
    }
    
    await db.countries.insert_one(country_data)
    
    return {"message": "Country created successfully", "country": country_data}

@app.put("/api/admin/countries/{country_id}")
async def update_country(
    country_id: str,
    country_request: CountryRequest,
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Update a country (admin only)"""
    
    result = await db.countries.update_one(
        {"id": country_id},
        {"$set": {
            "name": country_request.name,
            "slug": country_request.slug,
            "visible": country_request.visible
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Country not found")
    
    updated_country = await db.countries.find_one({"id": country_id}, {"_id": 0})
    
    return {"message": "Country updated successfully", "country": updated_country}

@app.delete("/api/admin/countries/{country_id}")
async def delete_country(
    country_id: str,
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Delete a country (admin only)"""
    
    result = await db.countries.delete_one({"id": country_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Country not found")
    
    return {"message": "Country deleted successfully"}

# =========== ADMIN GUIDE MANAGEMENT ===========

@app.get("/api/admin/guides")
async def get_guides_admin(current_user: User = Depends(require_role(UserRole.ADMIN))):
    """Get all guides (admin only)"""
    guides = await db.guides.find({}, {"_id": 0}).sort([("name", 1)]).to_list(100)
    return {"guides": guides}

@app.post("/api/admin/guides")
async def create_guide(
    guide_request: GuideRequest,
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Create a new guide (admin only)"""
    
    existing = await db.guides.find_one({"slug": guide_request.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Guide with this slug already exists")
    
    guide_data = {
        "id": str(uuid.uuid4()),
        "name": guide_request.name,
        "slug": guide_request.slug,
        "visible": guide_request.visible,
        "created_at": datetime.utcnow()
    }
    
    await db.guides.insert_one(guide_data)
    
    return {"message": "Guide created successfully", "guide": guide_data}

@app.put("/api/admin/guides/{guide_id}")
async def update_guide(
    guide_id: str,
    guide_request: GuideRequest,
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Update a guide (admin only)"""
    
    result = await db.guides.update_one(
        {"id": guide_id},
        {"$set": {
            "name": guide_request.name,
            "slug": guide_request.slug,
            "visible": guide_request.visible
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Guide not found")
    
    updated_guide = await db.guides.find_one({"id": guide_id}, {"_id": 0})
    
    return {"message": "Guide updated successfully", "guide": updated_guide}

@app.delete("/api/admin/guides/{guide_id}")
async def delete_guide(
    guide_id: str,
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Delete a guide (admin only)"""
    
    result = await db.guides.delete_one({"id": guide_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Guide not found")
    
    return {"message": "Guide deleted successfully"}

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)