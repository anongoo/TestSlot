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
    const initializeAuth = async () => {
      // Check for auth redirect with session_id first
      const hash = window.location.hash;
      if (hash.includes('session_id=')) {
        const sessionId = hash.split('session_id=')[1].split('&')[0]; // Handle multiple hash params
        await handleEmergentAuth(sessionId);
        return;
      }

      // If we have a stored token, fetch user profile
      if (sessionToken) {
        await fetchUserProfile();
      } else {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []); // Remove sessionToken dependency to prevent loops

  // Separate useEffect to handle sessionToken changes after initial load
  useEffect(() => {
    if (sessionToken && user === null && !loading) {
      fetchUserProfile();
    }
  }, [sessionToken]);

  const handleEmergentAuth = async (sessionId) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API}/auth/session`, {
        session_id: sessionId
      });

      const userData = response.data;
      
      // Store token first in localStorage
      localStorage.setItem('english_fiesta_token', userData.session_token);
      
      // Then update state
      setSessionToken(userData.session_token);
      setUser(userData);
      
      // Clear the hash from URL
      window.location.hash = '';
      
      // Check for stored redirect path, default to /watch
      const redirectPath = localStorage.getItem('auth_redirect_path') || '/watch';
      localStorage.removeItem('auth_redirect_path'); // Clear after use
      
      // Use replace instead of pathname assignment for better mobile compatibility
      window.history.replaceState({}, '', redirectPath);
      
      // Force a page reload to ensure React router picks up the new path
      setTimeout(() => {
        window.location.href = redirectPath;
      }, 100);
      
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