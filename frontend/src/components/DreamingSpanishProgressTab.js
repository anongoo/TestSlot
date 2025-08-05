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
  const [showOutsideHoursModal, setShowOutsideHoursModal] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(30);
  const [calendarData, setCalendarData] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (isAuthenticated) {
      fetchProgressData();
      fetchDailyGoal();
      generateCalendarData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, currentMonth]);

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

  const generateCalendarData = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Add days of the month with mock activity data
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      
      // Mock activity level (0-4) - in real implementation, this would come from API
      const activityLevel = Math.floor(Math.random() * 5);
      const minutesWatched = activityLevel * 15; // 0, 15, 30, 45, 60 minutes
      
      days.push({
        day,
        date: dateStr,
        activityLevel,
        minutesWatched,
        goalMet: minutesWatched >= dailyGoal
      });
    }
    
    setCalendarData(days);
  };

  const updateDailyGoal = async (newGoal) => {
    try {
      await axios.post(`${API}/user/daily-goal`, 
        { daily_minutes_goal: newGoal },
        { headers: { 'Authorization': `Bearer ${sessionToken}` }}
      );
      setDailyGoal(newGoal);
      setShowGoalModal(false);
      generateCalendarData(); // Regenerate to update goal met status
    } catch (error) {
      console.error('Error updating daily goal:', error);
    }
  };

  const getActivityColor = (level) => {
    switch (level) {
      case 0: return 'bg-gray-100';
      case 1: return 'bg-green-200';
      case 2: return 'bg-green-300';
      case 3: return 'bg-green-400';
      case 4: return 'bg-green-500';
      default: return 'bg-gray-100';
    }
  };

  const getCurrentLevel = (totalHours) => {
    if (totalHours < 25) return { level: 'New Beginner', icon: '🌱', color: 'text-green-600', progress: (totalHours / 25) * 100 };
    if (totalHours < 75) return { level: 'Beginner', icon: '📚', color: 'text-blue-600', progress: ((totalHours - 25) / 50) * 100 };
    if (totalHours < 200) return { level: 'Intermediate', icon: '🎯', color: 'text-orange-600', progress: ((totalHours - 75) / 125) * 100 };
    return { level: 'Advanced', icon: '🔥', color: 'text-red-600', progress: 100 };
  };

  const getNextLevel = (currentLevel) => {
    const levels = {
      'New Beginner': { next: 'Beginner', hours: 25 },
      'Beginner': { next: 'Intermediate', hours: 75 },
      'Intermediate': { next: 'Advanced', hours: 200 },
      'Advanced': { next: 'Master', hours: 500 }
    };
    return levels[currentLevel] || { next: 'Master', hours: 500 };
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
  
  const levelInfo = getCurrentLevel(totalHours);
  const nextLevelInfo = getNextLevel(levelInfo.level);
  
  // Calculate weeks in a row and hours this month
  const thisMonthHours = Math.floor(Math.random() * 50); // Mock data
  const weeksInARow = Math.floor(currentStreak / 7);

  return (
    <div className="h-full overflow-auto bg-gray-50">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Top-Level Progress Summary */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Level Badge */}
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white mb-4 shadow-lg`}>
                <div className="text-center">
                  <div className="text-4xl mb-1">{levelInfo.icon}</div>
                  <div className="text-sm font-bold">Level</div>
                </div>
              </div>
              <h2 className={`text-2xl font-bold ${levelInfo.color} mb-2`}>{levelInfo.level}</h2>
              <div className="text-gray-600 text-sm">
                {totalHours}h total • {Math.round(levelInfo.progress)}% to next level
              </div>
            </div>

            {/* Level Description */}
            <div className="flex-1 text-center lg:text-left">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Your English Level</h3>
              <div className="space-y-3 text-gray-600">
                {levelInfo.level === 'New Beginner' && (
                  <>
                    <p>🎯 <strong>What you can do:</strong> Understand basic phrases and simple conversations</p>
                    <p>📚 <strong>What you need:</strong> Focus on comprehensible input and listening practice</p>
                    <p>🌱 <strong>What you're learning:</strong> Basic vocabulary and sentence patterns</p>
                  </>
                )}
                {levelInfo.level === 'Beginner' && (
                  <>
                    <p>🎯 <strong>What you can do:</strong> Handle everyday conversations and understand main ideas</p>
                    <p>📚 <strong>What you need:</strong> More complex content and speaking practice</p>
                    <p>📖 <strong>What you're learning:</strong> Grammar patterns and extended vocabulary</p>
                  </>
                )}
                {levelInfo.level === 'Intermediate' && (
                  <>
                    <p>🎯 <strong>What you can do:</strong> Discuss various topics and understand detailed content</p>
                    <p>📚 <strong>What you need:</strong> Specialized vocabulary and fluency practice</p>
                    <p>🎯 <strong>What you're learning:</strong> Nuanced language and cultural context</p>
                  </>
                )}
                {levelInfo.level === 'Advanced' && (
                  <>
                    <p>🎯 <strong>What you can do:</strong> Communicate fluently on complex topics</p>
                    <p>📚 <strong>What you need:</strong> Refinement and specialized knowledge</p>
                    <p>🔥 <strong>What you're learning:</strong> Advanced expressions and cultural nuances</p>
                  </>
                )}
              </div>
              
              {/* Progress to Next Level */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress to {nextLevelInfo.next}</span>
                  <span className="text-sm text-gray-500">{totalHours}h / {nextLevelInfo.hours}h</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${levelInfo.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Goal Tracker */}
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
              <span className="text-lg font-medium text-gray-700">
                {todayMinutes} / {dailyGoal} minutes today
              </span>
              <span className="text-sm text-gray-500">{Math.round(goalProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-500 h-4 rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                style={{ width: `${goalProgress}%` }}
              >
                {goalProgress >= 100 && <span className="text-white text-xs font-bold">✓</span>}
              </div>
            </div>
          </div>
          
          {goalProgress >= 100 && (
            <div className="text-center py-3 bg-green-50 rounded-lg">
              <span className="text-3xl animate-bounce inline-block">🎉</span>
              <span className="ml-2 text-green-700 font-semibold">Daily goal completed!</span>
            </div>
          )}
        </div>

        {/* Calendar-style Tracker */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Your Activity</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                ←
              </button>
              <span className="font-medium min-w-32 text-center">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                →
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{currentStreak}</div>
              <div className="text-sm text-gray-600">Current Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{weeksInARow}</div>
              <div className="text-sm text-gray-600">Weeks in a Row</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{thisMonthHours}h</div>
              <div className="text-sm text-gray-600">Hours This Month</div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {weekDays.map(day => (
              <div key={day} className="p-2 text-center text-xs font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {calendarData.map((day, index) => (
              <div key={index} className="aspect-square">
                {day ? (
                  <div 
                    className={`w-full h-full rounded-lg ${getActivityColor(day.activityLevel)} border border-gray-200 flex items-center justify-center text-xs font-medium transition-colors hover:ring-2 hover:ring-blue-300 cursor-pointer`}
                    title={`${day.date}: ${day.minutesWatched} minutes${day.goalMet ? ' ✓' : ''}`}
                  >
                    <div className="text-center">
                      <div className="text-gray-700">{day.day}</div>
                      {day.goalMet && <div className="text-green-600 text-xs">✓</div>}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full"></div>
                )}
              </div>
            ))}
          </div>

          {/* Activity Legend */}
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-600">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map(level => (
              <div key={level} className={`w-3 h-3 rounded ${getActivityColor(level)}`}></div>
            ))}
            <span>More</span>
          </div>
        </div>

        {/* Outside Hours Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Outside Hours</h2>
            <button 
              onClick={() => setShowOutsideHoursModal(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              ➕ Add Hours
            </button>
          </div>
          <p className="text-gray-600 mb-4">
            Track your English learning outside of English Fiesta videos - reading, conversations, movies, podcasts, etc.
          </p>
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📚</div>
            <div className="font-medium">No outside hours logged yet</div>
            <div className="text-sm mt-1">Add your other English learning activities</div>
          </div>
        </div>

        {/* Milestones Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Milestones & Achievements</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Total Hours Milestone */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg">
              <div className="text-2xl mb-2">🎯</div>
              <div className="text-lg font-semibold">{totalHours} Hours Watched</div>
              <div className="text-sm opacity-90">Keep up the great work!</div>
            </div>

            {/* Streak Milestone */}
            <div className={`p-4 rounded-lg ${currentStreak >= 7 ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
              <div className="text-2xl mb-2">{currentStreak >= 7 ? '🔥' : '📅'}</div>
              <div className="text-lg font-semibold">{currentStreak} Day Streak</div>
              <div className="text-sm opacity-90">
                {currentStreak >= 7 ? 'Amazing consistency!' : 'Build your streak!'}
              </div>
            </div>

            {/* Level Achievement */}
            <div className={`p-4 rounded-lg bg-gradient-to-r from-green-500 to-teal-600 text-white`}>
              <div className="text-2xl mb-2">{levelInfo.icon}</div>
              <div className="text-lg font-semibold">{levelInfo.level}</div>
              <div className="text-sm opacity-90">Current English level</div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Goal Settings Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Daily Goal Settings</h3>
            
            <div className="space-y-3 mb-6">
              {[
                { label: 'Casual', minutes: 15, icon: '🌱', desc: 'Perfect for busy schedules' },
                { label: 'Learner', minutes: 30, icon: '📚', desc: 'Balanced daily progress' },
                { label: 'Serious', minutes: 60, icon: '🔥', desc: 'Intensive learning' }
              ].map((preset) => (
                <button
                  key={preset.minutes}
                  onClick={() => updateDailyGoal(preset.minutes)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                    dailyGoal === preset.minutes
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <span>{preset.icon}</span>
                        <span>{preset.label}</span>
                      </div>
                      <div className="text-sm text-gray-600">{preset.minutes} minutes per day</div>
                      <div className="text-xs text-gray-500">{preset.desc}</div>
                    </div>
                    {dailyGoal === preset.minutes && (
                      <div className="text-blue-500 text-xl">✓</div>
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

      {/* Outside Hours Modal */}
      {showOutsideHoursModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Add Outside Hours</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Activity Type</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option>Movies/TV Shows</option>
                  <option>Reading</option>
                  <option>Conversations</option>
                  <option>Podcasts/Audiobooks</option>
                  <option>Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                <input 
                  type="number" 
                  placeholder="60"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input 
                  type="date" 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowOutsideHoursModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Add outside hours logic here
                  alert('Outside hours functionality coming soon!');
                  setShowOutsideHoursModal(false);
                }}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Add Hours
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DreamingSpanishProgressTab;