import React, { useState, useEffect } from 'react';
import axios from 'axios';
import VideoCard from './VideoCard';
import FilterPanel from './FilterPanel';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VideoLibrary = ({ sessionId, onWatchProgress }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});

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

  return (
    <div className="mb-8">
      {/* Filter Panel */}
      <FilterPanel 
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
      />
      
      {/* Video Library Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          📚 Video Library
        </h2>
        <div className="text-sm text-gray-600">
          {videos.length} video{videos.length !== 1 ? 's' : ''} found
        </div>
      </div>
      
      {/* Videos Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-48 rounded-xl mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map(video => (
            <VideoCard 
              key={video.id} 
              video={video}
              onWatchProgress={onWatchProgress}
              sessionId={sessionId}
            />
          ))}
        </div>
      )}
      
      {!loading && videos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">No videos found matching your filters.</p>
          <p className="text-gray-500 mt-2">Try adjusting your search criteria.</p>
        </div>
      )}
    </div>
  );
};

export default VideoLibrary;