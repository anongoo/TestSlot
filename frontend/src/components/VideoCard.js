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
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [isInList, setIsInList] = useState(false);
  const [isManagingList, setIsManagingList] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const { sessionToken, isStudent, isAuthenticated } = useAuth();

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
      
      // Notify parent to refresh progress
      if (onWatchProgress) {
        onWatchProgress();
      }
    } catch (error) {
      console.error('Error unmarking video as watched:', error);
      alert(error.response?.data?.detail || 'Failed to unmark video. Please try again.');
    } finally {
      setIsToggling(false);
    }
  };

  const handleMarkModalSuccess = (data) => {
    setIsWatched(true);
    // Notify parent to refresh progress
    if (onWatchProgress) {
      onWatchProgress();
    }
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
            {/* Mark as Watched/Unwatched Button */}
            <button
              onClick={handleMarkAsWatched}
              disabled={isMarkingWatched || isToggling}
              className={`px-3 py-2 text-sm rounded-lg transition-colors disabled:opacity-50 ${
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
                className={`px-3 py-2 text-sm rounded-lg transition-colors disabled:opacity-50 ${
                  isInList 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
                title={isInList ? "Remove from My List" : "Add to My List"}
              >
                {isManagingList ? '...' : (isInList ? '✕ Remove' : '+ My List')}
              </button>
            )}
            
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

export default VideoCard;