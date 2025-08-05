import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import WatchTab from '../components/WatchTab';
import SeriesTab from '../components/SeriesTab';
import MyListTab from '../components/MyListTab';
import ProgressTab from '../components/ProgressTab';
import DailyGoalProgressBar from '../components/DailyGoalProgressBar';

const WatchPage = () => {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState('watch');
  const [debugVideos, setDebugVideos] = useState([]);
  const [debugSetSelectedVideo, setDebugSetSelectedVideo] = useState(null);

  // Callback to receive debug functionality from WatchTab
  const handleDebugVideoSelect = (videos, setSelectedVideoFn) => {
    console.log('🔧 Debug callback received:', videos.length, 'videos');
    setDebugVideos(videos);
    setDebugSetSelectedVideo(() => setSelectedVideoFn);
  };

  // Tabs configuration
  const tabs = [
    { id: 'watch', label: '🎥 Watch', icon: '🎥', component: WatchTab },
    { id: 'series', label: '📚 Series', icon: '📚', component: SeriesTab },
    { id: 'mylist', label: '💾 My List', icon: '💾', component: MyListTab, authRequired: true },
    ...(isAuthenticated ? [
      { id: 'progress', label: '📊 Progress', icon: '📊', component: ProgressTab, authRequired: true }
    ] : [])
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || WatchTab;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Daily Goal Progress Bar - Only on Watch Page */}
      <DailyGoalProgressBar />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                English Fiesta Videos
              </h1>
              <p className="text-gray-600 mt-2">
                Learn English naturally through comprehensible input
              </p>
              
              {/* Debug: Test video selection button */}
              <button
                onClick={() => {
                  console.log('🧪 Debug button clicked');
                  console.log('📊 Debug state:', { 
                    videosCount: debugVideos.length, 
                    hasSetFunction: !!debugSetSelectedVideo,
                    activeTab 
                  });
                  const testVideo = debugVideos.find(v => v.title?.includes('babycrawl')) || debugVideos[0];
                  console.log('🎯 Setting selected video:', testVideo?.title);
                  if (debugSetSelectedVideo && testVideo) {
                    debugSetSelectedVideo(testVideo);
                  } else {
                    console.log('❌ Debug: No videos available or setSelectedVideo not ready');
                  }
                }}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                title={`Videos: ${debugVideos.length}, Ready: ${!!debugSetSelectedVideo}`}
              >
                🧪 DEBUG: Open babycrawl video ({debugVideos.length} videos)
              </button>
            </div>
            
            {/* Auth Status */}
            <div className="text-right">
              {isAuthenticated ? (
                <div className="text-sm">
                  <div className="font-semibold text-gray-800">Welcome back, {user.name}!</div>
                  <div className="text-gray-500">
                    {user.role === 'admin' && '👑 '}
                    {user.role === 'instructor' && '🎓 '}
                    {user.role === 'student' && '📚 '}
                    {user.role} • Tracking enabled
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <div className="font-semibold text-blue-800 mb-1">🔐 Not logged in</div>
                  <div className="text-blue-600">Log in to track your progress!</div>
                </div>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-1 md:space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-3 px-1 md:px-3 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="hidden md:inline">{tab.icon} </span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Guest Access Callout */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <h3 className="font-bold text-lg">Track Your Learning Progress!</h3>
                  <p className="text-sm opacity-90">
                    Create an account to track hours, save videos to My List, and unlock the Progress tab
                  </p>
                </div>
              </div>
              
              <a
                href="/"
                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm"
              >
                Sign Up / Login
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'watch' ? (
          <WatchTab onDebugVideoSelect={handleDebugVideoSelect} />
        ) : (
          <ActiveComponent />
        )}
      </div>
    </div>
  );
};

export default WatchPage;