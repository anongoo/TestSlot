import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SetDailyGoalModal = ({ isOpen, onClose, currentGoal, onGoalUpdated }) => {
  const { sessionToken } = useAuth();
  const [selectedGoal, setSelectedGoal] = useState(currentGoal || 30);
  const [customGoal, setCustomGoal] = useState('');
  const [goalType, setGoalType] = useState('preset'); // 'preset' or 'custom'
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && currentGoal) {
      // Determine if current goal matches a preset
      if ([15, 30, 60].includes(currentGoal)) {
        setGoalType('preset');
        setSelectedGoal(currentGoal);
      } else {
        setGoalType('custom');
        setCustomGoal(currentGoal.toString());
        setSelectedGoal(currentGoal);
      }
    }
  }, [isOpen, currentGoal]);

  const presetGoals = [
    { value: 15, label: 'Casual', description: '15 min/day' },
    { value: 30, label: 'Learner', description: '30 min/day' },
    { value: 60, label: 'Serious', description: '60 min/day' }
  ];

  const handlePresetSelect = (value) => {
    setGoalType('preset');
    setSelectedGoal(value);
    setCustomGoal('');
  };

  const handleCustomSelect = () => {
    setGoalType('custom');
    setCustomGoal(selectedGoal.toString());
  };

  const handleCustomGoalChange = (e) => {
    const value = e.target.value;
    setCustomGoal(value);
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      setSelectedGoal(numValue);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let finalGoal = selectedGoal;
    if (goalType === 'custom') {
      const customValue = parseInt(customGoal);
      if (isNaN(customValue) || customValue < 1 || customValue > 480) {
        alert('Please enter a valid goal between 1 and 480 minutes.');
        return;
      }
      finalGoal = customValue;
    }

    if (finalGoal === currentGoal) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    
    try {
      const headers = { 'Authorization': `Bearer ${sessionToken}` };
      await axios.post(`${API}/user/daily-goal`, {
        daily_minutes_goal: finalGoal
      }, { headers });

      if (onGoalUpdated) {
        onGoalUpdated();
      }
      
      onClose();
    } catch (error) {
      console.error('Error updating daily goal:', error);
      alert(error.response?.data?.detail || 'Failed to update daily goal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Set Daily Goal</h2>
              <p className="text-gray-600 text-sm">How many minutes do you want to watch each day?</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Preset Goals */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose a preset goal:
            </label>
            <div className="space-y-2">
              {presetGoals.map((preset) => (
                <label key={preset.value} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="goalType"
                    checked={goalType === 'preset' && selectedGoal === preset.value}
                    onChange={() => handlePresetSelect(preset.value)}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800">{preset.label}</span>
                      <span className="text-purple-600 font-semibold">{preset.description}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Goal */}
          <div>
            <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="goalType"
                checked={goalType === 'custom'}
                onChange={handleCustomSelect}
                className="text-purple-600 focus:ring-purple-500"
              />
              <div className="ml-3 flex-1">
                <span className="font-medium text-gray-800">Custom Goal</span>
              </div>
            </label>
            
            {goalType === 'custom' && (
              <div className="mt-3 ml-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={customGoal}
                    onChange={handleCustomGoalChange}
                    min="1"
                    max="480"
                    placeholder="Enter minutes"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required={goalType === 'custom'}
                  />
                  <span className="text-gray-600 text-sm">minutes/day</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Between 1 and 480 minutes (8 hours)</p>
              </div>
            )}
          </div>

          {/* Current Selection Display */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-purple-800 font-medium">Your new daily goal:</span>
              <span className="text-purple-600 font-bold text-lg">
                {goalType === 'custom' && customGoal ? parseInt(customGoal) || 0 : selectedGoal} minutes
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (goalType === 'custom' && (!customGoal || parseInt(customGoal) < 1 || parseInt(customGoal) > 480))}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetDailyGoalModal;