import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import ManualActivityModal from './ManualActivityModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProgressTracker = ({ sessionId }) => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const { sessionToken } = useAuth();

  useEffect(() => {
    fetchProgress();
  }, [sessionId]);

  const fetchProgress = async () => {
    try {
      const response = await axios.get(`${API}/progress/${sessionId}`);
      setProgress(response.data);
    } catch (error) {
      console.error('Error fetching progress:', error);
      // Set default empty progress if API fails
      setProgress({
        stats: {
          total_minutes_watched: 0,
          platform_minutes: 0,
          manual_minutes: 0,
          current_streak: 0,
          longest_streak: 0,
          personal_best_day: 0,
          level_progress: {},
          milestones_achieved: [],
          manual_activity_breakdown: {}
        },
        recent_activity: [],
        total_videos_watched: 0,
        total_manual_activities: 0,
        breakdown: {
          platform_hours: 0,
          manual_hours: 0,
          total_hours: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActivityLogged = () => {
    setShowActivityModal(false);
    fetchProgress(); // Refresh progress after logging activity
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { stats, breakdown } = progress;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <span className="text-blue-600 mr-2">📊</span>
          Your Learning Journey
        </h2>
        
        <button
          onClick={() => setShowActivityModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <span>+</span>
          Log Activity
        </button>
      </div>
      
      {/* Main Progress Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg text-center">
          <div className="text-2xl font-bold">{breakdown.total_hours}h</div>
          <div className="text-sm opacity-90">Total Hours</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-lg text-center">
          <div className="text-2xl font-bold">{stats.current_streak}</div>
          <div className="text-sm opacity-90">Current Streak</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-lg text-center">
          <div className="text-2xl font-bold">{Math.floor(stats.personal_best_day / 60)}h {stats.personal_best_day % 60}m</div>
          <div className="text-sm opacity-90">Personal Best</div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-lg text-center">
          <div className="text-2xl font-bold">{progress.total_videos_watched}</div>
          <div className="text-sm opacity-90">Videos Watched</div>
        </div>
      </div>

      {/* Platform vs Manual Breakdown */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Learning Sources</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-gray-600">Platform Videos</div>
            <div className="text-lg font-bold text-blue-600">{breakdown.platform_hours}h</div>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-gray-600">Manual Activities</div>
            <div className="text-lg font-bold text-green-600">{breakdown.manual_hours}h</div>
          </div>
          
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-gray-600">Total Activities</div>
            <div className="text-lg font-bold text-purple-600">{progress.total_manual_activities}</div>
          </div>
        </div>
      </div>

      {/* Manual Activity Breakdown */}
      {Object.keys(stats.manual_activity_breakdown || {}).some(key => stats.manual_activity_breakdown[key] > 0) && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Activity Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(stats.manual_activity_breakdown || {}).map(([activity, minutes]) => (
              minutes > 0 && (
                <div key={activity} className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-gray-600">{activity}</div>
                  <div className="text-lg font-bold text-gray-800">{Math.floor(minutes / 60)}h {minutes % 60}m</div>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Level Progress */}
      {Object.keys(stats.level_progress).length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Progress by Level</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(stats.level_progress).map(([level, minutes]) => (
              <div key={level} className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-600">{level}</div>
                <div className="text-lg font-bold text-blue-600">{Math.floor(minutes / 60)}h {minutes % 60}m</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Milestones */}
      {stats.milestones_achieved.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Achievements 🏆</h3>
          <div className="flex flex-wrap gap-2">
            {stats.milestones_achieved.map((milestone, index) => (
              <span key={index} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                🎉 {milestone}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Manual Activity Modal */}
      <ManualActivityModal 
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        onSuccess={handleActivityLogged}
        sessionId={sessionId}
        sessionToken={sessionToken}
      />
    </div>
  );
};

export default ProgressTracker;