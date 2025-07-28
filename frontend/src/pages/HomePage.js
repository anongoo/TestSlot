import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from '../contexts/AuthContext';
import HeroSection from '../components/HeroSection';
import GuestHomepage from '../components/GuestHomepage';
import ProgressTracker from '../components/ProgressTracker';
import VideoLibrary from '../components/VideoLibrary';
import AdminDashboard from '../components/AdminDashboard';
import EmailSubscriptionModal from '../components/EmailSubscriptionModal';
import EmailSubscriptionBanner from '../components/EmailSubscriptionBanner';
import RoleGate from '../components/RoleGate';

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

const HomePage = () => {
  const [sessionId] = useState(getSessionId());
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [hasWatchedVideo, setHasWatchedVideo] = useState(false);
  const { user, isAdmin, isAuthenticated, login } = useAuth();

  // Show email modal after user has watched a video for engagement
  useEffect(() => {
    if (hasWatchedVideo && !localStorage.getItem('email_subscribed') && !isAuthenticated) {
      const timer = setTimeout(() => {
        setShowEmailModal(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [hasWatchedVideo, isAuthenticated]);

  const handleWatchProgress = () => {
    setRefreshProgress(prev => prev + 1);
    setHasWatchedVideo(true);
  };

  const handleEmailSubscriptionSuccess = () => {
    localStorage.setItem('email_subscribed', 'true');
    setShowEmailModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <HeroSection />

      {/* Guest Homepage Content - Only show for non-authenticated users */}
      {!isAuthenticated && <GuestHomepage />}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        
        {/* Admin Dashboard */}
        <RoleGate allowedRoles={['admin']}>
          <AdminDashboard />
        </RoleGate>
        
        {/* Email Subscription Banner (only for non-authenticated users) */}
        {!isAuthenticated && (
          <EmailSubscriptionBanner onSubscribe={() => setShowEmailModal(true)} />
        )}
        
        {/* Progress Tracker - Show for authenticated users and engaged guests */}
        {(isAuthenticated || hasWatchedVideo) && (
          <ProgressTracker sessionId={sessionId} key={refreshProgress} />
        )}
        
        {/* Video Library */}
        <VideoLibrary 
          sessionId={sessionId}
          onWatchProgress={handleWatchProgress}
        />
      </div>

      {/* Email Subscription Modal (only for non-authenticated users) */}
      {!isAuthenticated && (
        <EmailSubscriptionModal 
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          onSuccess={handleEmailSubscriptionSuccess}
        />
      )}
    </div>
  );
};

export default HomePage;