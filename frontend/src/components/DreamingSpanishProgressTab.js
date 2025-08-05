import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DreamingSpanishProgressTab = () => {
  const { isAuthenticated, sessionToken } = useAuth();
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(30);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProgressData();
      fetchDailyGoal();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchProgressData = async () => {
    try {
      const sessionId = localStorage.getItem('english_fiesta_session') || 
        'guest_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      
      const response = await axios.get(`${API}/progress/${sessionId}`, {
        headers: sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {}
      });
      setProgressData(response.data);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyGoal = async () => {
    try {
      const response = await axios.get(`${API}/user/daily-goal`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      setDailyGoal(response.data.daily_goal || 30);
    } catch (error) {
      console.log('Using default daily goal');
    }
  };

  const updateDailyGoal = async (newGoal) => {
    try {
      await axios.post(`${API}/user/daily-goal`, 
        { daily_minutes_goal: newGoal },
        { headers: { 'Authorization': `Bearer ${sessionToken}` }}
      );
      setDailyGoal(newGoal);
      setShowGoalModal(false);
    } catch (error) {
      console.error('Error updating daily goal:', error);
    }
  };

  // If not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Login Required</h3>
          <p className="text-gray-500 mb-4">Sign in to track your learning progress</p>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalMinutes = progressData?.total_minutes_watched || 0;
  const totalHours = Math.floor(totalMinutes / 60);
  const currentStreak = progressData?.current_streak || 0;
  const todayMinutes = progressData?.today_minutes || 0;
  const goalProgress = Math.min((todayMinutes / dailyGoal) * 100, 100);

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Learning Progress</h1>
          <p className="text-gray-600">Track your English learning journey</p>
        </div>

        {/* Daily Goal Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Daily Goal</h2>
            <button
              onClick={() => setShowGoalModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              ⚙️ Settings
            </button>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {todayMinutes} / {dailyGoal} minutes today
              </span>
              <span className="text-sm text-gray-500">{Math.round(goalProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${goalProgress}%` }}
              ></div>
            </div>
          </div>
          
          {goalProgress >= 100 && (
            <div className="text-center py-2">
              <span className="text-2xl">🎉</span>
              <span className="ml-2 text-green-600 font-semibold">Goal completed!</span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Hours */}
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{totalHours}h</div>
            <div className="text-gray-600">Total Hours Watched</div>
            <div className="text-sm text-gray-500 mt-1">{totalMinutes} minutes</div>
          </div>

          {/* Current Streak */}
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">{currentStreak}</div>
            <div className="text-gray-600">Day Streak</div>
            <div className="text-sm text-gray-500 mt-1">
              {currentStreak > 0 ? '🔥 Keep it up!' : 'Start your streak!'}
            </div>
          </div>

          {/* Level Progress */}
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {progressData?.level_progress?.current_level || 'New Beginner'}
            </div>
            <div className="text-gray-600">Current Level</div>
            <div className="text-sm text-gray-500 mt-1">Keep learning to level up!</div>
          </div>
        </div>

        {/* Outside Hours Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Outside Hours</h2>
            <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
              ➕ Add Hours
            </button>
          </div>
          <p className="text-gray-600 mb-4">
            Track your English learning outside of English Fiesta videos
          </p>
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📚</div>
            <div>No outside hours logged yet</div>
            <div className="text-sm mt-1">Add reading, conversations, or other activities</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
          {progressData?.recent_activity && progressData.recent_activity.length > 0 ? (
            <div className="space-y-3">
              {progressData.recent_activity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <div className="font-medium text-gray-800">{activity.date}</div>
                    <div className="text-sm text-gray-600">{activity.videos_count} videos watched</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-blue-600">{activity.minutes} min</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📊</div>
              <div>No recent activity</div>
              <div className="text-sm mt-1">Start watching videos to see your progress</div>
            </div>
          )}
        </div>
      </div>

      {/* Daily Goal Settings Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Daily Goal Settings</h3>
            
            <div className="space-y-3 mb-6">
              {[
                { label: 'Casual', minutes: 15, icon: '🌱' },
                { label: 'Learner', minutes: 30, icon: '📚' },
                { label: 'Serious', minutes: 60, icon: '🔥' }
              ].map((preset) => (
                <button
                  key={preset.minutes}
                  onClick={() => updateDailyGoal(preset.minutes)}
                  className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                    dailyGoal === preset.minutes
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{preset.icon} {preset.label}</div>
                      <div className="text-sm text-gray-600">{preset.minutes} minutes per day</div>
                    </div>
                    {dailyGoal === preset.minutes && (
                      <div className="text-blue-500">✓</div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowGoalModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DreamingSpanishProgressTab;