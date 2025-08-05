import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import DreamingSpanishVideoCard from './DreamingSpanishVideoCard';
import NewVideoPlayer from './NewVideoPlayer';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DreamingSpanishLibraryTab = () => {
  const { isAuthenticated, sessionToken } = useAuth();
  const [myListVideos, setMyListVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [activeSection, setActiveSection] = useState('list'); // 'list' or 'series'

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyList();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchMyList = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/user/list`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      setMyListVideos(response.data.videos || []);
    } catch (error) {
      console.error('Error fetching My List:', error);
      setMyListVideos([]);
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

  // If not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Login Required</h3>
          <p className="text-gray-500 mb-4">Sign in to access your personal library</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Sign Up / Login
          </a>
        </div>
      </div>
    );
  }

  // If video is selected, show the video player
  if (selectedVideo) {
    const relatedVideos = myListVideos.filter(video => video.id !== selectedVideo.id);
    
    return (
      <NewVideoPlayer
        key={`library-video-player-${selectedVideo.id}`}
        video={selectedVideo}
        onClose={handleClosePlayer}
        onVideoEnd={() => setSelectedVideo(null)}
        relatedVideos={relatedVideos}
        onVideoSelect={handleVideoSelect}
        debug={process.env.NODE_ENV === 'development'}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Library Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Your Library</h1>
          
          {/* Section Tabs */}
          <div className="flex gap-1">
            <button
              onClick={() => setActiveSection('list')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeSection === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💾 My List
            </button>
            <button
              onClick={() => setActiveSection('series')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeSection === 'series'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📚 My Series
            </button>
          </div>
        </div>
      </div>

      {/* Library Content */}
      <div className="flex-1 p-4">
        {activeSection === 'list' && (
          <div>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : myListVideos.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💾</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Your list is empty</h3>
                <p className="text-gray-500 mb-4">Start adding videos to your list to see them here</p>
                <a
                  href="/watch"
                  className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Browse Videos
                </a>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {myListVideos.length} video{myListVideos.length !== 1 ? 's' : ''} in your list
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {myListVideos.map((video) => (
                    <DreamingSpanishVideoCard
                      key={video.id}
                      video={video}
                      onVideoSelect={handleVideoSelect}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeSection === 'series' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">My Series Coming Soon!</h3>
            <p className="text-gray-500">
              Track your progress through video series and collections
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DreamingSpanishLibraryTab;