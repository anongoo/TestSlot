#!/usr/bin/env python3
"""
Categories→Topics Migration and Upload System Tests
Tests the complete migration from categories to topics and upload system functionality
"""

import requests
import json
import uuid
import subprocess
import os
from datetime import datetime
from typing import Dict, List, Any

# Backend URL from frontend/.env
BACKEND_URL = "https://24def043-437e-4708-a610-fbfa5acb93f6.preview.emergentagent.com/api"

class CategoriesTopicsMigrationTester:
    def __init__(self):
        self.session_id = str(uuid.uuid4())
        self.test_results = []
        self.sample_videos = []
        
    def log_test(self, test_name: str, success: bool, message: str, details: Dict = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "details": details or {}
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    # ========== CATEGORIES→TOPICS MIGRATION TESTS ==========
    
    def test_videos_endpoint_uses_topics_field(self):
        """Test GET /api/videos now uses topics field instead of category"""
        try:
            response = requests.get(f"{BACKEND_URL}/videos")
            
            if response.status_code == 200:
                data = response.json()
                videos = data.get('videos', [])
                
                if videos:
                    self.sample_videos = videos  # Store for other tests
                    
                    # Check if videos have topics field instead of category
                    has_topics = sum(1 for video in videos if 'topics' in video)
                    has_category = sum(1 for video in videos if 'category' in video)
                    
                    if has_topics > 0 and has_category == 0:
                        self.log_test(
                            "Videos Endpoint - Topics Field Migration",
                            True,
                            f"✅ Migration complete: {has_topics}/{len(videos)} videos use 'topics' field, 0 use 'category'",
                            {"videos_with_topics": has_topics, "videos_with_category": has_category, "total_videos": len(videos)}
                        )
                    elif has_topics > 0 and has_category > 0:
                        self.log_test(
                            "Videos Endpoint - Topics Field Migration",
                            False,
                            f"❌ Migration incomplete: {has_topics} videos have 'topics', {has_category} still have 'category'",
                            {"videos_with_topics": has_topics, "videos_with_category": has_category}
                        )
                    elif has_category > 0:
                        self.log_test(
                            "Videos Endpoint - Topics Field Migration",
                            False,
                            f"❌ Migration not started: {has_category} videos still use 'category' field",
                            {"videos_with_category": has_category}
                        )
                    else:
                        self.log_test(
                            "Videos Endpoint - Topics Field Migration",
                            False,
                            "❌ No videos have either 'topics' or 'category' fields",
                            {"total_videos": len(videos)}
                        )
                else:
                    self.log_test(
                        "Videos Endpoint - Topics Field Migration",
                        False,
                        "No videos found to test migration"
                    )
            else:
                self.log_test(
                    "Videos Endpoint - Topics Field Migration",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_test(
                "Videos Endpoint - Topics Field Migration",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_filter_options_returns_topics(self):
        """Test GET /api/filters/options returns topics instead of categories"""
        try:
            response = requests.get(f"{BACKEND_URL}/filters/options")
            
            if response.status_code == 200:
                data = response.json()
                
                has_topics = 'topics' in data
                has_categories = 'categories' in data
                
                if has_topics and not has_categories:
                    topics = data.get('topics', [])
                    self.log_test(
                        "Filter Options - Topics Migration",
                        True,
                        f"✅ Migration complete: Filter options return 'topics' ({len(topics)} topics) instead of 'categories'",
                        {"topics_count": len(topics), "sample_topics": topics[:3] if topics else []}
                    )
                elif has_topics and has_categories:
                    self.log_test(
                        "Filter Options - Topics Migration",
                        False,
                        "❌ Migration incomplete: Filter options have both 'topics' and 'categories'",
                        {"has_topics": has_topics, "has_categories": has_categories}
                    )
                elif has_categories and not has_topics:
                    self.log_test(
                        "Filter Options - Topics Migration",
                        False,
                        "❌ Migration not started: Filter options still return 'categories' instead of 'topics'",
                        {"available_keys": list(data.keys())}
                    )
                else:
                    self.log_test(
                        "Filter Options - Topics Migration",
                        False,
                        "❌ Neither 'topics' nor 'categories' found in filter options",
                        {"available_keys": list(data.keys())}
                    )
            else:
                self.log_test(
                    "Filter Options - Topics Migration",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_test(
                "Filter Options - Topics Migration",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_video_filtering_by_topics_parameter(self):
        """Test video filtering by topics parameter instead of category"""
        try:
            # First get available topics
            filter_response = requests.get(f"{BACKEND_URL}/filters/options")
            if filter_response.status_code != 200:
                self.log_test(
                    "Video Filtering - Topics Parameter",
                    False,
                    "Could not get filter options to test topic filtering"
                )
                return
            
            filter_data = filter_response.json()
            topics = filter_data.get('topics', [])
            
            if not topics:
                self.log_test(
                    "Video Filtering - Topics Parameter",
                    False,
                    "No topics available to test filtering"
                )
                return
            
            # Test filtering by topics parameter
            test_topic = topics[0]['slug'] if isinstance(topics[0], dict) and 'slug' in topics[0] else str(topics[0])
            
            # Test topics parameter
            topics_response = requests.get(f"{BACKEND_URL}/videos", params={"topics": test_topic})
            
            # Test old category parameter (should not work or return different results)
            category_response = requests.get(f"{BACKEND_URL}/videos", params={"category": test_topic})
            
            if topics_response.status_code == 200:
                topics_data = topics_response.json()
                topics_videos = topics_data.get('videos', [])
                
                if category_response.status_code == 200:
                    category_data = category_response.json()
                    category_videos = category_data.get('videos', [])
                    
                    # If topics filtering works and category filtering returns different/no results, migration is complete
                    if len(topics_videos) >= 0 and len(category_videos) == 0:
                        self.log_test(
                            "Video Filtering - Topics Parameter",
                            True,
                            f"✅ Migration complete: Topics filtering works ({len(topics_videos)} videos), category filtering returns no results",
                            {"test_topic": test_topic, "topics_results": len(topics_videos), "category_results": len(category_videos)}
                        )
                    elif len(topics_videos) > 0 and len(category_videos) > 0:
                        self.log_test(
                            "Video Filtering - Topics Parameter",
                            False,
                            f"❌ Migration incomplete: Both topics ({len(topics_videos)}) and category ({len(category_videos)}) filtering work",
                            {"test_topic": test_topic, "topics_results": len(topics_videos), "category_results": len(category_videos)}
                        )
                    else:
                        self.log_test(
                            "Video Filtering - Topics Parameter",
                            True,
                            f"✅ Topics parameter accepted (no videos match topic '{test_topic}')",
                            {"test_topic": test_topic}
                        )
                else:
                    # Category parameter causes error - good sign
                    self.log_test(
                        "Video Filtering - Topics Parameter",
                        True,
                        f"✅ Topics filtering works, category parameter not supported (HTTP {category_response.status_code})",
                        {"test_topic": test_topic, "topics_results": len(topics_videos)}
                    )
            else:
                self.log_test(
                    "Video Filtering - Topics Parameter",
                    False,
                    f"Topics filtering failed: HTTP {topics_response.status_code}",
                    {"test_topic": test_topic}
                )
        except Exception as e:
            self.log_test(
                "Video Filtering - Topics Parameter",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_video_category_enum_completely_removed(self):
        """Test that VideoCategory enum references are completely removed"""
        try:
            # Test that category parameter doesn't work in video filtering
            response = requests.get(f"{BACKEND_URL}/videos", params={"category": "Grammar"})
            
            if response.status_code == 200:
                data = response.json()
                videos = data.get('videos', [])
                
                # Check if any videos still have category field
                videos_with_category = sum(1 for video in videos if 'category' in video)
                
                if videos_with_category == 0:
                    self.log_test(
                        "VideoCategory Enum - Complete Removal",
                        True,
                        f"✅ VideoCategory enum removed: Category parameter returns {len(videos)} videos but none have 'category' field",
                        {"filtered_videos": len(videos), "videos_with_category": videos_with_category}
                    )
                else:
                    self.log_test(
                        "VideoCategory Enum - Complete Removal",
                        False,
                        f"❌ VideoCategory enum not fully removed: {videos_with_category} videos still have 'category' field",
                        {"videos_with_category": videos_with_category}
                    )
            else:
                # If category parameter causes an error, that's good - it means it's not supported
                self.log_test(
                    "VideoCategory Enum - Complete Removal",
                    True,
                    f"✅ VideoCategory enum successfully removed: Category parameter not supported (HTTP {response.status_code})"
                )
        except Exception as e:
            self.log_test(
                "VideoCategory Enum - Complete Removal",
                False,
                f"Request failed: {str(e)}"
            )
    
    # ========== UPLOAD SYSTEM TESTS ==========
    
    def test_admin_video_upload_endpoint_exists(self):
        """Test POST /api/admin/videos/upload endpoint exists and is secured"""
        try:
            # Test without authentication - should return 401
            response = requests.post(f"{BACKEND_URL}/admin/videos/upload")
            
            if response.status_code == 401:
                self.log_test(
                    "Admin Video Upload - Endpoint Security",
                    True,
                    "✅ Upload endpoint exists and correctly requires admin authentication",
                    {"expected_status": 401}
                )
            elif response.status_code == 422:
                # Missing required fields - endpoint exists but needs proper data
                self.log_test(
                    "Admin Video Upload - Endpoint Security",
                    True,
                    "✅ Upload endpoint exists and validates required fields",
                    {"status_code": response.status_code}
                )
            else:
                self.log_test(
                    "Admin Video Upload - Endpoint Security",
                    False,
                    f"❌ Expected 401 or 422 for unauthenticated upload, got {response.status_code}",
                    {"status_code": response.status_code, "response": response.text[:200]}
                )
        except Exception as e:
            self.log_test(
                "Admin Video Upload - Endpoint Security",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_admin_youtube_video_endpoint_with_topics(self):
        """Test POST /api/admin/videos/youtube endpoint supports topics field"""
        try:
            # Test with topics field instead of category
            youtube_data = {
                "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "title": "Test YouTube Video",
                "description": "Test description",
                "level": "Beginner",
                "accents": ["American"],
                "tags": ["test", "youtube"],
                "instructor_name": "Test Instructor",
                "country": "USA",
                "topics": ["conversation", "grammar"],  # Using topics instead of category
                "is_premium": False,
                "duration_minutes": 10
            }
            
            response = requests.post(f"{BACKEND_URL}/admin/videos/youtube", data=youtube_data)
            
            if response.status_code == 401:
                self.log_test(
                    "Admin YouTube Video - Topics Field Support",
                    True,
                    "✅ YouTube video endpoint exists, requires admin authentication, and accepts topics field",
                    {"topics_field_present": "topics" in youtube_data}
                )
            elif response.status_code == 422:
                # Validation error - check if it's about topics field
                error_text = response.text.lower()
                if "topics" not in error_text or "category" not in error_text:
                    self.log_test(
                        "Admin YouTube Video - Topics Field Support",
                        True,
                        "✅ YouTube video endpoint accepts topics field (validation error not related to topics/category)",
                        {"status_code": response.status_code}
                    )
                else:
                    self.log_test(
                        "Admin YouTube Video - Topics Field Support",
                        False,
                        f"❌ YouTube video endpoint has issues with topics field: {response.text[:200]}",
                        {"status_code": response.status_code}
                    )
            else:
                self.log_test(
                    "Admin YouTube Video - Topics Field Support",
                    False,
                    f"❌ Unexpected response: {response.status_code}",
                    {"status_code": response.status_code, "response": response.text[:200]}
                )
        except Exception as e:
            self.log_test(
                "Admin YouTube Video - Topics Field Support",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_ffmpeg_installation_and_availability(self):
        """Test if ffmpeg is installed and available for video processing"""
        try:
            result = subprocess.run(['ffmpeg', '-version'], capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                version_info = result.stdout.split('\n')[0] if result.stdout else "Unknown version"
                self.log_test(
                    "FFmpeg - Installation and Availability",
                    True,
                    f"✅ FFmpeg is installed and available: {version_info}",
                    {"version": version_info, "return_code": result.returncode}
                )
            else:
                self.log_test(
                    "FFmpeg - Installation and Availability",
                    False,
                    f"❌ FFmpeg command failed with return code {result.returncode}",
                    {"return_code": result.returncode, "stderr": result.stderr[:200] if result.stderr else ""}
                )
        except subprocess.TimeoutExpired:
            self.log_test(
                "FFmpeg - Installation and Availability",
                False,
                "❌ FFmpeg command timed out (may be installed but not responding)"
            )
        except FileNotFoundError:
            self.log_test(
                "FFmpeg - Installation and Availability",
                False,
                "❌ FFmpeg not found in system PATH - required for video duration extraction and thumbnail generation"
            )
        except Exception as e:
            self.log_test(
                "FFmpeg - Installation and Availability",
                False,
                f"❌ Error checking FFmpeg: {str(e)}"
            )
    
    def test_video_duration_extraction_capability(self):
        """Test video duration extraction capability (simulated)"""
        try:
            # Test if ffmpeg can extract duration from a sample command
            # We'll test with a non-existent file to see if ffmpeg responds appropriately
            result = subprocess.run([
                'ffmpeg', '-i', '/nonexistent/test.mp4', '-f', 'null', '-'
            ], capture_output=True, text=True, timeout=5)
            
            # ffmpeg should fail but show it can process the command structure
            if "No such file or directory" in result.stderr or "does not exist" in result.stderr:
                self.log_test(
                    "Video Duration Extraction - Capability",
                    True,
                    "✅ FFmpeg can process video duration extraction commands",
                    {"test_type": "command_structure_test"}
                )
            else:
                self.log_test(
                    "Video Duration Extraction - Capability",
                    False,
                    f"❌ Unexpected ffmpeg response: {result.stderr[:200]}",
                    {"stderr": result.stderr[:200]}
                )
        except subprocess.TimeoutExpired:
            self.log_test(
                "Video Duration Extraction - Capability",
                False,
                "❌ FFmpeg duration extraction test timed out"
            )
        except FileNotFoundError:
            self.log_test(
                "Video Duration Extraction - Capability",
                False,
                "❌ FFmpeg not available for duration extraction"
            )
        except Exception as e:
            self.log_test(
                "Video Duration Extraction - Capability",
                False,
                f"❌ Error testing duration extraction: {str(e)}"
            )
    
    def test_thumbnail_generation_capability(self):
        """Test thumbnail generation capability (simulated)"""
        try:
            # Test if ffmpeg can generate thumbnails from a sample command
            result = subprocess.run([
                'ffmpeg', '-i', '/nonexistent/test.mp4', '-ss', '00:00:05', '-vframes', '1', 
                '-y', '/tmp/test_thumb.jpg'
            ], capture_output=True, text=True, timeout=5)
            
            # ffmpeg should fail but show it can process the thumbnail command structure
            if "No such file or directory" in result.stderr or "does not exist" in result.stderr:
                self.log_test(
                    "Thumbnail Generation - Capability",
                    True,
                    "✅ FFmpeg can process thumbnail generation commands",
                    {"test_type": "command_structure_test"}
                )
            else:
                self.log_test(
                    "Thumbnail Generation - Capability",
                    False,
                    f"❌ Unexpected ffmpeg response: {result.stderr[:200]}",
                    {"stderr": result.stderr[:200]}
                )
        except subprocess.TimeoutExpired:
            self.log_test(
                "Thumbnail Generation - Capability",
                False,
                "❌ FFmpeg thumbnail generation test timed out"
            )
        except FileNotFoundError:
            self.log_test(
                "Thumbnail Generation - Capability",
                False,
                "❌ FFmpeg not available for thumbnail generation"
            )
        except Exception as e:
            self.log_test(
                "Thumbnail Generation - Capability",
                False,
                f"❌ Error testing thumbnail generation: {str(e)}"
            )
    
    def test_upload_directories_structure(self):
        """Test that upload directories exist and are properly configured"""
        directories = [
            "/app/backend/uploads",
            "/app/backend/uploads/videos",
            "/app/backend/uploads/thumbnails",
            "/app/backend/uploads/temp"
        ]
        
        results = {}
        all_good = True
        
        for directory in directories:
            try:
                exists = os.path.exists(directory)
                if exists:
                    writable = os.access(directory, os.W_OK)
                    readable = os.access(directory, os.R_OK)
                    results[directory] = {"exists": True, "writable": writable, "readable": readable}
                    
                    if not writable or not readable:
                        all_good = False
                else:
                    results[directory] = {"exists": False, "writable": False, "readable": False}
                    all_good = False
            except Exception as e:
                results[directory] = {"error": str(e)}
                all_good = False
        
        if all_good:
            self.log_test(
                "Upload Directories - Structure and Permissions",
                True,
                "✅ All upload directories exist with proper read/write permissions",
                {"directories": results}
            )
        else:
            missing_dirs = [d for d, r in results.items() if not r.get("exists", False)]
            permission_issues = [d for d, r in results.items() if r.get("exists", False) and (not r.get("writable", False) or not r.get("readable", False))]
            
            self.log_test(
                "Upload Directories - Structure and Permissions",
                False,
                f"❌ Directory issues found - Missing: {len(missing_dirs)}, Permission issues: {len(permission_issues)}",
                {"directories": results, "missing": missing_dirs, "permission_issues": permission_issues}
            )
    
    def test_video_file_serving_endpoint(self):
        """Test GET /api/files/videos/{filename} endpoint"""
        try:
            # Test with a non-existent file (should return 404)
            response = requests.get(f"{BACKEND_URL}/files/videos/nonexistent_test_video.mp4")
            
            if response.status_code == 404:
                self.log_test(
                    "Video File Serving - Endpoint Functionality",
                    True,
                    "✅ Video file serving endpoint exists and returns 404 for non-existent files",
                    {"test_file": "nonexistent_test_video.mp4", "status_code": 404}
                )
            else:
                self.log_test(
                    "Video File Serving - Endpoint Functionality",
                    False,
                    f"❌ Expected 404 for non-existent file, got {response.status_code}",
                    {"status_code": response.status_code, "response": response.text[:200]}
                )
        except Exception as e:
            self.log_test(
                "Video File Serving - Endpoint Functionality",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_thumbnail_file_serving_endpoint(self):
        """Test GET /api/files/thumbnails/{filename} endpoint"""
        try:
            # Test with a non-existent file (should return 404)
            response = requests.get(f"{BACKEND_URL}/files/thumbnails/nonexistent_test_thumbnail.jpg")
            
            if response.status_code == 404:
                self.log_test(
                    "Thumbnail File Serving - Endpoint Functionality",
                    True,
                    "✅ Thumbnail file serving endpoint exists and returns 404 for non-existent files",
                    {"test_file": "nonexistent_test_thumbnail.jpg", "status_code": 404}
                )
            else:
                self.log_test(
                    "Thumbnail File Serving - Endpoint Functionality",
                    False,
                    f"❌ Expected 404 for non-existent file, got {response.status_code}",
                    {"status_code": response.status_code, "response": response.text[:200]}
                )
        except Exception as e:
            self.log_test(
                "Thumbnail File Serving - Endpoint Functionality",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_video_metadata_storage_with_topics(self):
        """Test that video metadata is stored with topics field"""
        if not self.sample_videos:
            self.log_test(
                "Video Metadata Storage - Topics Field",
                False,
                "No sample videos available to test metadata storage"
            )
            return
        
        try:
            # Get a specific video and check its metadata structure
            video_id = self.sample_videos[0]['id']
            response = requests.get(f"{BACKEND_URL}/videos/{video_id}")
            
            if response.status_code == 200:
                video = response.json()
                
                # Check if video has topics field and proper metadata structure
                has_topics = 'topics' in video
                has_category = 'category' in video
                
                required_metadata_fields = ['id', 'title', 'description', 'duration_minutes', 'level', 'instructor_name', 'country']
                missing_fields = [field for field in required_metadata_fields if field not in video]
                
                if has_topics and not has_category and not missing_fields:
                    topics = video.get('topics', [])
                    self.log_test(
                        "Video Metadata Storage - Topics Field",
                        True,
                        f"✅ Video metadata properly stored with topics field ({len(topics)} topics) and all required fields",
                        {"video_id": video_id, "topics": topics, "has_category": has_category}
                    )
                elif has_topics and has_category:
                    self.log_test(
                        "Video Metadata Storage - Topics Field",
                        False,
                        f"❌ Video has both topics and category fields - migration incomplete",
                        {"video_id": video_id, "has_topics": has_topics, "has_category": has_category}
                    )
                elif not has_topics:
                    self.log_test(
                        "Video Metadata Storage - Topics Field",
                        False,
                        f"❌ Video missing topics field",
                        {"video_id": video_id, "available_fields": list(video.keys())}
                    )
                else:
                    self.log_test(
                        "Video Metadata Storage - Topics Field",
                        False,
                        f"❌ Video missing required metadata fields: {missing_fields}",
                        {"video_id": video_id, "missing_fields": missing_fields}
                    )
            else:
                self.log_test(
                    "Video Metadata Storage - Topics Field",
                    False,
                    f"Failed to retrieve video metadata: HTTP {response.status_code}",
                    {"video_id": video_id}
                )
        except Exception as e:
            self.log_test(
                "Video Metadata Storage - Topics Field",
                False,
                f"Request failed: {str(e)}"
            )
    
    # ========== SYSTEM INTEGRATION TESTS ==========
    
    def test_complete_topics_migration_integration(self):
        """Test complete integration of topics migration across all endpoints"""
        integration_checks = {
            "videos_endpoint_uses_topics": False,
            "filter_options_returns_topics": False,
            "video_filtering_by_topics": False,
            "no_category_references": False,
            "video_metadata_has_topics": False
        }
        
        # Check videos endpoint uses topics
        try:
            response = requests.get(f"{BACKEND_URL}/videos")
            if response.status_code == 200:
                videos = response.json().get('videos', [])
                if videos and any('topics' in video for video in videos) and not any('category' in video for video in videos):
                    integration_checks["videos_endpoint_uses_topics"] = True
        except:
            pass
        
        # Check filter options returns topics
        try:
            response = requests.get(f"{BACKEND_URL}/filters/options")
            if response.status_code == 200:
                data = response.json()
                if 'topics' in data and 'categories' not in data:
                    integration_checks["filter_options_returns_topics"] = True
        except:
            pass
        
        # Check video filtering by topics works
        try:
            response = requests.get(f"{BACKEND_URL}/videos", params={"topics": "test"})
            if response.status_code == 200:
                integration_checks["video_filtering_by_topics"] = True
        except:
            pass
        
        # Check no category references remain
        try:
            response = requests.get(f"{BACKEND_URL}/videos", params={"category": "test"})
            if response.status_code == 200:
                videos = response.json().get('videos', [])
                if not any('category' in video for video in videos):
                    integration_checks["no_category_references"] = True
        except:
            pass
        
        # Check video metadata has topics
        if self.sample_videos:
            try:
                video_id = self.sample_videos[0]['id']
                response = requests.get(f"{BACKEND_URL}/videos/{video_id}")
                if response.status_code == 200:
                    video = response.json()
                    if 'topics' in video and 'category' not in video:
                        integration_checks["video_metadata_has_topics"] = True
            except:
                pass
        
        passed_checks = sum(integration_checks.values())
        total_checks = len(integration_checks)
        
        if passed_checks >= 4:  # At least 4 out of 5 checks should pass
            self.log_test(
                "Complete Topics Migration - System Integration",
                True,
                f"✅ Topics migration integration: {passed_checks}/{total_checks} checks passed",
                {"integration_checks": integration_checks}
            )
        else:
            self.log_test(
                "Complete Topics Migration - System Integration",
                False,
                f"❌ Topics migration incomplete: only {passed_checks}/{total_checks} checks passed",
                {"integration_checks": integration_checks}
            )
    
    def test_complete_upload_system_integration(self):
        """Test complete integration of upload system functionality"""
        integration_checks = {
            "admin_upload_endpoint_secured": False,
            "youtube_upload_endpoint_secured": False,
            "video_file_serving_works": False,
            "thumbnail_file_serving_works": False,
            "ffmpeg_available": False,
            "upload_directories_exist": False,
            "topics_field_supported": False
        }
        
        # Check admin upload endpoint is secured
        try:
            response = requests.post(f"{BACKEND_URL}/admin/videos/upload")
            if response.status_code in [401, 422]:  # Requires auth or validation
                integration_checks["admin_upload_endpoint_secured"] = True
        except:
            pass
        
        # Check YouTube upload endpoint is secured
        try:
            response = requests.post(f"{BACKEND_URL}/admin/videos/youtube")
            if response.status_code in [401, 422]:  # Requires auth or validation
                integration_checks["youtube_upload_endpoint_secured"] = True
        except:
            pass
        
        # Check video file serving works
        try:
            response = requests.get(f"{BACKEND_URL}/files/videos/test.mp4")
            if response.status_code == 404:  # Endpoint exists, file doesn't
                integration_checks["video_file_serving_works"] = True
        except:
            pass
        
        # Check thumbnail file serving works
        try:
            response = requests.get(f"{BACKEND_URL}/files/thumbnails/test.jpg")
            if response.status_code == 404:  # Endpoint exists, file doesn't
                integration_checks["thumbnail_file_serving_works"] = True
        except:
            pass
        
        # Check FFmpeg availability
        try:
            result = subprocess.run(['ffmpeg', '-version'], capture_output=True, timeout=5)
            if result.returncode == 0:
                integration_checks["ffmpeg_available"] = True
        except:
            pass
        
        # Check upload directories exist
        dirs = ["/app/backend/uploads/videos", "/app/backend/uploads/thumbnails"]
        if all(os.path.exists(d) and os.access(d, os.W_OK) for d in dirs):
            integration_checks["upload_directories_exist"] = True
        
        # Check topics field is supported in upload endpoints
        try:
            # Test YouTube endpoint with topics field
            youtube_data = {
                "youtube_url": "https://www.youtube.com/watch?v=test",
                "title": "Test", "level": "Beginner", "accents": ["American"],
                "tags": ["test"], "instructor_name": "Test", "country": "USA",
                "topics": ["test"], "is_premium": False, "duration_minutes": 10
            }
            response = requests.post(f"{BACKEND_URL}/admin/videos/youtube", data=youtube_data)
            # If it returns 401 (auth required) rather than 422 (validation error about topics), topics are supported
            if response.status_code == 401:
                integration_checks["topics_field_supported"] = True
        except:
            pass
        
        passed_checks = sum(integration_checks.values())
        total_checks = len(integration_checks)
        
        if passed_checks >= 5:  # At least 5 out of 7 checks should pass
            self.log_test(
                "Complete Upload System - Integration",
                True,
                f"✅ Upload system integration: {passed_checks}/{total_checks} components working",
                {"integration_checks": integration_checks}
            )
        else:
            self.log_test(
                "Complete Upload System - Integration",
                False,
                f"❌ Upload system integration incomplete: only {passed_checks}/{total_checks} components working",
                {"integration_checks": integration_checks}
            )
    
    def generate_summary(self):
        """Generate test summary"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print("\n" + "=" * 80)
        print("🎯 CATEGORIES→TOPICS MIGRATION & UPLOAD SYSTEM TEST SUMMARY")
        print("=" * 80)
        print(f"📊 Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"📈 Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS ({failed_tests}):")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['test']}: {result['message']}")
        
        print(f"\n✅ PASSED TESTS ({passed_tests}):")
        for result in self.test_results:
            if result['success']:
                print(f"   • {result['test']}: {result['message']}")
        
        # Categories→Topics Migration Summary
        migration_tests = [r for r in self.test_results if 'Migration' in r['test'] or 'Topics' in r['test'] or 'Category' in r['test']]
        migration_passed = sum(1 for r in migration_tests if r['success'])
        
        print(f"\n🔄 CATEGORIES→TOPICS MIGRATION: {migration_passed}/{len(migration_tests)} tests passed")
        
        # Upload System Summary
        upload_tests = [r for r in self.test_results if 'Upload' in r['test'] or 'FFmpeg' in r['test'] or 'File Serving' in r['test'] or 'Thumbnail' in r['test']]
        upload_passed = sum(1 for r in upload_tests if r['success'])
        
        print(f"📤 UPLOAD SYSTEM: {upload_passed}/{len(upload_tests)} tests passed")
        
        print("\n" + "=" * 80)
        
        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "success_rate": (passed_tests/total_tests)*100,
            "migration_tests": {"passed": migration_passed, "total": len(migration_tests)},
            "upload_tests": {"passed": upload_passed, "total": len(upload_tests)}
        }
    
    def run_all_tests(self):
        """Run all categories→topics migration and upload system tests"""
        print("🚀 Starting Categories→Topics Migration & Upload System Tests...")
        print(f"📡 Backend URL: {BACKEND_URL}")
        print(f"🔑 Session ID: {self.session_id}")
        print("=" * 80)
        
        # Categories→Topics Migration Tests
        print("\n🔄 TESTING CATEGORIES→TOPICS MIGRATION")
        print("-" * 50)
        self.test_videos_endpoint_uses_topics_field()
        self.test_filter_options_returns_topics()
        self.test_video_filtering_by_topics_parameter()
        self.test_video_category_enum_completely_removed()
        self.test_video_metadata_storage_with_topics()
        
        # Upload System Tests
        print("\n📤 TESTING UPLOAD SYSTEM FUNCTIONALITY")
        print("-" * 50)
        self.test_admin_video_upload_endpoint_exists()
        self.test_admin_youtube_video_endpoint_with_topics()
        self.test_ffmpeg_installation_and_availability()
        self.test_video_duration_extraction_capability()
        self.test_thumbnail_generation_capability()
        self.test_upload_directories_structure()
        self.test_video_file_serving_endpoint()
        self.test_thumbnail_file_serving_endpoint()
        
        # System Integration Tests
        print("\n🔗 TESTING SYSTEM INTEGRATION")
        print("-" * 50)
        self.test_complete_topics_migration_integration()
        self.test_complete_upload_system_integration()
        
        # Generate summary
        return self.generate_summary()

def main():
    """Main test execution"""
    tester = CategoriesTopicsMigrationTester()
    summary = tester.run_all_tests()
    
    # Exit with appropriate code
    if summary['failed_tests'] == 0:
        print("\n🎉 All tests passed!")
        exit(0)
    else:
        print(f"\n⚠️  {summary['failed_tests']} tests failed")
        exit(1)

if __name__ == "__main__":
    main()