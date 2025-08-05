import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import MarkAsWatchedModal from './MarkAsWatchedModal';
import CommentList from './CommentList';
import VideoSidebar from './VideoSidebar';
import ProgressTrackingToast from './ProgressTrackingToast';
import {
  Player,
  Video,
  DefaultUi
} from '@vime/react';
import '@vime/core/themes/default.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Generate or get session ID for guest users
const getSessionId = () => {
  let sessionId = localStorage.getItem('english_fiesta_session');
  if (!sessionId) {
    sessionId = 'guest_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('english_fiesta_session', sessionId);
  }
  return sessionId;
};

const VideoPlayer = ({ video, onClose, onVideoEnd, relatedVideos = [], onVideoSelect }) => {
  const { isAuthenticated, sessionToken, isStudent } = useAuth();
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [watchedMinutes, setWatchedMinutes] = useState(0);
  const [sessionId] = useState(getSessionId());
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [isInList, setIsInList] = useState(false);
  const [isManagingList, setIsManagingList] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  
  const watchedMinutesRef = useRef(new Set());
  const playerRef = useRef(null);
  const trackingIntervalRef = useRef(null);
  const lastTrackedMinute = useRef(0);

  // Check if video is in user's list on component mount
  useEffect(() => {
    if (isAuthenticated && isStudent) {
      checkVideoInList();
    }
    checkVideoWatchedStatus();
  }, [isAuthenticated, isStudent, video.id]);

  const checkVideoWatchedStatus = async () => {
    try {
      const headers = sessionToken ? 
        { 'Authorization': `Bearer ${sessionToken}` } : {};
      
      const response = await axios.get(`${API}/progress/${sessionId}`, {
        headers
      });
      
      const progressData = response.data;
      const watchedVideo = progressData.recent_activity?.find(
        activity => activity.video_id === video.id && activity.completed
      );
      
      setIsWatched(!!watchedVideo);
    } catch (error) {
      console.error('Error checking video watched status:', error);
    }
  };

  const checkVideoInList = async () => {
    try {
      const headers = sessionToken ? 
        { 'Authorization': `Bearer ${sessionToken}` } : {};
      
      const response = await axios.get(`${API}/user/list/status/${video.id}`, {
        headers
      });
      
      setIsInList(response.data.in_list);
    } catch (error) {
      console.error('Error checking video list status:', error);
    }
  };

  useEffect(() => {
    // Start tracking when video starts playing (only for authenticated users)
    if (playing && isAuthenticated) {
      trackingIntervalRef.current = setInterval(() => {
        trackWatchTime();
      }, 5000); // Track every 5 seconds
    } else {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    }

    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, [playing, isAuthenticated]);

  const trackWatchTime = async () => {
    if (!playerRef.current || !isAuthenticated) return;

    const currentMinute = Math.floor(currentTime / 60);
    
    // Only track if we've watched a new minute
    if (currentMinute > lastTrackedMinute.current) {
      lastTrackedMinute.current = currentMinute;
      
      try {
        const headers = sessionToken ? 
          { 'Authorization': `Bearer ${sessionToken}` } : {};
        
        await axios.post(`${API}/videos/${video.id}/watch`, {
          watched_minutes: currentMinute + 1 // Track the completed minute
        }, {
          params: { session_id: sessionId },
          headers
        });

        setWatchedMinutes(currentMinute + 1);
      } catch (error) {
        console.error('Error tracking watch time:', error);
      }
    }
  };

  // Vime Event Handlers
  const handleTimeUpdate = (e) => {
    const currentTime = Math.floor(e.detail.currentTime);
    setCurrentTime(currentTime);
    console.log('📌 Current Time:', currentTime);

    // Track new seconds watched for accurate minutes-watched tracking
    if (!watchedMinutesRef.current.has(currentTime)) {
      watchedMinutesRef.current.add(currentTime);
      console.log('✅ New second logged:', currentTime);
    }
  };

  const handleVimePlay = () => {
    console.log('▶️ Video playing');
    setPlaying(true);
    setShowOverlay(false);
  };

  const handleVimePause = () => {
    console.log('⏸️ Video paused');
    setPlaying(false);
  };

  const handleVimeEnd = () => {
    console.log('🏁 Video ended');
    setPlaying(false);
    if (onVideoEnd) {
      onVideoEnd();
    }
  };

  const handleVimeDurationChange = (e) => {
    const duration = e.detail.duration;
    setDuration(duration);
    console.log('⏱️ Duration set:', duration);
  };

  // Handle next video functionality
  const handleNextVideo = (nextVideo) => {
    if (nextVideo && typeof nextVideo === 'object') {
      console.log('➡️ Loading next video:', nextVideo.title);
      // If onVideoSelect is provided, use it to switch videos
      if (onVideoSelect) {
        onVideoSelect(nextVideo);
      } else {
        // Fallback: close player and let parent handle
        onClose();
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMarkAsWatched = () => {
    if (isWatched) {
      handleUnmarkAsWatched();
    } else {
      setShowMarkModal(true);
    }
  };

  const handleUnmarkAsWatched = async () => {
    if (isToggling) return;
    
    setIsToggling(true);
    
    try {
      const headers = sessionToken ? 
        { 'Authorization': `Bearer ${sessionToken}` } : {};
      
      await axios.post(`${API}/user/unmark-watched`, {
        video_id: video.id
      }, {
        params: { session_id: sessionId },
        headers
      });

      setIsWatched(false);
    } catch (error) {
      console.error('Error unmarking video as watched:', error);
      alert(error.response?.data?.detail || 'Failed to unmark video. Please try again.');
    } finally {
      setIsToggling(false);
    }
  };

  const handleMarkModalSuccess = () => {
    setIsWatched(true);
  };

  const handleToggleMyList = async () => {
    if (!isAuthenticated || !isStudent || isManagingList) return;
    
    setIsManagingList(true);
    
    try {
      const headers = { 'Authorization': `Bearer ${sessionToken}` };
      
      if (isInList) {
        // Remove from list
        await axios.delete(`${API}/user/list/${video.id}`, { headers });
        setIsInList(false);
      } else {
        // Add to list
        await axios.post(`${API}/user/list`, {
          video_id: video.id
        }, { headers });
        setIsInList(true);
      }
    } catch (error) {
      console.error('Error managing video list:', error);
      alert(error.response?.data?.detail || 'Failed to update your list. Please try again.');
    } finally {
      setIsManagingList(false);
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-start justify-center overflow-y-auto">
      <div className="w-full max-w-7xl bg-white min-h-full">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-60 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>

        {/* Main Video Container with Sidebar */}
        <div className="flex flex-col md:flex-row gap-4 bg-black">
          {/* Video Player Section */}
          <div className="flex-1 sticky top-0 z-10 bg-black">
            {/* YouTube Video */}
            {video.video_type === 'youtube' && video.youtube_video_id && (
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${video.youtube_video_id}?autoplay=1&rel=0`}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={video.title}
                />
              </div>
            )}

            {/* Vime Video Player for Local Videos */}
            {video.video_type !== 'youtube' && (
              <Player
                ref={playerRef}
                autoplay={false}
                controls={true}
                playsInline={true}
                onVmTimeUpdate={handleTimeUpdate}
                onVmPlay={handleVimePlay}
                onVmPause={handleVimePause}
                onVmEnded={handleVimeEnd}
                onVmDurationChange={handleVimeDurationChange}
                className="aspect-video"
              >
                <Video 
                  crossOrigin="" 
                  poster={video.thumbnail_url ? `${BACKEND_URL}${video.thumbnail_url}` : undefined}
                >
                  <source 
                    data-src={`${BACKEND_URL}${video.video_url || `/api/files/videos/${video.id}.mp4`}`}
                    type="video/mp4" 
                  />
                </Video>
                <DefaultUi />
              </Player>
            )}

            {/* Video Info Overlay */}
            {showOverlay && (
              <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-4 rounded-lg max-w-md">
                {/* Close Overlay Button */}
                <button
                  onClick={() => setShowOverlay(false)}
                  className="absolute top-2 right-2 text-white hover:text-gray-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
                
                <h2 className="text-xl font-bold mb-2">{video.title}</h2>
                <div className="text-sm space-y-1">
                  <div>👨‍🏫 {video.instructor_name}</div>
                  <div>📊 {video.level}</div>
                  <div>🌍 {video.country}</div>
                  {video.accents && video.accents.length > 0 && (
                    <div>🗣️ {video.accents.join(', ')}</div>
                  )}
                  <div>⏱️ {video.duration_minutes} minutes</div>
                  {video.is_premium && <div>💎 Premium Content</div>}
                </div>
                
                {/* Action Buttons */}
                <div className="mt-3 flex gap-2">
                  {/* Mark as Watched/Unwatched Button */}
                  <button
                    onClick={handleMarkAsWatched}
                    disabled={isToggling}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors disabled:opacity-50 ${
                      isWatched 
                        ? 'bg-green-500 bg-opacity-80 hover:bg-opacity-100 text-white' 
                        : 'bg-white bg-opacity-20 hover:bg-opacity-30 text-white'
                    }`}
                    title={isWatched ? "Mark as unwatched" : "Mark as watched"}
                  >
                    {isToggling ? '...' : (isWatched ? '✓ Watched' : '+ Watched')}
                  </button>
                  
                  {/* Add to My List Button (only for authenticated students+) */}
                  {isAuthenticated && isStudent && (
                    <button
                      onClick={handleToggleMyList}
                      disabled={isManagingList}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors disabled:opacity-50 ${
                        isInList 
                          ? 'bg-red-500 bg-opacity-80 hover:bg-opacity-100 text-white' 
                          : 'bg-blue-500 bg-opacity-80 hover:bg-opacity-100 text-white'
                      }`}
                      title={isInList ? "Remove from My List" : "Add to My List"}
                    >
                      {isManagingList ? '...' : (isInList ? '✕ Remove' : '+ My List')}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Progress Tracking Info */}
            <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-sm">
              {isAuthenticated ? (
                <span className="text-green-400">⏱️ Tracking: {Math.floor(watchedMinutesRef.current.size / 60)}min</span>
              ) : (
                <span className="text-gray-400">⏱️ Not tracking</span>
              )}
            </div>

            {/* Guest Tracking Notice */}
            {!isAuthenticated && (
              <div className="absolute bottom-20 left-4 right-4 bg-blue-600 text-white p-3 rounded-lg text-center">
                <div className="font-semibold mb-1">🔐 Want to track your progress?</div>
                <div className="text-sm">Sign up to save your watch time and unlock the Progress tab!</div>
              </div>
            )}
          </div>

          {/* Sidebar for Related Videos */}
          <aside className="w-full md:w-80 bg-gray-900 text-white p-4 max-h-screen overflow-y-auto">
            <h2 className="text-lg font-bold mb-4 text-fiesta-yellow">🌟 Related Videos</h2>
            
            {/* Related Videos List */}
            {relatedVideos.length > 0 ? (
              <div className="space-y-3">
                {relatedVideos.slice(0, 8).map((relatedVideo, index) => (
                  <button
                    key={relatedVideo.id}
                    onClick={() => handleNextVideo(relatedVideo)}
                    className="w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors group"
                  >
                    <div className="flex gap-3">
                      {relatedVideo.thumbnail_url && (
                        <img 
                          src={`${BACKEND_URL}${relatedVideo.thumbnail_url}`}
                          alt={relatedVideo.title}
                          className="w-16 h-12 object-cover rounded flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-fiesta-yellow transition-colors">
                          {relatedVideo.title}
                        </h3>
                        <div className="text-xs text-gray-400 mt-1 space-y-1">
                          <div>👨‍🏫 {relatedVideo.instructor_name}</div>
                          <div>📊 {relatedVideo.level} • ⏱️ {relatedVideo.duration_minutes}min</div>
                          {relatedVideo.is_premium && <span className="text-fiesta-yellow">💎 Premium</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <div className="text-4xl mb-3">📺</div>
                <p className="text-sm">No related videos available</p>
                <p className="text-xs mt-1">Browse the video library for more content</p>
              </div>
            )}

            {/* Playback Stats */}
            <div className="mt-6 p-3 bg-gray-800 rounded-lg">
              <h3 className="text-sm font-semibold mb-2 text-fiesta-blue">📊 Session Stats</h3>
              <div className="text-xs space-y-1">
                <div>⏱️ Current Time: {formatTime(currentTime)}</div>
                <div>📏 Duration: {formatTime(duration)}</div>
                <div>📈 Progress: {Math.round(progress)}%</div>
                <div>✅ Seconds Watched: {watchedMinutesRef.current.size}</div>
              </div>
            </div>
          </aside>
        </div>

        {/* Video Details and Comments Section */}
        <div className="bg-white p-6">
          {/* Video Title and Description */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4 font-baloo">{video.title}</h1>
            <div className="flex flex-wrap gap-4 mb-4">
              <span className="bg-fiesta-blue text-white px-3 py-1 rounded-full text-sm font-poppins">
                📊 {video.level}
              </span>
              <span className="bg-fiesta-green text-white px-3 py-1 rounded-full text-sm font-poppins">
                📂 {video.category}
              </span>
              <span className="bg-fiesta-purple text-white px-3 py-1 rounded-full text-sm font-poppins">
                👨‍🏫 {video.instructor_name}
              </span>
              <span className="bg-fiesta-orange text-white px-3 py-1 rounded-full text-sm font-poppins">
                🌍 {video.country}
              </span>
              {video.is_premium && (
                <span className="bg-fiesta-yellow text-gray-800 px-3 py-1 rounded-full text-sm font-poppins font-bold">
                  💎 Premium
                </span>
              )}
            </div>
            <p className="text-gray-600 leading-relaxed font-poppins">{video.description}</p>
          </div>

          {/* Comments Section */}
          <CommentList videoId={video.id} />
        </div>
      </div>
      
      {/* Mark as Watched Modal */}
      <MarkAsWatchedModal
        video={video}
        isOpen={showMarkModal}
        onClose={() => setShowMarkModal(false)}
        onSuccess={handleMarkModalSuccess}
      />
    </div>
  );
};

export default VideoPlayer;