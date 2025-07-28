import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const PremiumGate = ({ video, children }) => {
  const { isStudent, login } = useAuth();
  
  if (!video.is_premium) {
    return children;
  }
  
  if (!isStudent) {
    return (
      <div className="text-center py-2">
        <div className="text-yellow-500 text-lg mb-1">💎</div>
        <p className="text-xs text-gray-600 mb-2">Premium Content</p>
        <button
          onClick={login}
          className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
        >
          Login for Access
        </button>
      </div>
    );
  }
  
  return children;
};

export default PremiumGate;