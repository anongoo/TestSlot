import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import WatchVideoCard from './WatchVideoCard';
import VideoPlayer from './VideoPlayer';

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

const MyListTab = () => {
  const { isAuthenticated, sessionToken } = useAuth();
  const [activeSection, setActiveSection] = useState('saved');
  const [savedVideos, setSavedVideos] = useState([]);
  const [watchHistory, setWatchHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [sessionId] = useState(getSessionId());

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyListData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, activeSection]);

  const fetchMyListData = async () => {
    setLoading(true);
    try {
      if (activeSection === 'saved') {
        // Fetch saved videos (this would be a new endpoint)
        // For now, we'll use a placeholder
        setSavedVideos([]);
      } else if (activeSection === 'history') {
        // Fetch watch history from progress endpoint
        const response = await axios.get(`${API}/progress/${sessionId}`);
        const progressData = response.data;
        
        // Extract watched videos from recent activity
        if (progressData.recent_activity) {
          const watchedVideoIds = [...new Set(progressData.recent_activity.map(activity => activity.video_id))];
          
          // Fetch video details for watched videos
          const videoPromises = watchedVideoIds.map(async (videoId) => {
            try {
              const videoResponse = await axios.get(`${API}/videos`);
              const video = videoResponse.data.videos.find(v => v.id === videoId);
              if (video) {
                // Add watch history metadata
                const watchActivity = progressData.recent_activity.filter(a => a.video_id === videoId);
                video.watch_history = {
                  total_minutes_watched: watchActivity.reduce((sum, a) => sum + (a.minutes_watched || 0), 0),
                  last_watched: watchActivity[watchActivity.length - 1]?.date,
                  watch_count: watchActivity.length
                };
              }
              return video;
            } catch (error) {
              return null;
            }
          });

          const videos = (await Promise.all(videoPromises)).filter(Boolean);
          setWatchHistory(videos);
        }
      }
    } catch (error) {
      console.error('Error fetching my list data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
  };

  const handleClosePlayer = () => {
    setSelectedVideo(null);
  };

  const handleSaveVideo = async (videoId) => {
    if (!isAuthenticated) return;

    try {
      // This would be a new endpoint to save/unsave videos
      const response = await axios.post(`${API}/user/saved-videos`, {
        video_id: videoId,
        action: 'save'
      }, {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });

      // Refresh saved videos if on that section
      if (activeSection === 'saved') {
        fetchMyListData();
      }
    } catch (error) {
      console.error('Error saving video:', error);
    }
  };

  const handleRemoveFromHistory = async (videoId) => {
    if (!isAuthenticated) return;

    try {
      // This would be a new endpoint to clear watch history for a video
      const response = await axios.delete(`${API}/user/watch-history/${videoId}`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });

      // Refresh watch history
      if (activeSection === 'history') {
        fetchMyListData();
      }
    } catch (error) {
      console.error('Error removing from history:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-6">🔐</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Sign in to access My List</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Create an account to save videos for later and track your watch history across all your devices.
        </p>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-md mx-auto">
            <h3 className="font-semibold text-blue-800 mb-2">With an account you can:</h3>
            <ul className="text-blue-700 space-y-1 text-sm">
              <li>• Save videos and series to watch later</li>
              <li>• View your complete watch history</li>
              <li>• Track learning progress across devices</li>
              <li>• Get personalized recommendations</li>
            </ul>
          </div>
          <a
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Sign Up / Login
          </a>
        </div>
      </div>
    );
  }

  if (selectedVideo) {
    return (
      <VideoPlayer
        video={selectedVideo}
        onClose={handleClosePlayer}
        onVideoEnd={() => setSelectedVideo(null)}
      />
    );
  }

  return (
    <div>
      {/* Section Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">My List</h2>
        
        {/* Section Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveSection('saved')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeSection === 'saved'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              💾 Saved Videos
            </button>
            <button
              onClick={() => setActiveSection('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeSection === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📺 Watch History
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div>
        {activeSection === 'saved' ? (
          /* Saved Videos Section */
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-700">
                Saved for Later ({savedVideos.length})
              </h3>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 h-48 rounded-xl mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : savedVideos.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💾</div>
                <p className="text-xl text-gray-600 mb-2">No saved videos yet</p>
                <p className="text-gray-500 mb-6">Videos you save will appear here for easy access later.</p>
                <a
                  href="/watch"
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Browse Videos to Save
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {savedVideos.map(video => (
                  <div key={video.id} className="relative">
                    <WatchVideoCard
                      video={video}
                      onVideoSelect={handleVideoSelect}
                    />
                    <button
                      onClick={() => handleSaveVideo(video.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                      title="Remove from saved"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 18L18 6M6 6l12 12" strokeWidth={2} stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Watch History Section */
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-700">
                Recently Watched ({watchHistory.length})
              </h3>
              {watchHistory.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('Clear all watch history? This cannot be undone.')) {
                      // Clear all history logic here
                      setWatchHistory([]);
                    }
                  }}
                  className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                >
                  Clear All History
                </button>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 h-48 rounded-xl mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : watchHistory.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📺</div>
                <p className="text-xl text-gray-600 mb-2">No watch history yet</p>
                <p className="text-gray-500 mb-6">Videos you watch will appear here with your progress.</p>
                <a
                  href="/watch"
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Start Watching Videos
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {watchHistory
                  .sort((a, b) => new Date(b.watch_history?.last_watched || 0) - new Date(a.watch_history?.last_watched || 0))
                  .map(video => (
                    <div key={video.id} className="relative">
                      <WatchVideoCard
                        video={video}
                        onVideoSelect={handleVideoSelect}
                      />
                      
                      {/* Watch History Stats */}
                      <div className="absolute bottom-16 left-2 right-2 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
                        <div>⏱️ Watched: {video.watch_history?.total_minutes_watched || 0}min</div>
                        <div>📅 Last: {video.watch_history?.last_watched ? new Date(video.watch_history.last_watched).toLocaleDateString() : 'Unknown'}</div>
                      </div>

                      {/* Remove from History Button */}
                      <button
                        onClick={() => {
                          if (window.confirm('Remove this video from your watch history?')) {
                            handleRemoveFromHistory(video.id);
                          }
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                        title="Remove from history"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 18L18 6M6 6l12 12" strokeWidth={2} stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyListTab;