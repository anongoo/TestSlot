import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DreamingSpanishVideoCard = ({ video, onVideoSelect }) => {
  const { isAuthenticated, sessionToken, isStudent } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [isInList, setIsInList] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check user list status and watched status
  useEffect(() => {
    if (isAuthenticated && isStudent) {
      checkUserListStatus();
      checkWatchedStatus();
    }
  }, [isAuthenticated, isStudent, video.id]);

  const checkUserListStatus = async () => {
    try {
      const response = await axios.get(`${API}/user/list/status/${video.id}`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      setIsInList(response.data.in_list);
    } catch (error) {
      setIsInList(false);
    }
  };

  const checkWatchedStatus = async () => {
    try {
      const sessionId = localStorage.getItem('english_fiesta_session') || 
        'guest_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      
      const response = await axios.get(`${API}/progress/${sessionId}`, {
        headers: sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {}
      });
      
      // Check if this video is in the watched list
      const watchedVideos = response.data.recent_activity || [];
      const videoWatched = watchedVideos.some(activity => 
        activity.videos && activity.videos.includes(video.id)
      );
      setIsWatched(videoWatched);
    } catch (error) {
      setIsWatched(false);
    }
  };

  const handleVideoClick = () => {
    if (onVideoSelect) {
      onVideoSelect(video);
    }
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleAddToList = async (e) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      setShowGuestModal(true);
      setShowMenu(false);
      return;
    }
    
    if (!isStudent) {
      alert('Only students can add videos to My List');
      setShowMenu(false);
      return;
    }

    setLoading(true);
    try {
      if (isInList) {
        await axios.delete(`${API}/user/list/${video.id}`, {
          headers: { 'Authorization': `Bearer ${sessionToken}` }
        });
        setIsInList(false);
      } else {
        await axios.post(`${API}/user/list`, { video_id: video.id }, {
          headers: { 'Authorization': `Bearer ${sessionToken}` }
        });
        setIsInList(true);
      }
    } catch (error) {
      console.error('Error managing list:', error);
      alert('Error updating My List. Please try again.');
    } finally {
      setLoading(false);
      setShowMenu(false);
    }
  };

  const handleMarkAsWatched = async (e) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      setShowGuestModal(true);
      setShowMenu(false);
      return;
    }

    setLoading(true);
    try {
      const sessionId = localStorage.getItem('english_fiesta_session') || 
        'guest_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      
      if (isWatched) {
        // Unmark as watched
        await axios.post(`${API}/user/unmark-watched`, { video_id: video.id }, {
          headers: { 'Authorization': `Bearer ${sessionToken}` },
          params: { session_id: sessionId }
        });
        setIsWatched(false);
      } else {
        // Mark as watched
        await axios.post(`${API}/videos/${video.id}/mark-watched`, {}, {
          headers: { 'Authorization': `Bearer ${sessionToken}` },
          params: { session_id: sessionId }
        });
        setIsWatched(true);
      }
    } catch (error) {
      console.error('Error marking watched:', error);
      alert('Error updating watched status. Please try again.');
    } finally {
      setLoading(false);
      setShowMenu(false);
    }
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    alert('Download functionality coming soon!');
    setShowMenu(false);
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'new beginner':
        return 'bg-green-500';
      case 'beginner':
        return 'bg-blue-500';
      case 'intermediate':
        return 'bg-orange-500';
      case 'advanced':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getLevelIcon = (level) => {
    switch (level?.toLowerCase()) {
      case 'new beginner':
        return '🌱';
      case 'beginner':
        return '📚';
      case 'intermediate':
        return '🎯';
      case 'advanced':
        return '🔥';
      default:
        return '📖';
    }
  };

  return (
    <>
      <div 
        className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden transform hover:scale-[1.02] hover:-translate-y-1"
        onClick={handleVideoClick}
      >
        {/* Thumbnail Container */}
        <div className="relative aspect-video bg-gray-200 overflow-hidden">
          {/* Thumbnail Image */}
          {video.thumbnail_url ? (
            <img
              src={video.thumbnail_url.startsWith('http') ? video.thumbnail_url : `${BACKEND_URL}${video.thumbnail_url}`}
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 225'%3E%3Crect width='400' height='225' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='%236b7280' text-anchor='middle' dy='.3em'%3EEnglish Fiesta%3C/text%3E%3C/svg%3E";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
              <div className="text-center">
                <div className="text-4xl mb-2">🎬</div>
                <div className="text-sm text-gray-500 font-medium">English Fiesta</div>
              </div>
            </div>
          )}

          {/* Duration Overlay */}
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm font-medium">
            {formatDuration(video.duration_minutes)}
          </div>

          {/* Premium Badge */}
          {video.is_premium && (
            <div className="absolute top-2 left-2 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold shadow-lg">
              💎 Premium
            </div>
          )}

          {/* Watched Indicator */}
          {isWatched && (
            <div className="absolute top-2 right-12 bg-green-500 text-white p-1 rounded-full shadow-lg">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}

          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black bg-opacity-30">
            <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300 shadow-lg">
              <svg className="w-6 h-6 text-blue-600 ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 5v10l8-5-8-5z" />
              </svg>
            </div>
          </div>

          {/* Enhanced Menu Button */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" ref={menuRef}>
            <button
              onClick={handleMenuClick}
              className="w-8 h-8 bg-black bg-opacity-75 hover:bg-opacity-90 text-white rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 shadow-lg"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {/* Enhanced Dropdown Menu */}
            {showMenu && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                <div className="py-2">
                  {/* Add/Remove from My List */}
                  <button
                    onClick={handleAddToList}
                    disabled={loading}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors disabled:opacity-50"
                  >
                    <span className="text-lg">
                      {loading ? '⏳' : (isInList ? '❤️' : '🤍')}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">
                        {loading ? 'Updating...' : (isInList ? 'Remove from My List' : 'Add to My List')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {isInList ? 'Remove from saved videos' : 'Save for later watching'}
                      </div>
                    </div>
                  </button>

                  {/* Mark/Unmark as Watched */}
                  <button
                    onClick={handleMarkAsWatched}
                    disabled={loading}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors disabled:opacity-50"
                  >
                    <span className="text-lg">
                      {loading ? '⏳' : (isWatched ? '✅' : '➕')}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">
                        {loading ? 'Updating...' : (isWatched ? 'Mark as Unwatched' : 'Mark as Watched')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {isWatched ? 'Remove from progress tracking' : 'Add to your learning progress'}
                      </div>
                    </div>
                  </button>

                  {/* Download Option */}
                  <button
                    onClick={handleDownload}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <span className="text-lg">📥</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">Download</div>
                      <div className="text-xs text-gray-500">Coming soon</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {video.title}
          </h3>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {/* Level Badge */}
            <span className={`${getLevelColor(video.level)} text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-sm`}>
              <span>{getLevelIcon(video.level)}</span>
              <span>{video.level}</span>
            </span>

            {/* Category Badge */}
            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
              📂 {video.category}
            </span>
          </div>

          {/* Instructor and Country */}
          <div className="text-sm text-gray-600 mb-1">
            <span className="font-medium">{video.instructor_name || 'English Fiesta'}</span>
            {video.country && (
              <span className="ml-2">🌍 {video.country}</span>
            )}
          </div>

          {/* Accents */}
          {video.accents && Array.isArray(video.accents) && video.accents.length > 0 && (
            <div className="text-xs text-gray-500">
              🗣️ {video.accents.join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* Guest User Modal */}
      {showGuestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Want to track your progress?</h3>
              <p className="text-gray-600 mb-6">
                Create a free account to save videos to My List, track your learning progress, and unlock the full English Fiesta experience!
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowGuestModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Maybe Later
                </button>
                <a
                  href="/"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-center"
                >
                  Sign Up Free
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DreamingSpanishVideoCard;