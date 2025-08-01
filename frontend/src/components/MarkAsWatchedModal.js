import React, { useState } from 'react';
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

const MarkAsWatchedModal = ({ video, isOpen, onClose, onSuccess }) => {
  const { sessionToken } = useAuth();
  const [watchedAt, setWatchedAt] = useState(() => {
    // Default to today's date in YYYY-MM-DD format
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [minutesWatched, setMinutesWatched] = useState(video?.duration_minutes || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId] = useState(getSessionId());

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!video || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const headers = sessionToken ? 
        { 'Authorization': `Bearer ${sessionToken}` } : {};
      
      const response = await axios.post(`${API}/progress/manual`, {
        videoId: video.id,
        watchedAt: watchedAt,
        minutesWatched: parseInt(minutesWatched)
      }, {
        params: { session_id: sessionId },
        headers
      });

      if (onSuccess) {
        onSuccess(response.data);
      }
      
      onClose();
    } catch (error) {
      console.error('Error marking video as watched:', error);
      alert(error.response?.data?.detail || 'Failed to mark video as watched. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !video) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Mark as Watched</h2>
              <p className="text-gray-600 text-sm">"{video.title}"</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date Watched */}
          <div>
            <label htmlFor="watchedAt" className="block text-sm font-medium text-gray-700 mb-2">
              Date Watched
            </label>
            <input
              type="date"
              id="watchedAt"
              value={watchedAt}
              onChange={(e) => setWatchedAt(e.target.value)}
              max={new Date().toISOString().split('T')[0]} // Can't select future dates
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              required
            />
          </div>

          {/* Duration Watched */}
          <div>
            <label htmlFor="minutesWatched" className="block text-sm font-medium text-gray-700 mb-2">
              Duration Watched (minutes)
            </label>
            <input
              type="number"
              id="minutesWatched"
              value={minutesWatched}
              onChange={(e) => setMinutesWatched(e.target.value)}
              min="1"
              max={video.duration_minutes}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Video duration: {video.duration_minutes} minutes
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Mark as Watched'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MarkAsWatchedModal;