from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import requests
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
from enum import Enum

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

@api_router.post("/videos/{video_id}/watch")
async def record_watch_progress(video_id: str, request: WatchRequest, session_id: str = Query(...)):
    """Record video watch progress"""
    video = await db.videos.find_one({"id": video_id}, {"_id": 0})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    watched_minutes = request.watched_minutes
    
    # Create or update watch progress
    progress_data = {
        "user_id": None,
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
    await update_daily_progress(session_id, video_id, watched_minutes)
    
    return {"message": "Progress recorded successfully"}

async def update_daily_progress(session_id: str, video_id: str, watched_minutes: int):
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
            "user_id": None,
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
    await update_user_stats(session_id)

async def update_user_stats(session_id: str):
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
        "user_id": None,
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
    """Get comprehensive user progress and statistics"""
    stats = await db.user_stats.find_one({"session_id": session_id}, {"_id": 0})
    
    if not stats:
        # Initialize empty stats if none exist
        stats = {
            "total_minutes_watched": 0,
            "current_streak": 0,
            "longest_streak": 0,
            "personal_best_day": 0,
            "level_progress": {},
            "milestones_achieved": []
        }
    
    # Get recent daily progress for heatmap
    recent_progress = await db.daily_progress.find(
        {"session_id": session_id}, {"_id": 0}
    ).sort("date", -1).limit(90).to_list(90)  # Last 90 days
    
    # Format for heatmap
    heatmap_data = []
    for progress in recent_progress:
        heatmap_data.append({
            "date": progress["date"],
            "minutes": progress["total_minutes_watched"]
        })
    
    watch_progress_count = await db.watch_progress.count_documents({"session_id": session_id})
    
    return {
        "stats": stats,
        "recent_activity": heatmap_data,
        "total_videos_watched": watch_progress_count
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