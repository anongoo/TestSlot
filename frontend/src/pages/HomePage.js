import React, { useState } from "react";
import { useAuth } from '../contexts/AuthContext';
import HeroSection from '../components/HeroSection';
import GuestHomepage from '../components/GuestHomepage';
import AdminDashboard from '../components/AdminDashboard';
import EmailSubscriptionModal from '../components/EmailSubscriptionModal';
import EmailSubscriptionBanner from '../components/EmailSubscriptionBanner';
import RoleGate from '../components/RoleGate';

const HomePage = () => {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const { isAuthenticated, user } = useAuth();

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
        
        {/* Admin Dashboard - Only show for admin users, no error message for others */}
        {isAuthenticated && user.role === 'admin' && <AdminDashboard />}
        
        {/* Email Subscription Banner (only for non-authenticated users) */}
        {!isAuthenticated && (
          <EmailSubscriptionBanner onSubscribe={() => setShowEmailModal(true)} />
        )}
        
        {/* Browse Videos Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 text-center">
          <div className="text-6xl mb-4">🎥</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Ready to Start Learning?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Access our complete video library with hundreds of English learning videos organized by level, 
            topic, and series. Perfect for learners at every stage of their journey.
          </p>
          
          <div className="space-y-4">
            <a
              href="/watch"
              className="inline-block bg-blue-600 text-white text-xl font-semibold px-8 py-4 rounded-xl hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              🚀 Browse Videos
            </a>
            
            <div className="text-sm text-gray-500">
              Over 100+ videos • All levels • Free and Premium content
            </div>
          </div>
        </div>

        {/* Features Preview for Logged-in Users */}
        {isAuthenticated && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Track Progress</h3>
              <p className="text-gray-600 text-sm">Monitor your learning hours and build daily streaks</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="text-3xl mb-3">💾</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Save Videos</h3>
              <p className="text-gray-600 text-sm">Create your personal watchlist and access watch history</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="text-3xl mb-3">📚</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Organized Learning</h3>
              <p className="text-gray-600 text-sm">Explore video series and structured learning paths</p>
            </div>
          </div>
        )}
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