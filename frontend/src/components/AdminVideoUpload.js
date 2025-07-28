import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminVideoUpload = ({ onUploadSuccess }) => {
  const { sessionToken } = useAuth();
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Form data state
  const [formData, setFormData] = useState({
    level: 'New Beginner',
    accents: ['American'],
    tags: [],
    instructor_name: '',
    country: 'USA',
    category: 'Conversation',
    is_premium: false
  });

  const onDrop = useCallback((acceptedFiles) => {
    const videoFiles = acceptedFiles.filter(file => {
      const ext = file.name.toLowerCase().split('.').pop();
      return ['mp4', 'mov', 'avi'].includes(ext);
    });

    if (videoFiles.length !== acceptedFiles.length) {
      alert('Only MP4, MOV, and AVI files are supported');
    }

    if (videoFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...videoFiles]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/mp4': ['.mp4'],
      'video/mov': ['.mov'],
      'video/avi': ['.avi']
    },
    maxSize: 5 * 1024 * 1024 * 1024, // 5GB
    multiple: true
  });

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFormChange = (field, value) => {
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

  const uploadFile = async (file, index) => {
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('title', file.name.replace(/\.[^/.]+$/, '')); // Remove extension
    uploadFormData.append('description', `Uploaded video: ${file.name}`);
    uploadFormData.append('level', formData.level);
    uploadFormData.append('accents', JSON.stringify(formData.accents));
    uploadFormData.append('tags', JSON.stringify(formData.tags));
    uploadFormData.append('instructor_name', formData.instructor_name);
    uploadFormData.append('country', formData.country);
    uploadFormData.append('category', formData.category);
    uploadFormData.append('is_premium', formData.is_premium);

    try {
      const response = await axios.post(
        `${API}/admin/videos/upload`,
        uploadFormData,
        {
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(prev => ({
              ...prev,
              [index]: { progress, status: 'uploading', filename: file.name }
            }));
          }
        }
      );

      setUploadProgress(prev => ({
        ...prev,
        [index]: { 
          progress: 100, 
          status: 'completed', 
          filename: file.name,
          result: response.data
        }
      }));

      return { success: true, data: response.data };
    } catch (error) {
      setUploadProgress(prev => ({
        ...prev,
        [index]: { 
          progress: 0, 
          status: 'failed', 
          filename: file.name,
          error: error.response?.data?.detail || error.message
        }
      }));
      return { success: false, error: error.response?.data?.detail || error.message };
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one video file');
      return;
    }

    if (!formData.instructor_name.trim()) {
      alert('Please enter the instructor name');
      return;
    }

    setUploading(true);
    setUploadProgress({});

    const results = await Promise.allSettled(
      selectedFiles.map((file, index) => uploadFile(file, index))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    setUploading(false);

    if (successful > 0) {
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    }

    alert(`Upload completed: ${successful} successful, ${failed} failed`);
  };

  const clearAll = () => {
    setSelectedFiles([]);
    setUploadProgress({});
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        📤 Upload Videos
      </h2>

      {/* Drag & Drop Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-4xl mb-4">📁</div>
        {isDragActive ? (
          <p className="text-blue-600 text-lg">Drop the video files here...</p>
        ) : (
          <div>
            <p className="text-gray-600 text-lg mb-2">
              Drag & drop video files here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Supports MP4, MOV, AVI • Max 5GB per file
            </p>
          </div>
        )}
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            Selected Files ({selectedFiles.length})
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center">
                  <span className="text-blue-600 mr-2">🎥</span>
                  <div>
                    <div className="font-medium">{file.name}</div>
                    <div className="text-sm text-gray-500">
                      {(file.size / (1024 * 1024)).toFixed(1)} MB
                    </div>
                  </div>
                </div>
                
                {uploadProgress[index] ? (
                  <div className="flex items-center">
                    {uploadProgress[index].status === 'uploading' && (
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress[index].progress}%` }}
                        ></div>
                      </div>
                    )}
                    <span className={`text-sm ${
                      uploadProgress[index].status === 'completed' ? 'text-green-600' :
                      uploadProgress[index].status === 'failed' ? 'text-red-600' :
                      'text-blue-600'
                    }`}>
                      {uploadProgress[index].status === 'completed' && '✅ Complete'}
                      {uploadProgress[index].status === 'failed' && '❌ Failed'}
                      {uploadProgress[index].status === 'uploading' && `🔄 ${uploadProgress[index].progress}%`}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                    disabled={uploading}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata Form */}
      {selectedFiles.length > 0 && (
        <div className="mt-6 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Video Metadata</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Instructor Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instructor Name *
              </label>
              <input
                type="text"
                value={formData.instructor_name}
                onChange={(e) => handleFormChange('instructor_name', e.target.value)}
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
                onChange={(e) => handleFormChange('level', e.target.value)}
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
                onChange={(e) => handleFormChange('country', e.target.value)}
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
                onChange={(e) => handleFormChange('category', e.target.value)}
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

            {/* Tags */}
            <div className="md:col-span-2">
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
          </div>

          {/* Accents */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Accents *
            </label>
            <div className="flex flex-wrap gap-3">
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
          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_premium}
                onChange={(e) => handleFormChange('is_premium', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium">💎 Mark as Premium Content</span>
            </label>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {selectedFiles.length > 0 && (
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleUpload}
            disabled={uploading || !formData.instructor_name.trim()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? '⏳ Uploading...' : `🚀 Upload ${selectedFiles.length} Video${selectedFiles.length > 1 ? 's' : ''}`}
          </button>
          
          <button
            onClick={clearAll}
            disabled={uploading}
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminVideoUpload;