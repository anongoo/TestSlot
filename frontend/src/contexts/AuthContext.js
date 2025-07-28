import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Authentication Context
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState(() => 
    localStorage.getItem('english_fiesta_token')
  );

  useEffect(() => {
    if (sessionToken) {
      fetchUserProfile();
    } else {
      // Check for auth redirect with session_id
      const hash = window.location.hash;
      if (hash.includes('session_id=')) {
        const sessionId = hash.split('session_id=')[1];
        handleEmergentAuth(sessionId);
      } else {
        setLoading(false);
      }
    }
  }, [sessionToken]);

  const handleEmergentAuth = async (sessionId) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API}/auth/session`, {
        session_id: sessionId
      });

      const userData = response.data;
      setUser(userData);
      setSessionToken(userData.session_token);
      localStorage.setItem('english_fiesta_token', userData.session_token);
      
      // Clear the hash from URL
      window.location.hash = '';
      
      // Redirect to main app
      window.location.pathname = '/';
    } catch (error) {
      console.error('Authentication failed:', error);
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`${API}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    const redirectUrl = encodeURIComponent(window.location.origin + '/profile');
    window.location.href = `https://auth.emergentagent.com/?redirect=${redirectUrl}`;
  };

  const logout = async () => {
    try {
      if (sessionToken) {
        await axios.post(`${API}/auth/logout`, {}, {
          headers: {
            'Authorization': `Bearer ${sessionToken}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setSessionToken(null);
      localStorage.removeItem('english_fiesta_token');
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    sessionToken,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isInstructor: user?.role === 'instructor' || user?.role === 'admin',
    isStudent: user?.role === 'student' || user?.role === 'instructor' || user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};