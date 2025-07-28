import React, { useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ManualActivityModal = ({ isOpen, onClose, onSuccess, sessionId, sessionToken }) => {
  const [activityType, setActivityType] = useState('Movies/TV Shows');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  });
  const [title, setTitle] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const activityTypes = [
    'Movies/TV Shows',
    'Audiobooks/Podcasts', 
    'Talking with friends'
  ];

  const difficultyLevels = [
    'New Beginner',
    'Beginner',
    'Intermediate',
    'Advanced'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const totalMinutes = (hours * 60) + minutes;
    if (totalMinutes <= 0) {
      setMessage('Please enter a valid duration.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const headers = sessionToken ? 
        { 'Authorization': `Bearer ${sessionToken}` } : {};
      
      const response = await axios.post(`${API}/activities/manual`, {
        activity_type: activityType,
        duration_minutes: totalMinutes,
        date: date,
        title: title || null,
        difficulty_level: difficultyLevel || null
      }, {
        params: { session_id: sessionId },
        headers
      });

      setMessage('✅ Activity logged successfully!');
      setTimeout(() => {
        onSuccess && onSuccess();
        // Reset form
        setHours(0);
        setMinutes(0);
        setTitle('');
        setDifficultyLevel('');
        setMessage('');
      }, 1500);
    } catch (error) {
      console.error('Error logging activity:', error);
      setMessage('Failed to log activity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 max-h-90vh overflow-y-auto">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">📝</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Log Learning Activity</h2>
          <p className="text-gray-600">Add your outside English learning time</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Activity Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Activity Type *
            </label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {activityTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration *
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={hours}
                  onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <label className="text-xs text-gray-500">Hours</label>
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <label className="text-xs text-gray-500">Minutes</label>
              </div>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title/Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Friends Episode, Harry Potter audiobook..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Difficulty Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty Level (Optional)
            </label>
            <select
              value={difficultyLevel}
              onChange={(e) => setDifficultyLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select difficulty</option>
              {difficultyLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (hours === 0 && minutes === 0)}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Logging...' : 'Log Activity'}
            </button>
          </div>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm text-center ${
            message.includes('✅') 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManualActivityModal;