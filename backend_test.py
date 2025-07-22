#!/usr/bin/env python3
"""
Backend API Tests for English Fiesta Language Learning Platform
Tests all video management and progress tracking functionality
"""

import requests
import json
import uuid
import time
from datetime import datetime
from typing import Dict, List, Any

# Backend URL from frontend/.env
BACKEND_URL = "https://a4450f01-c248-47b7-a045-500ab45fe3d3.preview.emergentagent.com/api"

class EnglishFiestaAPITester:
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
    
    def test_get_videos_basic(self):
        """Test basic video retrieval"""
        try:
            response = requests.get(f"{BACKEND_URL}/videos")
            
            if response.status_code == 200:
                data = response.json()
                videos = data.get('videos', [])
                total = data.get('total', 0)
                
                if len(videos) >= 5:  # Should have 5 sample videos
                    self.sample_videos = videos
                    self.log_test(
                        "GET /api/videos - Basic Retrieval",
                        True,
                        f"Retrieved {len(videos)} videos successfully",
                        {"total_count": total, "returned_count": len(videos)}
                    )
                else:
                    self.log_test(
                        "GET /api/videos - Basic Retrieval",
                        False,
                        f"Expected at least 5 sample videos, got {len(videos)}",
                        {"response": data}
                    )
            else:
                self.log_test(
                    "GET /api/videos - Basic Retrieval",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    {"status_code": response.status_code}
                )
        except Exception as e:
            self.log_test(
                "GET /api/videos - Basic Retrieval",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_video_filtering(self):
        """Test video filtering functionality"""
        filter_tests = [
            {"level": "Beginner", "expected_min": 1},
            {"category": "Grammar", "expected_min": 1},
            {"accent": "American", "expected_min": 1},
            {"guide": "Native Speaker", "expected_min": 1},
            {"country": "United States", "expected_min": 1},
            {"is_premium": False, "expected_min": 1},
            {"is_premium": True, "expected_min": 1},
            {"search": "English", "expected_min": 1},
            {"max_duration": 10, "expected_min": 1},
            {"sort_by": "shortest", "expected_min": 1},
            {"sort_by": "longest", "expected_min": 1}
        ]
        
        for filter_test in filter_tests:
            try:
                params = {k: v for k, v in filter_test.items() if k != "expected_min"}
                response = requests.get(f"{BACKEND_URL}/videos", params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    videos = data.get('videos', [])
                    
                    if len(videos) >= filter_test["expected_min"]:
                        self.log_test(
                            f"Video Filter - {list(params.keys())[0]}",
                            True,
                            f"Filter returned {len(videos)} videos",
                            {"filter": params, "count": len(videos)}
                        )
                    else:
                        self.log_test(
                            f"Video Filter - {list(params.keys())[0]}",
                            False,
                            f"Expected at least {filter_test['expected_min']} videos, got {len(videos)}",
                            {"filter": params, "response": data}
                        )
                else:
                    self.log_test(
                        f"Video Filter - {list(params.keys())[0]}",
                        False,
                        f"HTTP {response.status_code}: {response.text}",
                        {"filter": params}
                    )
            except Exception as e:
                self.log_test(
                    f"Video Filter - {list(params.keys())[0]}",
                    False,
                    f"Request failed: {str(e)}",
                    {"filter": params}
                )
    
    def test_get_specific_video(self):
        """Test retrieving specific video by ID"""
        if not self.sample_videos:
            self.log_test(
                "GET /api/videos/{video_id}",
                False,
                "No sample videos available for testing"
            )
            return
        
        video_id = self.sample_videos[0]['id']
        
        try:
            response = requests.get(f"{BACKEND_URL}/videos/{video_id}")
            
            if response.status_code == 200:
                video = response.json()
                if video.get('id') == video_id:
                    self.log_test(
                        "GET /api/videos/{video_id}",
                        True,
                        f"Retrieved video '{video.get('title', 'Unknown')}' successfully",
                        {"video_id": video_id, "title": video.get('title')}
                    )
                else:
                    self.log_test(
                        "GET /api/videos/{video_id}",
                        False,
                        "Video ID mismatch in response",
                        {"expected": video_id, "received": video.get('id')}
                    )
            else:
                self.log_test(
                    "GET /api/videos/{video_id}",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    {"video_id": video_id}
                )
        except Exception as e:
            self.log_test(
                "GET /api/videos/{video_id}",
                False,
                f"Request failed: {str(e)}",
                {"video_id": video_id}
            )
    
    def test_invalid_video_id(self):
        """Test handling of invalid video ID"""
        invalid_id = "invalid-video-id-123"
        
        try:
            response = requests.get(f"{BACKEND_URL}/videos/{invalid_id}")
            
            if response.status_code == 404:
                self.log_test(
                    "GET /api/videos/{invalid_id} - Error Handling",
                    True,
                    "Correctly returned 404 for invalid video ID",
                    {"invalid_id": invalid_id}
                )
            else:
                self.log_test(
                    "GET /api/videos/{invalid_id} - Error Handling",
                    False,
                    f"Expected 404, got {response.status_code}",
                    {"invalid_id": invalid_id, "response": response.text}
                )
        except Exception as e:
            self.log_test(
                "GET /api/videos/{invalid_id} - Error Handling",
                False,
                f"Request failed: {str(e)}",
                {"invalid_id": invalid_id}
            )
    
    def test_watch_progress_recording(self):
        """Test recording watch progress"""
        if not self.sample_videos:
            self.log_test(
                "POST /api/videos/{video_id}/watch",
                False,
                "No sample videos available for testing"
            )
            return
        
        video = self.sample_videos[0]
        video_id = video['id']
        watched_minutes = 5
        
        try:
            response = requests.post(
                f"{BACKEND_URL}/videos/{video_id}/watch",
                params={"session_id": self.session_id},
                json={"watched_minutes": watched_minutes}
            )
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_test(
                        "POST /api/videos/{video_id}/watch",
                        True,
                        f"Successfully recorded {watched_minutes} minutes of watch progress",
                        {"video_id": video_id, "session_id": self.session_id, "watched_minutes": watched_minutes}
                    )
                else:
                    self.log_test(
                        "POST /api/videos/{video_id}/watch",
                        False,
                        "Unexpected response format",
                        {"response": data}
                    )
            else:
                self.log_test(
                    "POST /api/videos/{video_id}/watch",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    {"video_id": video_id, "session_id": self.session_id}
                )
        except Exception as e:
            self.log_test(
                "POST /api/videos/{video_id}/watch",
                False,
                f"Request failed: {str(e)}",
                {"video_id": video_id, "session_id": self.session_id}
            )
    
    def test_watch_progress_invalid_video(self):
        """Test watch progress with invalid video ID"""
        invalid_id = "invalid-video-id-123"
        
        try:
            response = requests.post(
                f"{BACKEND_URL}/videos/{invalid_id}/watch",
                params={"session_id": self.session_id},
                json={"watched_minutes": 5}
            )
            
            if response.status_code == 404:
                self.log_test(
                    "POST /api/videos/{invalid_id}/watch - Error Handling",
                    True,
                    "Correctly returned 404 for invalid video ID",
                    {"invalid_id": invalid_id}
                )
            else:
                self.log_test(
                    "POST /api/videos/{invalid_id}/watch - Error Handling",
                    False,
                    f"Expected 404, got {response.status_code}",
                    {"invalid_id": invalid_id, "response": response.text}
                )
        except Exception as e:
            self.log_test(
                "POST /api/videos/{invalid_id}/watch - Error Handling",
                False,
                f"Request failed: {str(e)}",
                {"invalid_id": invalid_id}
            )
    
    def test_multiple_watch_sessions(self):
        """Test multiple watch sessions for progress tracking"""
        if not self.sample_videos:
            self.log_test(
                "Multiple Watch Sessions",
                False,
                "No sample videos available for testing"
            )
            return
        
        # Watch multiple videos with different durations
        watch_sessions = [
            {"video_idx": 0, "minutes": 8},  # Complete first video
            {"video_idx": 1, "minutes": 10}, # Partial second video
            {"video_idx": 2, "minutes": 15}  # Partial third video
        ]
        
        success_count = 0
        for session in watch_sessions:
            if session["video_idx"] < len(self.sample_videos):
                video = self.sample_videos[session["video_idx"]]
                video_id = video['id']
                
                try:
                    response = requests.post(
                        f"{BACKEND_URL}/videos/{video_id}/watch",
                        params={"session_id": self.session_id},
                        json={"watched_minutes": session["minutes"]}
                    )
                    
                    if response.status_code == 200:
                        success_count += 1
                    
                    # Small delay between requests
                    time.sleep(0.5)
                    
                except Exception as e:
                    pass
        
        if success_count == len(watch_sessions):
            self.log_test(
                "Multiple Watch Sessions",
                True,
                f"Successfully recorded {success_count} watch sessions",
                {"sessions": watch_sessions, "session_id": self.session_id}
            )
        else:
            self.log_test(
                "Multiple Watch Sessions",
                False,
                f"Only {success_count}/{len(watch_sessions)} sessions recorded successfully",
                {"sessions": watch_sessions, "session_id": self.session_id}
            )
    
    def test_progress_statistics(self):
        """Test progress statistics retrieval"""
        try:
            response = requests.get(f"{BACKEND_URL}/progress/{self.session_id}")
            
            if response.status_code == 200:
                data = response.json()
                stats = data.get('stats', {})
                recent_activity = data.get('recent_activity', [])
                total_videos = data.get('total_videos_watched', 0)
                
                # Check if stats contain expected fields
                expected_fields = ['total_minutes_watched', 'current_streak', 'longest_streak', 
                                 'personal_best_day', 'level_progress', 'milestones_achieved']
                
                missing_fields = [field for field in expected_fields if field not in stats]
                
                if not missing_fields and isinstance(recent_activity, list):
                    self.log_test(
                        "GET /api/progress/{session_id}",
                        True,
                        f"Retrieved progress stats: {stats.get('total_minutes_watched', 0)} minutes watched",
                        {
                            "total_minutes": stats.get('total_minutes_watched', 0),
                            "current_streak": stats.get('current_streak', 0),
                            "total_videos": total_videos,
                            "milestones": stats.get('milestones_achieved', [])
                        }
                    )
                else:
                    self.log_test(
                        "GET /api/progress/{session_id}",
                        False,
                        f"Missing required fields: {missing_fields}",
                        {"response": data, "missing_fields": missing_fields}
                    )
            else:
                self.log_test(
                    "GET /api/progress/{session_id}",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    {"session_id": self.session_id}
                )
        except Exception as e:
            self.log_test(
                "GET /api/progress/{session_id}",
                False,
                f"Request failed: {str(e)}",
                {"session_id": self.session_id}
            )
    
    def test_progress_invalid_session(self):
        """Test progress retrieval with invalid session ID"""
        invalid_session = "invalid-session-id-123"
        
        try:
            response = requests.get(f"{BACKEND_URL}/progress/{invalid_session}")
            
            if response.status_code == 200:
                data = response.json()
                stats = data.get('stats', {})
                
                # Should return empty/default stats for invalid session
                if stats.get('total_minutes_watched', 0) == 0:
                    self.log_test(
                        "GET /api/progress/{invalid_session} - Error Handling",
                        True,
                        "Correctly returned empty stats for invalid session",
                        {"invalid_session": invalid_session, "stats": stats}
                    )
                else:
                    self.log_test(
                        "GET /api/progress/{invalid_session} - Error Handling",
                        False,
                        "Should return empty stats for invalid session",
                        {"invalid_session": invalid_session, "stats": stats}
                    )
            else:
                self.log_test(
                    "GET /api/progress/{invalid_session} - Error Handling",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    {"invalid_session": invalid_session}
                )
        except Exception as e:
            self.log_test(
                "GET /api/progress/{invalid_session} - Error Handling",
                False,
                f"Request failed: {str(e)}",
                {"invalid_session": invalid_session}
            )
    
    def test_filter_options(self):
        """Test filter options endpoint"""
        try:
            response = requests.get(f"{BACKEND_URL}/filters/options")
            
            if response.status_code == 200:
                data = response.json()
                expected_keys = ['levels', 'categories', 'accents', 'guides', 'countries']
                
                missing_keys = [key for key in expected_keys if key not in data]
                
                if not missing_keys:
                    # Check if each option list has content
                    empty_lists = [key for key in expected_keys if not data[key]]
                    
                    if not empty_lists:
                        self.log_test(
                            "GET /api/filters/options",
                            True,
                            "Retrieved all filter options successfully",
                            {
                                "levels_count": len(data['levels']),
                                "categories_count": len(data['categories']),
                                "accents_count": len(data['accents']),
                                "guides_count": len(data['guides']),
                                "countries_count": len(data['countries'])
                            }
                        )
                    else:
                        self.log_test(
                            "GET /api/filters/options",
                            False,
                            f"Empty option lists: {empty_lists}",
                            {"response": data, "empty_lists": empty_lists}
                        )
                else:
                    self.log_test(
                        "GET /api/filters/options",
                        False,
                        f"Missing required keys: {missing_keys}",
                        {"response": data, "missing_keys": missing_keys}
                    )
            else:
                self.log_test(
                    "GET /api/filters/options",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_test(
                "GET /api/filters/options",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_sample_data_validation(self):
        """Validate sample data content and structure"""
        if not self.sample_videos:
            self.log_test(
                "Sample Data Validation",
                False,
                "No sample videos available for validation"
            )
            return
        
        required_fields = ['id', 'title', 'description', 'thumbnail_url', 'video_url', 
                          'duration_minutes', 'level', 'category', 'accent', 'guide', 
                          'country', 'is_premium']
        
        validation_errors = []
        
        for i, video in enumerate(self.sample_videos):
            missing_fields = [field for field in required_fields if field not in video]
            if missing_fields:
                validation_errors.append(f"Video {i+1} missing fields: {missing_fields}")
            
            # Check data types and values
            if 'duration_minutes' in video and not isinstance(video['duration_minutes'], int):
                validation_errors.append(f"Video {i+1} duration_minutes should be integer")
            
            if 'is_premium' in video and not isinstance(video['is_premium'], bool):
                validation_errors.append(f"Video {i+1} is_premium should be boolean")
        
        if not validation_errors:
            self.log_test(
                "Sample Data Validation",
                True,
                f"All {len(self.sample_videos)} sample videos have valid structure",
                {"video_count": len(self.sample_videos)}
            )
        else:
            self.log_test(
                "Sample Data Validation",
                False,
                f"Found {len(validation_errors)} validation errors",
                {"errors": validation_errors}
            )
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting English Fiesta Backend API Tests")
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Test Session ID: {self.session_id}")
        print("=" * 60)
        
        # Test sequence
        self.test_get_videos_basic()
        self.test_sample_data_validation()
        self.test_video_filtering()
        self.test_get_specific_video()
        self.test_invalid_video_id()
        self.test_filter_options()
        self.test_watch_progress_recording()
        self.test_watch_progress_invalid_video()
        self.test_multiple_watch_sessions()
        self.test_progress_statistics()
        self.test_progress_invalid_session()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        failed = len(self.test_results) - passed
        
        print(f"Total Tests: {len(self.test_results)}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Success Rate: {(passed/len(self.test_results)*100):.1f}%")
        
        if failed > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  • {result['test']}: {result['message']}")
        
        return {
            "total": len(self.test_results),
            "passed": passed,
            "failed": failed,
            "success_rate": passed/len(self.test_results)*100,
            "results": self.test_results
        }

if __name__ == "__main__":
    tester = EnglishFiestaAPITester()
    results = tester.run_all_tests()
    
    # Save detailed results to file
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    print(f"\n📄 Detailed results saved to: /app/backend_test_results.json")