import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import MarkAsWatchedModal from './MarkAsWatchedModal';
import CommentList from './CommentList';

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

const VideoPlayer = ({ video, onClose, onVideoEnd }) => {
  const { isAuthenticated, sessionToken, isStudent } = useAuth();
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [watchedMinutes, setWatchedMinutes] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sessionId] = useState(getSessionId());
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [isInList, setIsInList] = useState(false);
  const [isManagingList, setIsManagingList] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  
  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);
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
    if (!videoRef.current || !isAuthenticated) return;

    const currentMinute = Math.floor(videoRef.current.currentTime / 60);
    
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

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setPlaying(true);
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleEnded = () => {
    setPlaying(false);
    if (onVideoEnd) {
      onVideoEnd();
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (playerContainerRef.current.requestFullscreen) {
        playerContainerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
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
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div 
        ref={playerContainerRef}
        className="relative w-full max-w-6xl mx-4 bg-black rounded-lg overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Video Element */}
        <div className="relative">
          {video.video_type === 'youtube' ? (
            /* YouTube Embed */
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${video.youtube_video_id}?autoplay=1&rel=0`}
                title={video.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            /* Local Video File */
            <video
              ref={videoRef}
              className="w-full h-auto max-h-screen"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleEnded}
              onClick={playing ? handlePause : handlePlay}
            >
              <source src={video.video_url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}

          {/* Custom Controls (only for local videos) */}
          {video.video_type !== 'youtube' && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
              {/* Progress Bar */}
              <div 
                className="w-full h-2 bg-gray-600 rounded-full cursor-pointer mb-4"
                onClick={handleSeek}
              >
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Control Bar */}
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-4">
                  {/* Play/Pause Button */}
                  <button
                    onClick={playing ? handlePause : handlePlay}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                  >
                    {playing ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </button>

                  {/* Time Display */}
                  <span className="text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-2">
                  {/* Tracking Status */}
                  {isAuthenticated ? (
                    <span className="text-sm bg-green-600 px-2 py-1 rounded">
                      ⏱️ Tracking: {watchedMinutes}min
                    </span>
                  ) : (
                    <span className="text-sm bg-gray-600 px-2 py-1 rounded">
                      ⏱️ Not tracking
                    </span>
                  )}

                  {/* Fullscreen Button */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Video Info Overlay */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-4 rounded-lg max-w-md">
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

        {/* Guest Tracking Notice */}
        {!isAuthenticated && (
          <div className="absolute bottom-20 left-4 right-4 bg-blue-600 text-white p-3 rounded-lg text-center">
            <div className="font-semibold mb-1">🔐 Want to track your progress?</div>
            <div className="text-sm">Sign up to save your watch time and unlock the Progress tab!</div>
          </div>
        )}
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