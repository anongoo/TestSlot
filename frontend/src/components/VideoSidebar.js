import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

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

const VideoSidebar = ({ 
  currentVideo, 
  relatedVideos, 
  onVideoSelect, 
  currentTime, 
  duration, 
  progress, 
  watchedSeconds 
}) => {
  const { isAuthenticated, isStudent, sessionToken } = useAuth();
  const [watchedVideos, setWatchedVideos] = useState(new Set());
  const [isInList, setIsInList] = useState(false);
  const [isManagingList, setIsManagingList] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [sessionId] = useState(getSessionId());

  // Check watched status for all videos
  useEffect(() => {
    if (isAuthenticated) {
      checkWatchedVideos();
      checkCurrentVideoInList();
    }
  }, [isAuthenticated, currentVideo?.id, relatedVideos]);

  const checkWatchedVideos = async () => {
    try {
      const headers = sessionToken ? 
        { 'Authorization': `Bearer ${sessionToken}` } : {};
      
      const response = await axios.get(`${API}/progress/${sessionId}`, {
        headers
      });
      
      const progressData = response.data;
      const watchedIds = new Set();
      
      if (progressData.recent_activity) {
        progressData.recent_activity.forEach(activity => {
          if (activity.completed) {
            watchedIds.add(activity.video_id);
          }
        });
      }
      
      setWatchedVideos(watchedIds);
    } catch (error) {
      console.error('Error checking watched status:', error);
    }
  };

  const checkCurrentVideoInList = async () => {
    if (!currentVideo?.id || !isAuthenticated || !isStudent) return;
    
    try {
      const headers = { 'Authorization': `Bearer ${sessionToken}` };
      const response = await axios.get(`${API}/user/list/status/${currentVideo.id}`, {
        headers
      });
      setIsInList(response.data.in_list);
    } catch (error) {
      console.error('Error checking list status:', error);
    }
  };

  const handleToggleWatched = async (videoId, isCurrentlyWatched) => {
    if (isToggling) return;
    
    setIsToggling(true);
    
    try {
      const headers = sessionToken ? 
        { 'Authorization': `Bearer ${sessionToken}` } : {};
      
      if (isCurrentlyWatched) {
        // Unmark as watched
        await axios.post(`${API}/user/unmark-watched`, {
          video_id: videoId
        }, {
          params: { session_id: sessionId },
          headers
        });
        
        setWatchedVideos(prev => {
          const updated = new Set(prev);
          updated.delete(videoId);
          return updated;
        });
      } else {
        // Mark as watched - this would typically open a modal
        // For now, just mark it as watched with current date
        await axios.post(`${API}/progress/manual`, {
          videoId,
          watchedAt: new Date().toISOString().split('T')[0],
          minutesWatched: currentVideo?.duration_minutes || 30
        }, {
          params: { session_id: sessionId },
          headers
        });
        
        setWatchedVideos(prev => new Set([...prev, videoId]));
      }
    } catch (error) {
      console.error('Error toggling watched status:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleToggleMyList = async () => {
    if (!isAuthenticated || !isStudent || isManagingList || !currentVideo?.id) return;
    
    setIsManagingList(true);
    
    try {
      const headers = { 'Authorization': `Bearer ${sessionToken}` };
      
      if (isInList) {
        await axios.delete(`${API}/user/list/${currentVideo.id}`, { headers });
        setIsInList(false);
      } else {
        await axios.post(`${API}/user/list`, {
          video_id: currentVideo.id
        }, { headers });
        setIsInList(true);
      }
    } catch (error) {
      console.error('Error managing list:', error);
    } finally {
      setIsManagingList(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getFallbackThumbnail = (video) => {
    // Create a simple branded fallback thumbnail without btoa
    return 'data:image/svg+xml;charset=utf8,%3Csvg width="120" height="68" viewBox="0 0 120 68" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="120" height="68" fill="%23f3f4f6"/%3E%3Cg transform="translate(60, 34)"%3E%3Ccircle r="12" fill="%23e5e7eb"/%3E%3Cpolygon points="-4,-6 -4,6 8,0" fill="%236b7280"/%3E%3C/g%3E%3Ctext x="60" y="52" text-anchor="middle" fill="%23374151" font-family="Arial, sans-serif" font-size="8" font-weight="600"%3E' + encodeURIComponent(video.level || 'VIDEO') + '%3C/text%3E%3C/svg%3E';
  };

  const getCountryFlag = (country) => {
    const flags = {
      'USA': '🇺🇸',
      'UK': '🇬🇧', 
      'Canada': '🇨🇦',
      'Australia': '🇦🇺',
      'Spain': '🇪🇸',
      'Mexico': '🇲🇽'
    };
    return flags[country] || '🌍';
  };

  return (
    <aside className="w-full md:w-80 bg-gray-900 text-white p-4 max-h-screen overflow-y-auto">
      {/* Current Video Section */}
      {currentVideo && (
        <div className="mb-6 p-4 bg-gray-800 rounded-xl border-l-4 border-fiesta-yellow">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-semibold text-fiesta-yellow uppercase tracking-wide">Now Playing</span>
          </div>
          
          <h2 className="text-sm font-bold text-white mb-2 line-clamp-2">
            {currentVideo.title}
          </h2>
          
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-300 mb-3">
            <div className="flex items-center gap-1">
              <span>📊</span>
              <span>{currentVideo.level}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>{getCountryFlag(currentVideo.country)}</span>
              <span>{currentVideo.country}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>⏱️</span>
              <span>{currentVideo.duration_minutes}min</span>
            </div>
            <div className="flex items-center gap-1">
              <span>👨‍🏫</span>
              <span className="truncate">{currentVideo.instructor_name}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {/* Watched Status */}
            <button
              onClick={() => handleToggleWatched(currentVideo.id, watchedVideos.has(currentVideo.id))}
              disabled={isToggling}
              className={`flex-1 px-3 py-2 text-xs rounded-lg transition-all duration-200 disabled:opacity-50 ${
                watchedVideos.has(currentVideo.id)
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {isToggling ? '...' : (watchedVideos.has(currentVideo.id) ? '✅ Watched' : '+ Mark Watched')}
            </button>
            
            {/* My List */}
            {isAuthenticated && isStudent && (
              <button
                onClick={handleToggleMyList}
                disabled={isManagingList}
                className={`px-3 py-2 text-xs rounded-lg transition-all duration-200 disabled:opacity-50 ${
                  isInList 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-fiesta-blue hover:bg-blue-600 text-white'
                }`}
              >
                {isManagingList ? '...' : (isInList ? '❤️' : '💙')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Related Videos */}
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-4 text-white">
          🌟 Up Next ({relatedVideos.length})
        </h3>
        
        {relatedVideos.length > 0 ? (
          <div className="space-y-3">
            {relatedVideos.slice(0, 8).map((video, index) => {
              const isWatched = watchedVideos.has(video.id);
              
              return (
                <button
                  key={video.id}
                  onClick={() => onVideoSelect(video)}
                  className="w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-all duration-200 group border border-gray-700 hover:border-gray-600"
                >
                  <div className="flex gap-3">
                    {/* Thumbnail */}
                    <div className="relative flex-shrink-0">
                      <img 
                        src={video.thumbnail_url ? `${BACKEND_URL}${video.thumbnail_url}` : getFallbackThumbnail(video)}
                        alt={video.title}
                        className="w-20 h-12 object-cover rounded"
                        onError={(e) => {
                          e.target.src = getFallbackThumbnail(video);
                        }}
                      />
                      {/* Duration Badge */}
                      <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white px-1 py-0.5 rounded text-xs">
                        {video.duration_minutes}min
                      </div>
                      {/* Watched Indicator */}
                      {isWatched && (
                        <div className="absolute top-1 left-1 bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
                          <span className="text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold line-clamp-2 group-hover:text-fiesta-yellow transition-colors mb-1">
                        {video.title}
                      </h4>
                      
                      <div className="flex items-center gap-3 text-xs text-gray-400 mb-1">
                        <span>📊 {video.level}</span>
                        <span>{getCountryFlag(video.country)} {video.country}</span>
                        {video.is_premium && <span className="text-fiesta-yellow">💎</span>}
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        👨‍🏫 {video.instructor_name}
                      </div>
                      
                      {/* Accents */}
                      {video.accents && video.accents.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          🗣️ {video.accents.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            <div className="text-4xl mb-3">📺</div>
            <p className="text-sm">No related videos available</p>
            <p className="text-xs mt-1">Browse the library for more content</p>
          </div>
        )}
      </div>

      {/* Session Stats */}
      <div className="p-4 bg-gray-800 rounded-xl">
        <h3 className="text-sm font-semibold mb-3 text-fiesta-blue flex items-center gap-2">
          <span>📊</span>
          Session Stats
        </h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="text-center p-2 bg-gray-700 rounded">
            <div className="text-fiesta-yellow font-bold">{formatTime(currentTime)}</div>
            <div className="text-gray-400">Current</div>
          </div>
          <div className="text-center p-2 bg-gray-700 rounded">
            <div className="text-fiesta-green font-bold">{Math.round(progress)}%</div>
            <div className="text-gray-400">Progress</div>
          </div>
          <div className="text-center p-2 bg-gray-700 rounded">
            <div className="text-fiesta-orange font-bold">{formatTime(duration)}</div>
            <div className="text-gray-400">Total</div>
          </div>
          <div className="text-center p-2 bg-gray-700 rounded">
            <div className="text-fiesta-purple font-bold">{watchedSeconds}</div>
            <div className="text-gray-400">Seconds</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-fiesta-blue to-fiesta-purple h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default VideoSidebar;