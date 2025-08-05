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

const VideoPlayer = ({ video, onClose, onVideoEnd, relatedVideos = [], onVideoSelect, debug = false }) => {
  const { isAuthenticated, sessionToken, isStudent } = useAuth();
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [watchedMinutes, setWatchedMinutes] = useState(0);
  const [sessionId] = useState(getSessionId());
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [videoError, setVideoError] = useState(null);
  
  const watchedMinutesRef = useRef(new Set());
  const playerRef = useRef(null);
  const trackingIntervalRef = useRef(null);
  const lastTrackedMinute = useRef(0);
  const mountedRef = useRef(false);

  // Debug logging
  useEffect(() => {
    if (debug) console.log('🎬 VideoPlayer mounted for:', video?.title);
    if (debug) console.log('🎥 Video type:', video?.video_type);
    if (debug) console.log('📹 Video URL:', video?.video_url);
    mountedRef.current = true;
    
    return () => {
      if (debug) console.log('🎬 VideoPlayer unmounting');
      mountedRef.current = false;
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, [video, debug]);

  // Initialize toast for guest users
  useEffect(() => {
    if (!isAuthenticated) {
      setShowToast(true);
    }
  }, [isAuthenticated]);

  // Vime Event Handlers - Fixed with proper error handling
  const handleTimeUpdate = (e) => {
    if (!mountedRef.current) return;
    
    const newTime = Math.floor(e.detail?.currentTime || 0);
    setCurrentTime(newTime);
    if (debug) console.log('📌 Current Time:', newTime);

    // Track new seconds watched for accurate minutes-watched tracking
    if (!watchedMinutesRef.current.has(newTime)) {
      watchedMinutesRef.current.add(newTime);
      if (debug) console.log('✅ New second logged:', newTime);
    }
  };

  const handleVimePlay = () => {
    if (debug) console.log('▶️ Video playing');
    setPlaying(true);
  };

  const handleVimePause = () => {
    if (debug) console.log('⏸️ Video paused');
    setPlaying(false);
  };

  const handleVimeEnd = () => {
    if (debug) console.log('🏁 Video ended');
    setPlaying(false);
    if (onVideoEnd) {
      onVideoEnd();
    }
  };

  const handleVimeDurationChange = (e) => {
    const newDuration = e.detail?.duration || 0;
    setDuration(newDuration);
    if (debug) console.log('⏱️ Duration set:', newDuration);
  };

  const handleVimeReady = () => {
    setPlayerReady(true);
    if (debug) console.log('🎯 Vime player ready');
  };

  const handleVimeError = (e) => {
    const error = e.detail || 'Unknown video error';
    setVideoError(error);
    if (debug) console.error('❌ Video error:', error);
  };

  // Handle next video functionality
  const handleNextVideo = (nextVideo) => {
    if (nextVideo && typeof nextVideo === 'object') {
      if (debug) console.log('➡️ Loading next video:', nextVideo.title);
      if (onVideoSelect) {
        onVideoSelect(nextVideo);
      } else {
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

            {/* Vime Video Player for Local Videos - FIXED VERSION */}
            {video.video_type !== 'youtube' && (
              <div className="aspect-video relative bg-black">
                {/* Debug Overlay */}
                {debug && (
                  <div className="absolute top-4 left-4 z-50 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
                    <div>🎯 Player Ready: {playerReady ? '✅' : '❌'}</div>
                    <div>⏰ Time: {Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}</div>
                    <div>📏 Duration: {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}</div>
                    <div>▶️ Playing: {playing ? '✅' : '❌'}</div>
                    <div>📹 URL: {video.video_url || `/api/files/videos/${video.id}.mp4`}</div>
                    {videoError && <div>❌ Error: {videoError}</div>}
                  </div>
                )}

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
                  onVmReady={handleVimeReady}
                  onVmLoadStart={() => debug && console.log('🔄 Load start')}
                  onVmCanPlay={() => debug && console.log('✅ Can play')}
                  onVmError={handleVimeError}
                  className="w-full h-full"
                >
                  <Video 
                    crossOrigin=""
                    preload="metadata"
                    poster={video.thumbnail_url ? `${BACKEND_URL}${video.thumbnail_url}` : undefined}
                  >
                    {/* CRITICAL FIX: Use src instead of data-src */}
                    <source 
                      src={`${BACKEND_URL}${video.video_url || `/api/files/videos/${video.id}.mp4`}`}
                      type="video/mp4" 
                    />
                    <track kind="captions" />
                  </Video>
                  <DefaultUi />
                </Player>

                {/* Loading State */}
                {!playerReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="text-white text-center">
                      <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                      <div className="text-sm">Loading video...</div>
                    </div>
                  </div>
                )}

                {/* Error State */}
                {videoError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-50">
                    <div className="text-white text-center p-4">
                      <div className="text-2xl mb-2">⚠️</div>
                      <div className="text-sm">Video failed to load</div>
                      <button 
                        onClick={() => window.location.reload()}
                        className="mt-2 px-4 py-2 bg-white text-black rounded text-sm"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                )}
              </div>
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