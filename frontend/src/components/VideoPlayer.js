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
  const [showToast, setShowToast] = useState(false);
  
  const watchedMinutesRef = useRef(new Set());
  const playerRef = useRef(null);
  const trackingIntervalRef = useRef(null);
  const lastTrackedMinute = useRef(0);

  // Debug logging
  useEffect(() => {
    console.log('🎬 VideoPlayer mounted for:', video?.title);
    console.log('🎥 Video type:', video?.video_type);
    console.log('📹 Video URL:', video?.video_url);
    return () => {
      console.log('🎬 VideoPlayer unmounting');
    };
  }, [video]);

  // Initialize toast for guest users
  useEffect(() => {
    if (!isAuthenticated) {
      setShowToast(true);
    }
  }, [isAuthenticated]);

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

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-start justify-center overflow-y-auto">
      <div className="w-full max-w-7xl bg-white min-h-full relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
          style={{ zIndex: 9999 }}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>

        {/* Main Video Container with Sidebar */}
        <div className="flex flex-col md:flex-row gap-4 bg-black">
          {/* Video Player Section - Clean, No Overlays */}
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

            {/* Vime Video Player for Local Videos - Clean Interface */}
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
          </div>

          {/* Enhanced Sidebar with All Functionality */}
          <VideoSidebar
            currentVideo={video}
            relatedVideos={relatedVideos}
            onVideoSelect={handleNextVideo}
            currentTime={currentTime}
            duration={duration}
            progress={progress}
            watchedSeconds={watchedMinutesRef.current.size}
          />
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
      
      {/* Smart Progress Tracking Toast for Guest Users */}
      <ProgressTrackingToast
        isVisible={showToast && !isAuthenticated}
        watchTime={watchedMinutesRef.current.size}
        onDismiss={() => setShowToast(false)}
      />
      
      {/* Mark as Watched Modal (if needed by sidebar) */}
      <MarkAsWatchedModal
        video={video}
        isOpen={showMarkModal}
        onClose={() => setShowMarkModal(false)}
        onSuccess={() => {
          // Refresh sidebar data when modal succeeds
          setShowMarkModal(false);
        }}
      />
    </div>
  );
};

export default VideoPlayer;