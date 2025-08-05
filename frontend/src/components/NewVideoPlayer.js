import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import MarkAsWatchedModal from './MarkAsWatchedModal';
import CommentList from './CommentList';
import VideoSidebar from './VideoSidebar';
import ProgressTrackingToast from './ProgressTrackingToast';

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

const NewVideoPlayer = ({ video, onClose, onVideoEnd, relatedVideos = [], onVideoSelect, debug = false }) => {
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
  const [fullscreen, setFullscreen] = useState(false);
  
  const watchedMinutesRef = useRef(new Set());
  const videoRef = useRef(null);
  const trackingIntervalRef = useRef(null);
  const lastTrackedMinute = useRef(0);
  const mountedRef = useRef(false);
  const youtubePlayerRef = useRef(null);

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

  // YouTube Player Setup
  useEffect(() => {
    if (video.video_type === 'youtube' && video.youtube_video_id) {
      // Load YouTube IFrame API
      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        
        window.onYouTubeIframeAPIReady = () => {
          initYouTubePlayer();
        };
      } else {
        initYouTubePlayer();
      }
    }
  }, [video]);

  const initYouTubePlayer = () => {
    if (youtubePlayerRef.current) {
      youtubePlayerRef.current = new window.YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: video.youtube_video_id,
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1
        },
        events: {
          onReady: handleYouTubeReady,
          onStateChange: handleYouTubeStateChange,
          onError: handleYouTubeError
        }
      });
    }
  };

  const handleYouTubeReady = (event) => {
    setPlayerReady(true);
    setDuration(event.target.getDuration());
    if (debug) console.log('🎯 YouTube player ready');
  };

  const handleYouTubeStateChange = (event) => {
    const state = event.data;
    if (state === window.YT.PlayerState.PLAYING) {
      setPlaying(true);
      if (debug) console.log('▶️ YouTube playing');
    } else if (state === window.YT.PlayerState.PAUSED) {
      setPlaying(false);
      if (debug) console.log('⏸️ YouTube paused');
    } else if (state === window.YT.PlayerState.ENDED) {
      setPlaying(false);
      if (debug) console.log('🏁 YouTube ended');
      if (onVideoEnd) onVideoEnd();
    }
  };

  const handleYouTubeError = (event) => {
    setVideoError(`YouTube error: ${event.data}`);
    if (debug) console.error('❌ YouTube error:', event.data);
  };

  // HTML5 Video Event Handlers
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setPlayerReady(true);
      if (debug) console.log('🎯 HTML5 player ready');
    }
  };

  const handleTimeUpdate = () => {
    if (!mountedRef.current || !videoRef.current) return;
    
    const newTime = Math.floor(videoRef.current.currentTime);
    setCurrentTime(newTime);
    if (debug) console.log('📌 Current Time:', newTime);

    // Track new seconds watched for accurate minutes-watched tracking
    if (!watchedMinutesRef.current.has(newTime)) {
      watchedMinutesRef.current.add(newTime);
      if (debug) console.log('✅ New second logged:', newTime);
    }
  };

  const handlePlay = () => {
    setPlaying(true);
    if (debug) console.log('▶️ HTML5 video playing');
  };

  const handlePause = () => {
    setPlaying(false);
    if (debug) console.log('⏸️ HTML5 video paused');
  };

  const handleEnded = () => {
    setPlaying(false);
    if (debug) console.log('🏁 HTML5 video ended');
    if (onVideoEnd) onVideoEnd();
  };

  const handleError = () => {
    setVideoError('Video failed to load');
    if (debug) console.error('❌ HTML5 video error');
  };

  // YouTube current time tracking
  useEffect(() => {
    if (video.video_type === 'youtube' && youtubePlayerRef.current && playing) {
      const interval = setInterval(() => {
        if (youtubePlayerRef.current && youtubePlayerRef.current.getCurrentTime) {
          const newTime = Math.floor(youtubePlayerRef.current.getCurrentTime());
          setCurrentTime(newTime);
          
          // Track new seconds
          if (!watchedMinutesRef.current.has(newTime)) {
            watchedMinutesRef.current.add(newTime);
            if (debug) console.log('✅ YouTube second logged:', newTime);
          }
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [video.video_type, playing, debug]);

  // Watch time tracking
  useEffect(() => {
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
    if (!isAuthenticated || !mountedRef.current) return;

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
        if (debug) console.log('📊 Tracked minute:', currentMinute + 1);
      } catch (error) {
        console.error('Error tracking watch time:', error);
      }
    }
  };

  // Handle fullscreen
  const toggleFullscreen = () => {
    const element = videoRef.current || document.getElementById('youtube-player');
    if (!element) return;

    if (!fullscreen) {
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    setFullscreen(!fullscreen);
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
              <div className="aspect-video relative">
                <div id="youtube-player" className="w-full h-full"></div>
                
                {/* Loading State */}
                {!playerReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="text-white text-center">
                      <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                      <div className="text-sm">Loading YouTube player...</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* HTML5 Video Player for Local Videos */}
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

                <video
                  ref={videoRef}
                  className="w-full h-full"
                  controls
                  playsInline
                  preload="metadata"
                  poster={video.thumbnail_url ? `${BACKEND_URL}${video.thumbnail_url}` : undefined}
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={handleTimeUpdate}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onEnded={handleEnded}
                  onError={handleError}
                >
                  <source
                    src={`${BACKEND_URL}${video.video_url || `/api/files/videos/${video.id}.mp4`}`}
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>

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

export default NewVideoPlayer;