import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminVideoManagement = ({ refreshTrigger }) => {
  const { sessionToken } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    search: '',
    level: '',
    category: '',
    video_type: ''
  });
  
  const [editingVideo, setEditingVideo] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    fetchVideos();
  }, [filters, refreshTrigger]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const response = await axios.get(`${API}/admin/videos?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      
      setVideos(response.data.videos);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching admin videos:', error);
      if (error.response?.status === 401) {
        alert('Authentication required. Please log in as admin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset to page 1 when changing filters
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchVideos();
  };

  const handleEdit = (video) => {
    setEditingVideo(video.id);
    setEditFormData({
      title: video.title,
      description: video.description,
      level: video.level,
      instructor_name: video.instructor_name,
      country: video.country,
      category: video.category,
      is_premium: video.is_premium,
      tags: video.tags || [],
      accents: video.accents || []
    });
  };

  const handleSaveEdit = async () => {
    try {
      await axios.put(`${API}/admin/videos/${editingVideo}`, editFormData, {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      
      setEditingVideo(null);
      fetchVideos();
      alert('Video updated successfully!');
    } catch (error) {
      console.error('Error updating video:', error);
      alert('Failed to update video. Please try again.');
    }
  };

  const handleDelete = async (videoId, videoTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${videoTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`${API}/admin/videos/${videoId}`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      
      fetchVideos();
      alert('Video deleted successfully!');
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Failed to delete video. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          🎬 Video Management
        </h2>
        <div className="text-sm text-gray-600">
          {pagination.total || 0} video{(pagination.total !== 1) ? 's' : ''} total
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search videos..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Level Filter */}
          <div>
            <select
              value={filters.level}
              onChange={(e) => handleFilterChange('level', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Levels</option>
              <option value="New Beginner">New Beginner</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="Conversation">Conversation</option>
              <option value="Grammar">Grammar</option>
              <option value="Vocabulary">Vocabulary</option>
              <option value="Pronunciation">Pronunciation</option>
              <option value="Culture">Culture</option>
              <option value="Business">Business</option>
              <option value="Interview">Interview</option>
              <option value="Travel">Travel</option>
              <option value="Tutorial">Tutorial</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={filters.video_type}
              onChange={(e) => handleFilterChange('video_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="upload">📁 Uploaded</option>
              <option value="youtube">📺 YouTube</option>
            </select>
          </div>
        </form>
      </div>

      {/* Video Grid */}
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
      ) : videos.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📹</div>
          <p className="text-xl text-gray-600 mb-2">No videos found</p>
          <p className="text-gray-500">Try adjusting your search criteria or upload some videos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map(video => (
            <div key={video.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
              {/* Video Thumbnail */}
              <div className="relative">
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-4xl">
                      {video.video_type === 'youtube' ? '📺' : '🎥'}
                    </span>
                  </div>
                )}
                
                {/* Badges */}
                <div className="absolute top-2 right-2 flex gap-1">
                  {video.video_type === 'youtube' && (
                    <span className="bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                      📺 YouTube
                    </span>
                  )}
                  {video.is_premium && (
                    <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      💎 Premium
                    </span>
                  )}
                </div>
                
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                  {video.duration_minutes}min
                </div>
              </div>

              {/* Video Info */}
              <div className="p-4">
                {editingVideo === video.id ? (
                  /* Edit Form */
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editFormData.title}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Title"
                    />
                    <textarea
                      value={editFormData.description}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      rows="2"
                      placeholder="Description"
                    />
                    <div className="flex gap-2">
                      <select
                        value={editFormData.level}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, level: e.target.value }))}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="New Beginner">New Beginner</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                      <select
                        value={editFormData.category}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="Conversation">Conversation</option>
                        <option value="Grammar">Grammar</option>
                        <option value="Vocabulary">Vocabulary</option>
                        <option value="Pronunciation">Pronunciation</option>
                        <option value="Culture">Culture</option>
                        <option value="Business">Business</option>
                        <option value="Interview">Interview</option>
                        <option value="Travel">Travel</option>
                        <option value="Tutorial">Tutorial</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        ✅ Save
                      </button>
                      <button
                        onClick={() => setEditingVideo(null)}
                        className="bg-gray-400 text-white px-3 py-1 rounded text-sm hover:bg-gray-500"
                      >
                        ❌ Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display Mode */
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2">
                      {video.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {video.description}
                    </p>

                    {/* Metadata */}
                    <div className="text-xs text-gray-500 space-y-1 mb-3">
                      <div><strong>Instructor:</strong> {video.instructor_name}</div>
                      <div><strong>Level:</strong> {video.level}</div>
                      <div><strong>Category:</strong> {video.category}</div>
                      <div><strong>Country:</strong> {video.country}</div>
                      {video.accents && video.accents.length > 0 && (
                        <div><strong>Accents:</strong> {video.accents.join(', ')}</div>
                      )}
                      {video.tags && video.tags.length > 0 && (
                        <div><strong>Tags:</strong> {video.tags.join(', ')}</div>
                      )}
                      {video.file_size && (
                        <div><strong>Size:</strong> {formatFileSize(video.file_size)}</div>
                      )}
                      <div><strong>Created:</strong> {formatDate(video.created_at)}</div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(video)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(video.id, video.title)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-8 flex justify-center">
          <div className="flex gap-2">
            <button
              onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
              disabled={filters.page <= 1}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ‹ Previous
            </button>
            
            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded">
              Page {filters.page} of {pagination.pages}
            </span>
            
            <button
              onClick={() => handleFilterChange('page', Math.min(pagination.pages, filters.page + 1))}
              disabled={filters.page >= pagination.pages}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVideoManagement;