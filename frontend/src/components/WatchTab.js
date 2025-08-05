import React, { useState, useEffect } from 'react';
import axios from 'axios';
import WatchVideoCard from './WatchVideoCard';
import VideoPlayer from './VideoPlayer';
import FilterPanel from './FilterPanel';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WatchTab = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [filters, setFilters] = useState({
    level: '',
    category: '',
    country: '',
    guide: '',
    topic: '',
    search: '',
    sort_by: 'newest'
  });

  useEffect(() => {
    fetchVideos();
  }, [filters]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const response = await axios.get(`${API}/videos?${params.toString()}`);
      setVideos(response.data.videos);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSearch = (searchTerm) => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm
    }));
  };

  const handleVideoSelect = (video) => {
    console.log('🎯 Video selected:', video?.title);
    setSelectedVideo(video);
    console.log('🎭 Selected video state updated');
  };

  const handleClosePlayer = () => {
    console.log('❌ Closing video player');
    setSelectedVideo(null);
  };

  // Debug logging
  useEffect(() => {
    console.log('🔍 WatchTab selectedVideo state:', selectedVideo?.title || 'None');
  }, [selectedVideo]);

  // Debug: Force render VideoPlayer for testing
  if (true) { // Temporarily bypass modal condition
    const testVideo = {
      id: 'test-123',
      title: 'Test Video - babycrawl',
      video_type: 'local',
      video_url: '/api/files/videos/babycrawl.mp4',
      thumbnail_url: '/api/files/thumbnails/babycrawl.jpg',
      duration_minutes: 2,
      level: 'Beginner',
      country: 'USA',
      instructor_name: 'Test Instructor',
      category: 'Conversation',
      is_premium: false
    };
    
    return (
      <div className="fixed inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-4 rounded-lg">
          <h2 className="text-lg font-bold mb-4">🧪 Testing VideoPlayer Direct Render</h2>
          <button
            onClick={() => {
              console.log('🚫 Closing test player');
              window.location.reload();
            }}
            className="mb-4 px-4 py-2 bg-red-500 text-white rounded"
          >
            Close Test
          </button>
          <VideoPlayer
            video={testVideo}
            onClose={() => window.location.reload()}
            onVideoEnd={() => console.log('🏁 Video ended')}
            relatedVideos={[]}
            onVideoSelect={() => console.log('➡️ Video selected')}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* New Comprehensive Filter Panel */}
      <FilterPanel 
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
      />

      {/* Videos Grid */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-700">
            {videos.length} video{videos.length !== 1 ? 's' : ''} available
          </h3>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-48 rounded-xl mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎥</div>
            <p className="text-xl text-gray-600 mb-2">No videos found</p>
            <p className="text-gray-500">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map(video => (
              <WatchVideoCard
                key={video.id}
                video={video}
                onVideoSelect={handleVideoSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchTab;