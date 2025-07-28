import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminYouTubeAdd = ({ onAddSuccess }) => {
  const { sessionToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    youtube_url: '',
    title: '',
    description: '',
    level: 'New Beginner',
    accents: ['American'],
    tags: [],
    instructor_name: '',
    country: 'USA',
    category: 'Conversation',
    is_premium: false
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTagsChange = (value) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setFormData(prev => ({
      ...prev,
      tags
    }));
  };

  const handleAccentsChange = (accent, checked) => {
    setFormData(prev => ({
      ...prev,
      accents: checked 
        ? [...prev.accents, accent]
        : prev.accents.filter(a => a !== accent)
    }));
  };

  const extractVideoId = (url) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.youtube_url.trim()) {
      alert('Please enter a YouTube URL');
      return;
    }

    if (!extractVideoId(formData.youtube_url)) {
      alert('Please enter a valid YouTube URL');
      return;
    }

    if (!formData.instructor_name.trim()) {
      alert('Please enter the instructor name');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API}/admin/videos/youtube`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      alert('✅ YouTube video added successfully!');
      
      // Reset form
      setFormData({
        youtube_url: '',
        title: '',
        description: '',
        level: 'New Beginner',
        accents: ['American'],
        tags: [],
        instructor_name: '',
        country: 'USA',
        category: 'Conversation',
        is_premium: false
      });

      if (onAddSuccess) {
        onAddSuccess();
      }

    } catch (error) {
      console.error('Error adding YouTube video:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to add YouTube video. Please try again.';
      alert('❌ ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        📺 Add YouTube Video
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* YouTube URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            YouTube URL *
          </label>
          <input
            type="url"
            value={formData.youtube_url}
            onChange={(e) => handleChange('youtube_url', e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Paste a YouTube video URL. We'll automatically fetch video information.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title (Optional)
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Leave blank to auto-fetch from YouTube"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Instructor Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instructor Name *
            </label>
            <input
              type="text"
              value={formData.instructor_name}
              onChange={(e) => handleChange('instructor_name', e.target.value)}
              placeholder="Who is speaking or featured?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Level *
            </label>
            <select
              value={formData.level}
              onChange={(e) => handleChange('level', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="New Beginner">New Beginner</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country *
            </label>
            <select
              value={formData.country}
              onChange={(e) => handleChange('country', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="USA">USA</option>
              <option value="UK">UK</option>
              <option value="Canada">Canada</option>
              <option value="Australia">Australia</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Leave blank to auto-fetch from YouTube"
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={formData.tags.join(', ')}
            onChange={(e) => handleTagsChange(e.target.value)}
            placeholder="e.g., beginner, conversation, daily life"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Accents */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Accents *
          </label>
          <div className="flex flex-wrap gap-4">
            {['American', 'British', 'Australian', 'Canadian'].map(accent => (
              <label key={accent} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.accents.includes(accent)}
                  onChange={(e) => handleAccentsChange(accent, e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">{accent}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Premium Toggle */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_premium}
              onChange={(e) => handleChange('is_premium', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm font-medium">💎 Mark as Premium Content</span>
          </label>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !formData.youtube_url.trim() || !formData.instructor_name.trim()}
            className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                Adding YouTube Video...
              </>
            ) : (
              <>
                📺 Add YouTube Video
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminYouTubeAdd;