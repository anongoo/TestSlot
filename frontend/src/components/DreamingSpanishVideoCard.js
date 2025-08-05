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
      // User not authenticated or video not in list
      setIsInList(false);
    }
  };

  const checkWatchedStatus = async () => {
    // This would need a backend endpoint to check watched status
    // For now, we'll assume not watched
    setIsWatched(false);
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
    if (!isAuthenticated || !isStudent) return;

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
    } finally {
      setLoading(false);
      setShowMenu(false);
    }
  };

  const handleMarkAsWatched = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) return;

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
    } finally {
      setLoading(false);
      setShowMenu(false);
    }
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    // For now, just close menu - download functionality would need backend support
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
    <div 
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden"
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
              // Fallback to a branded placeholder
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
          <div className="absolute top-2 left-2 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold">
            💎 Premium
          </div>
        )}

        {/* Watched Indicator */}
        {isWatched && (
          <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black bg-opacity-30">
          <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300">
            <svg className="w-6 h-6 text-blue-600 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 5v10l8-5-8-5z" />
            </svg>
          </div>
        </div>

        {/* Menu Button */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" ref={menuRef}>
          <button
            onClick={handleMenuClick}
            className="w-8 h-8 bg-black bg-opacity-75 hover:bg-opacity-90 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border z-50">
              <div className="py-1">
                <button
                  onClick={handleDownload}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-3"
                >
                  <span>📥</span>
                  <span>Download</span>
                </button>
                
                {isAuthenticated && isStudent && (
                  <button
                    onClick={handleAddToList}
                    disabled={loading}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-3"
                  >
                    <span>{isInList ? '❤️' : '🤍'}</span>
                    <span>{loading ? 'Loading...' : (isInList ? 'Remove from My List' : 'Add to My List')}</span>
                  </button>
                )}

                {isAuthenticated && (
                  <button
                    onClick={handleMarkAsWatched}
                    disabled={loading}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-3"
                  >
                    <span>{isWatched ? '✅' : '➕'}</span>
                    <span>{loading ? 'Loading...' : (isWatched ? 'Mark as Unwatched' : 'Mark as Watched')}</span>
                  </button>
                )}
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
          <span className={`${getLevelColor(video.level)} text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1`}>
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
  );
};

export default DreamingSpanishVideoCard;