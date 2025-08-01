import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import LanguageLevels from './LanguageLevels';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Generate or get session ID for guest users
const getSessionId = () => {
  let sessionId = localStorage.getItem('english_fiesta_session');
  if (!sessionId) {
    sessionId = 'guest_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('english_fiesta_session', sessionId);
  }
  return sessionId;
};

const ProgressTab = () => {
  const { isAuthenticated } = useAuth();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionId] = useState(getSessionId());
  const [activeTimeframe, setActiveTimeframe] = useState('week'); // 'week', 'month', 'all'

  useEffect(() => {
    if (isAuthenticated) {
      fetchProgressData();
    }
  }, [isAuthenticated]);

  const fetchProgressData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/progress/${sessionId}`);
      setProgress(response.data);
    } catch (error) {
      console.error('Error fetching progress data:', error);
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

  // Generate sample data for the chart (in a real app, this would come from the API)
  const generateChartData = () => {
    const days = [];
    const today = new Date();
    const timeframeMap = { week: 7, month: 30, all: 90 };
    const daysToShow = timeframeMap[activeTimeframe];

    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate sample data (in real app, this would be actual user data)
      const minutesWatched = Math.floor(Math.random() * 60) + (i < 7 ? 20 : 0); // More recent activity
      
      days.push({
        date: date.toISOString().split('T')[0],
        dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        minutes: minutesWatched
      });
    }
    
    return days;
  };

  const chartData = generateChartData();
  const maxMinutes = Math.max(...chartData.map(d => d.minutes), 60);

  if (!isAuthenticated) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-6">📊</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Sign in to view your Progress</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Track your learning journey with detailed progress analytics, time tracking, and achievement milestones.
        </p>
        <a
          href="/"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Sign Up / Login
        </a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const { stats, breakdown } = progress;

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Learning Overview</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
            <div className="text-2xl mb-2">⏱️</div>
            <div className="text-2xl font-bold text-blue-600">{breakdown.total_hours}h</div>
            <div className="text-sm text-blue-800">Total Hours</div>
          </div>
          
          <div className="text-center bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
            <div className="text-2xl mb-2">🔥</div>
            <div className="text-2xl font-bold text-green-600">{stats.current_streak}</div>
            <div className="text-sm text-green-800">Day Streak</div>
          </div>
          
          <div className="text-center bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
            <div className="text-2xl mb-2">🏆</div>
            <div className="text-2xl font-bold text-purple-600">{Math.floor(stats.personal_best_day / 60)}h {stats.personal_best_day % 60}m</div>
            <div className="text-sm text-purple-800">Personal Best</div>
          </div>
          
          <div className="text-center bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
            <div className="text-2xl mb-2">🎥</div>
            <div className="text-2xl font-bold text-orange-600">{progress.total_videos_watched}</div>
            <div className="text-sm text-orange-800">Videos Watched</div>
          </div>
        </div>
      </div>

      {/* Learning Progress Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Learning Activity</h3>
          
          {/* Timeframe Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[
              { key: 'week', label: '7 Days' },
              { key: 'month', label: '30 Days' },
              { key: 'all', label: '90 Days' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTimeframe(key)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  activeTimeframe === key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="h-64 flex items-end justify-between gap-1 bg-gray-50 rounded-lg p-4">
          {chartData.map((day, index) => (
            <div key={day.date} className="flex flex-col items-center flex-1 max-w-[20px]">
              {/* Bar */}
              <div
                className="bg-blue-500 rounded-t min-h-[2px] w-full mb-2 hover:bg-blue-600 transition-colors cursor-pointer relative group"
                style={{ height: `${(day.minutes / maxMinutes) * 100}%` }}
                title={`${day.dateLabel}: ${day.minutes}min`}
              >
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                  {day.dateLabel}: {day.minutes}min
                </div>
              </div>
              
              {/* Date Label */}
              <div className="text-xs text-gray-500 transform -rotate-45 origin-top-left">
                {activeTimeframe === 'week' ? day.dateLabel.split(' ')[1] : day.dateLabel.split(' ')[0]}
              </div>
            </div>
          ))}
        </div>

        {/* Chart Legend */}
        <div className="mt-4 text-center text-sm text-gray-600">
          Daily minutes watched • Hover for details
        </div>
      </div>

      {/* Learning Sources Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Platform vs Manual */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Learning Sources</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-gray-700">English Fiesta</span>
              </div>
              <span className="font-semibold text-blue-600">{breakdown.platform_hours}h</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-gray-700">Outside Activities</span>
              </div>
              <span className="font-semibold text-green-600">{breakdown.manual_hours}h</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
              <div className="flex h-full rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500" 
                  style={{ width: `${(breakdown.platform_hours / breakdown.total_hours) * 100}%` }}
                ></div>
                <div 
                  className="bg-green-500" 
                  style={{ width: `${(breakdown.manual_hours / breakdown.total_hours) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Progress by Level</h3>
          
          {Object.keys(stats.level_progress).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.level_progress).map(([level, minutes]) => {
                const hours = Math.floor(minutes / 60);
                const remainingMins = minutes % 60;
                const percentage = (minutes / stats.total_minutes_watched) * 100;
                
                return (
                  <div key={level}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">{level}</span>
                      <span className="text-sm text-gray-600">{hours}h {remainingMins}m</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-3xl mb-2">📊</div>
              <p>Start watching videos to see level progress</p>
            </div>
          )}
        </div>
      </div>

      {/* Achievements */}
      {stats.milestones_achieved.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🏆 Achievements</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.milestones_achieved.map((milestone, index) => (
              <div key={index} className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🎉</div>
                <div className="font-semibold text-yellow-800">{milestone}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Activity Breakdown */}
      {Object.keys(stats.manual_activity_breakdown || {}).some(key => stats.manual_activity_breakdown[key] > 0) && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Outside Learning Activities</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(stats.manual_activity_breakdown || {}).map(([activity, minutes]) => (
              minutes > 0 && (
                <div key={activity} className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">
                    {activity === 'Movies/TV Shows' && '🎬'}
                    {activity === 'Audiobooks/Podcasts' && '🎧'}
                    {activity === 'Talking with friends' && '💬'}
                  </div>
                  <div className="font-semibold text-green-800">{activity}</div>
                  <div className="text-green-600">{Math.floor(minutes / 60)}h {minutes % 60}m</div>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressTab;