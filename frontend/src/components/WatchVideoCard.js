import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import MarkAsWatchedModal from './MarkAsWatchedModal';

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

const WatchVideoCard = ({ video, onVideoSelect }) => {
  const { isAuthenticated, isStudent, sessionToken } = useAuth();
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [isInList, setIsInList] = useState(false);
  const [isManagingList, setIsManagingList] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [sessionId] = useState(getSessionId());

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

  const levelColors = {
    'New Beginner': 'bg-green-100 text-green-800',
    'Beginner': 'bg-blue-100 text-blue-800',
    'Intermediate': 'bg-yellow-100 text-yellow-800',
    'Advanced': 'bg-red-100 text-red-800'
  };

  const handlePlay = () => {
    console.log('🎯 handlePlay triggered for:', video.title);
    
    // Check premium access for non-authenticated users
    if (video.is_premium && !isStudent) {
      console.log('⚠️ Premium access blocked for non-student');
      alert('Please create an account to access premium content!');
      return;
    }

    console.log('✅ Calling onVideoSelect with video:', video);
    onVideoSelect(video);
    console.log('✅ onVideoSelect called');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group">
      {/* Thumbnail */}
      <div className="relative" onClick={handlePlay}>
        <img 
          src={video.thumbnail_url ? `${BACKEND_URL}${video.thumbnail_url}` : `data:image/svg+xml;charset=utf8,${encodeURIComponent(`
            <svg width="320" height="180" viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg">
              <rect width="320" height="180" fill="#f8fafc"/>
              <rect width="320" height="180" fill="url(#fiesta-gradient)" opacity="0.1"/>
              <defs>
                <linearGradient id="fiesta-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#fbbf24"/>
                  <stop offset="50%" style="stop-color:#3b82f6"/>
                  <stop offset="100%" style="stop-color:#8b5cf6"/>
                </linearGradient>
              </defs>
              <g transform="translate(160, 90)">
                <circle r="24" fill="white" stroke="#e5e7eb" stroke-width="2"/>
                <polygon points="-10,-14 -10,14 20,0" fill="#3b82f6"/>
              </g>
              <text x="160" y="130" text-anchor="middle" fill="#374151" font-family="Arial, sans-serif" font-size="14" font-weight="700">
                English Fiesta
              </text>
              <text x="160" y="150" text-anchor="middle" fill="#6b7280" font-family="Arial, sans-serif" font-size="11">
                ${video.level || 'Learn English'} • ${video.duration_minutes || '0'}min
              </text>
            </svg>
          `)}`}
          alt={video.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            // Simple fallback with no complex encoding
            e.target.src = 'data:image/svg+xml;charset=utf8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"%3E%3Crect width="320" height="180" fill="%23f3f4f6"/%3E%3Cg transform="translate(160, 90)"%3E%3Ccircle r="20" fill="%23e5e7eb"/%3E%3Cpolygon points="-8,-12 -8,12 16,0" fill="%236b7280"/%3E%3C/g%3E%3Ctext x="160" y="130" text-anchor="middle" fill="%23374151" font-family="Arial" font-size="12"%3EEnglish Fiesta%3C/text%3E%3C/svg%3E';
          }}
        />
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
          <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <svg className="w-6 h-6 text-blue-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>

        {/* Duration */}
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs font-medium">
          {video.duration_minutes}min
        </div>

        {/* Premium Badge */}
        {video.is_premium && (
          <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            💎
          </div>
        )}

        {/* Video Type Badge */}
        {video.video_type === 'youtube' && (
          <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">
            📺
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
          {video.title}
        </h3>
        
        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
          {video.description}
        </p>

        {/* Metadata */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${levelColors[video.level]}`}>
            {video.level}
          </span>
          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
            {video.category}
          </span>
        </div>

        {/* Instructor & Country */}
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>👨‍🏫 {video.instructor_name}</span>
          <span>🌍 {video.country}</span>
        </div>

        {/* Accents */}
        {video.accents && video.accents.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            🗣️ {video.accents.join(', ')} Accent{video.accents.length > 1 ? 's' : ''}
          </div>
        )}

        {/* Premium Access Warning for Guests */}
        {video.is_premium && !isAuthenticated && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-xs text-yellow-800 text-center">
              💎 Premium content - Sign up to access
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-3 flex gap-2">
          {/* Mark as Watched/Unwatched Button */}
          <button
            onClick={handleMarkAsWatched}
            disabled={isToggling}
            className={`flex-1 px-3 py-2 text-xs rounded-lg transition-colors disabled:opacity-50 ${
              isWatched 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
              className={`flex-1 px-3 py-2 text-xs rounded-lg transition-colors disabled:opacity-50 ${
                isInList 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
              title={isInList ? "Remove from My List" : "Add to My List"}
            >
              {isManagingList ? '...' : (isInList ? '✕ Remove' : '+ My List')}
            </button>
          )}
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

export default WatchVideoCard;