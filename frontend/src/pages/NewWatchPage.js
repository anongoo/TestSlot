import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DailyGoalProgressBar from '../components/DailyGoalProgressBar';

// Import new tab components
import DreamingSpanishWatchTab from '../components/DreamingSpanishWatchTab';
import DreamingSpanishSeriesTab from '../components/DreamingSpanishSeriesTab';
import DreamingSpanishLibraryTab from '../components/DreamingSpanishLibraryTab';
import DreamingSpanishProgressTab from '../components/DreamingSpanishProgressTab';

const NewWatchPage = () => {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState('watch');
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check for mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Tabs configuration matching Dreaming Spanish
  const tabs = [
    { 
      id: 'watch', 
      label: 'Watch', 
      icon: '▶️', 
      component: DreamingSpanishWatchTab,
      description: 'Browse all videos'
    },
    { 
      id: 'series', 
      label: 'Series', 
      icon: '📚', 
      component: DreamingSpanishSeriesTab,
      description: 'Video series and collections'
    },
    { 
      id: 'library', 
      label: 'Library', 
      icon: '💾', 
      component: DreamingSpanishLibraryTab, 
      authRequired: true,
      description: 'My List + My Series'
    },
    ...(isAuthenticated ? [{
      id: 'progress', 
      label: 'Progress', 
      icon: '📊', 
      component: DreamingSpanishProgressTab, 
      authRequired: true,
      description: 'Your learning progress'
    }] : [])
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || DreamingSpanishWatchTab;

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Daily Goal Progress Bar - Always visible at top */}
      <DailyGoalProgressBar />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Dreaming Spanish Style */}
        <div className={`
          ${isMobile ? 'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform' : 'w-64 flex-shrink-0'}
          ${isMobile && !mobileMenuOpen ? '-translate-x-full' : 'translate-x-0'}
          bg-gray-900 text-white shadow-lg
        `}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src="/english-fiesta-logo.png" 
                  alt="English Fiesta" 
                  className="w-8 h-8"
                />
                <h2 className="font-bold text-lg">English Fiesta</h2>
              </div>
              {isMobile && (
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex-1 p-4">
            <div className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{tab.label}</div>
                    <div className="text-xs opacity-75">{tab.description}</div>
                  </div>
                  {tab.authRequired && !isAuthenticated && (
                    <span className="text-xs bg-gray-700 px-2 py-1 rounded">Login</span>
                  )}
                </button>
              ))}
            </div>
          </nav>

          {/* User Status */}
          <div className="p-4 border-t border-gray-700">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{user.name}</div>
                  <div className="text-xs text-gray-400 capitalize">{user.role}</div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-2">Not logged in</div>
                <a
                  href="/"
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Sign Up / Login
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobile && mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          {isMobile && (
            <div className="bg-white shadow-sm p-4 flex items-center justify-between">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="font-bold text-gray-900">
                {tabs.find(tab => tab.id === activeTab)?.label || 'English Fiesta'}
              </h1>
              <div className="w-6"></div>
            </div>
          )}

          {/* Tab Content */}
          <div className="flex-1 overflow-auto bg-white">
            <ActiveComponent />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewWatchPage;