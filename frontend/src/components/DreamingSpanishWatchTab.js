import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import NewVideoPlayer from './NewVideoPlayer';
import DreamingSpanishVideoCard from './DreamingSpanishVideoCard';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DreamingSpanishWatchTab = () => {
  const { isAuthenticated, sessionToken } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [hideWatched, setHideWatched] = useState(false);
  
  const [filters, setFilters] = useState({
    sort_by: 'random',
    level: '',
    country: '',
    guide: '',
    topic: '',
    category: '', // Keep for backward compatibility
    search: ''
  });

  // Available filter options
  const [filterOptions, setFilterOptions] = useState({
    levels: ['New Beginner', 'Beginner', 'Intermediate', 'Advanced'],
    countries: ['USA', 'UK', 'Canada', 'Australia'],
    guides: ['Native Speaker', 'ESL Teacher', 'Language Coach'],
    topics: [], // Will be loaded from API
    categories: ['Conversation', 'Grammar', 'Vocabulary', 'Pronunciation', 'Culture', 'Business']
  });

  // Sort options matching Dreaming Spanish
  const sortOptions = [
    { value: 'random', label: 'Random', icon: '🎲' },
    { value: 'newest', label: 'New', icon: '🆕' },
    { value: 'oldest', label: 'Old', icon: '📚' },
    { value: 'shortest', label: 'Easy', icon: '😊' },
    { value: 'longest', label: 'Hard', icon: '🔥' },
    { value: 'short', label: 'Short', icon: '⚡' },
    { value: 'long', label: 'Long', icon: '🎬' }
  ];

  useEffect(() => {
    fetchVideos();
    loadFilterOptions();
  }, [filters, hideWatched]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      if (hideWatched) {
        params.append('hide_watched', 'true');
      }

      const response = await axios.get(`${API}/videos?${params}`);
      setVideos(response.data.videos || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      // Load topics from API (if available)
      const response = await axios.get(`${API}/filters/options`);
      if (response.data) {
        setFilterOptions(prev => ({
          ...prev,
          topics: response.data.topics || [],
          // Keep other options as fallback
        }));
      }
    } catch (error) {
      console.log('Using default filter options');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      sort_by: 'random',
      level: '',
      country: '',
      guide: '',
      topic: '',
      category: '',
      search: ''
    });
    setHideWatched(false);
  };

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
  };

  const handleClosePlayer = () => {
    setSelectedVideo(null);
  };

  // If video is selected, show the video player
  if (selectedVideo) {
    const relatedVideos = videos.filter(video => video.id !== selectedVideo.id);
    
    return (
      <NewVideoPlayer
        key={`video-player-${selectedVideo.id}`}
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
      {/* Header with Filter Controls - Dreaming Spanish Style */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="p-4">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search videos, instructors, or topics..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Filter Controls Row */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Sort By */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">📊 Sort by:</span>
              <select
                value={filters.sort_by}
                onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Levels */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">📈 Levels:</span>
              <select
                value={filters.level}
                onChange={(e) => handleFilterChange('level', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Levels</option>
                {filterOptions.levels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            {/* Countries */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">🌍 Countries:</span>
              <select
                value={filters.country}
                onChange={(e) => handleFilterChange('country', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Countries</option>
                {filterOptions.countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            {/* Guides */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">👨‍🏫 Guides:</span>
              <select
                value={filters.guide}
                onChange={(e) => handleFilterChange('guide', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Guides</option>
                {filterOptions.guides.map(guide => (
                  <option key={guide} value={guide}>{guide}</option>
                ))}
              </select>
            </div>

            {/* Topics */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">🏷️ Topics:</span>
              <select
                value={filters.topic}
                onChange={(e) => handleFilterChange('topic', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Topics</option>
                {filterOptions.topics.map(topic => (
                  <option key={topic.slug || topic} value={topic.slug || topic}>
                    {topic.name || topic}
                  </option>
                ))}
              </select>
            </div>

            {/* Hide Watched Toggle */}
            {isAuthenticated && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideWatched}
                  onChange={(e) => setHideWatched(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">🙈 Hide Watched</span>
              </label>
            )}

            {/* Clear Filters Button */}
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              🧹 Clear All Filters
            </button>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎥</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No videos found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters or search terms</p>
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800">
                {videos.length} video{videos.length !== 1 ? 's' : ''} available
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video) => (
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
    </div>
  );
};

export default DreamingSpanishWatchTab;