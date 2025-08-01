import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import SetDailyGoalModal from './SetDailyGoalModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DailyGoalProgressBar = () => {
  const { isAuthenticated, isStudent, sessionToken } = useAuth();
  const [goalData, setGoalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated && isStudent) {
      fetchGoalData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, isStudent]);

  const fetchGoalData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${sessionToken}` };
      const response = await axios.get(`${API}/user/daily-goal`, { headers });
      setGoalData(response.data);
    } catch (error) {
      console.error('Error fetching daily goal data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoalUpdated = () => {
    fetchGoalData(); // Refresh data after goal is updated
  };

  // Don't show for unauthenticated users or non-students
  if (!isAuthenticated || !isStudent) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="animate-pulse bg-white bg-opacity-30 h-4 w-32 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!goalData) {
    return null;
  }

  const progressWidth = Math.min(goalData.progress_percentage, 100);
  const isCompleted = goalData.goal_completed;

  return (
    <>
      <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white py-3 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            {/* Goal Progress Text */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">
                Daily Goal:
              </span>
              <span className="text-lg font-bold">
                {goalData.minutes_watched_today} / {goalData.daily_goal} min
              </span>
              {isCompleted && (
                <span className="text-yellow-300 ml-2">🎉</span>
              )}
            </div>

            {/* Progress Bar */}
            <div className="flex-1 max-w-md">
              <div className="bg-white bg-opacity-30 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    isCompleted 
                      ? 'bg-yellow-400' 
                      : 'bg-white'
                  }`}
                  style={{ width: `${progressWidth}%` }}
                />
              </div>
            </div>

            {/* Streak Counter */}
            {goalData.streak_days > 0 && (
              <div className="hidden sm:flex items-center space-x-1 bg-white bg-opacity-20 px-3 py-1 rounded-full">
                <span className="text-yellow-300">🔥</span>
                <span className="text-sm font-medium">{goalData.streak_days} day{goalData.streak_days !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {/* Edit Goal Button */}
          <button
            onClick={() => setShowGoalModal(true)}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-colors ml-4"
            title="Edit daily goal"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </button>
        </div>

        {/* Mobile Streak Display */}
        {goalData.streak_days > 0 && (
          <div className="sm:hidden flex justify-center mt-2">
            <div className="flex items-center space-x-1 bg-white bg-opacity-20 px-3 py-1 rounded-full">
              <span className="text-yellow-300">🔥</span>
              <span className="text-sm font-medium">{goalData.streak_days} day{goalData.streak_days !== 1 ? 's' : ''} streak</span>
            </div>
          </div>
        )}
      </div>

      {/* Set Daily Goal Modal */}
      <SetDailyGoalModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        currentGoal={goalData.daily_goal}
        onGoalUpdated={handleGoalUpdated}
      />
    </>
  );
};

export default DailyGoalProgressBar;