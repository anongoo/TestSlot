import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import PremiumGate from './PremiumGate';
import MarkAsWatchedModal from './MarkAsWatchedModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VideoCard = ({ video, onWatchProgress, sessionId }) => {
  const [isWatching, setIsWatching] = useState(false);
  const [watchedMinutes, setWatchedMinutes] = useState(0);
  const [isMarkingWatched, setIsMarkingWatched] = useState(false);
  const { sessionToken, isStudent } = useAuth();

  const handleWatchVideo = async () => {
    // Check premium access
    if (video.is_premium && !isStudent) {
      alert('Please create an account to access premium content!');
      return;
    }

    setIsWatching(true);
    
    // Simulate watching progress (in real app, this would be video player events)
    const duration = video.duration_minutes;
    let currentMinutes = 0;
    
    const watchInterval = setInterval(async () => {
      currentMinutes += 1;
      setWatchedMinutes(currentMinutes);
      
      // Record progress every minute
      try {
        const headers = sessionToken ? 
          { 'Authorization': `Bearer ${sessionToken}` } : {};
        
        await axios.post(`${API}/videos/${video.id}/watch`, {
          watched_minutes: currentMinutes
        }, {
          params: { session_id: sessionId },
          headers
        });
        
        // Notify parent to refresh progress
        if (onWatchProgress) {
          onWatchProgress();
        }
      } catch (error) {
        console.error('Error recording watch progress:', error);
      }
      
      // Stop when video is "finished"
      if (currentMinutes >= duration) {
        clearInterval(watchInterval);
        setIsWatching(false);
        setWatchedMinutes(0);
      }
    }, 2000); // Update every 2 seconds for demo purposes
  };

  const handleMarkAsWatched = async () => {
    if (isMarkingWatched) return;
    
    setIsMarkingWatched(true);
    
    try {
      const headers = sessionToken ? 
        { 'Authorization': `Bearer ${sessionToken}` } : {};
      
      const response = await axios.post(`${API}/videos/${video.id}/mark-watched`, {
        difficulty_level: video.level
      }, {
        params: { session_id: sessionId },
        headers
      });

      if (response.data.already_watched) {
        alert('This video is already marked as watched!');
      } else {
        alert(`✅ Marked as watched! ${response.data.credited_minutes} minutes added to your progress.`);
        // Notify parent to refresh progress
        if (onWatchProgress) {
          onWatchProgress();
        }
      }
    } catch (error) {
      console.error('Error marking video as watched:', error);
      alert('Failed to mark video as watched. Please try again.');
    } finally {
      setIsMarkingWatched(false);
    }
  };

  const levelColors = {
    'New Beginner': 'bg-green-100 text-green-800',
    'Beginner': 'bg-blue-100 text-blue-800',
    'Intermediate': 'bg-yellow-100 text-yellow-800',
    'Advanced': 'bg-red-100 text-red-800'
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="relative">
        <img 
          src={video.thumbnail_url} 
          alt={video.title}
          className="w-full h-48 object-cover"
        />
        {video.is_premium && (
          <span className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            💎 PREMIUM
          </span>
        )}
      </div>
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-gray-800 line-clamp-2">{video.title}</h3>
          <span className="text-sm text-gray-500 ml-2">{video.duration_minutes}min</span>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{video.description}</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${levelColors[video.level]}`}>
            {video.level}
          </span>
          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
            {video.category}
          </span>
          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
            {video.accent}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            <span className="block">{video.guide}</span>
            <span className="block">{video.country}</span>
          </div>
          
          <div className="flex gap-2">
            {/* Mark as Watched Button */}
            <button
              onClick={handleMarkAsWatched}
              disabled={isMarkingWatched}
              className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
              title="Mark as already watched"
            >
              {isMarkingWatched ? '...' : '✓ Watched'}
            </button>
            
            {/* Watch Now Button */}
            <PremiumGate video={video}>
              <button
                onClick={handleWatchVideo}
                disabled={isWatching}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  isWatching 
                    ? 'bg-green-500 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isWatching ? `Watching... ${watchedMinutes}min` : 'Watch Now'}
              </button>
            </PremiumGate>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;