import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const RoleGate = ({ allowedRoles, children, fallback = null }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated && allowedRoles.includes('guest')) {
    return children;
  }
  
  if (!isAuthenticated) {
    return fallback || (
      <div className="text-center py-4">
        <p className="text-gray-600 text-sm">Please log in to access this content.</p>
      </div>
    );
  }
  
  if (allowedRoles.includes(user.role)) {
    return children;
  }
  
  return fallback || (
    <div className="text-center py-4">
      <p className="text-red-600 text-sm">Insufficient permissions.</p>
    </div>
  );
};

export default RoleGate;