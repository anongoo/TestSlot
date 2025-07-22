import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

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

const EmailSubscriptionModal = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post(`${API}/email/subscribe`, {
        email,
        name: name || null,
        source: 'onboarding'
      });

      setMessage(response.data.message);
      if (response.data.status === 'success' || response.data.status === 'partial_success') {
        onSuccess && onSuccess();
        setTimeout(() => {
          onClose();
          setEmail('');
          setName('');
          setMessage('');
        }, 2000);
      }
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">📧</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Stay Motivated!</h2>
          <p className="text-gray-600">Get learning tips, progress updates, and new video notifications!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Your Name (Optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <input
              type="email"
              placeholder="Your Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Maybe Later
            </button>
            <button
              type="submit"
              disabled={loading || !email}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Subscribing...' : 'Subscribe'}
            </button>
          </div>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            message.includes('success') 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-4 text-center">
          We'll never spam you. Unsubscribe anytime with one click.
        </p>
      </div>
    </div>
  );
};

const EmailSubscriptionBanner = ({ onSubscribe }) => {
  const [dismissed, setDismissed] = useState(() => 
    localStorage.getItem('email_banner_dismissed') === 'true'
  );

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('email_banner_dismissed', 'true');
  };

  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 mb-8 rounded-xl shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎯</span>
          <div>
            <h3 className="font-bold text-lg">Stay on Track!</h3>
            <p className="text-sm opacity-90">Get weekly motivation and new video updates</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onSubscribe}
            className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Subscribe
          </button>
          <button
            onClick={handleDismiss}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

const ProgressTracker = ({ sessionId }) => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, [sessionId]);

  const fetchProgress = async () => {
    try {
      const response = await axios.get(`${API}/progress/${sessionId}`);
      setProgress(response.data);
    } catch (error) {
      console.error('Error fetching progress:', error);
      // Set default empty progress if API fails
      setProgress({
        stats: {
          total_minutes_watched: 0,
          current_streak: 0,
          longest_streak: 0,
          personal_best_day: 0,
          level_progress: {},
          milestones_achieved: []
        },
        recent_activity: [],
        total_videos_watched: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { stats } = progress;
  const totalHours = Math.floor(stats.total_minutes_watched / 60);
  const totalMinutes = stats.total_minutes_watched % 60;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <span className="text-blue-600 mr-2">📊</span>
        Your Learning Journey
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg text-center">
          <div className="text-2xl font-bold">{totalHours}h {totalMinutes}m</div>
          <div className="text-sm opacity-90">Total Watched</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-lg text-center">
          <div className="text-2xl font-bold">{stats.current_streak}</div>
          <div className="text-sm opacity-90">Current Streak</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-lg text-center">
          <div className="text-2xl font-bold">{stats.personal_best_day}min</div>
          <div className="text-sm opacity-90">Personal Best</div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-lg text-center">
          <div className="text-2xl font-bold">{progress.total_videos_watched}</div>
          <div className="text-sm opacity-90">Videos Watched</div>
        </div>
      </div>

      {/* Level Progress */}
      {Object.keys(stats.level_progress).length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Progress by Level</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(stats.level_progress).map(([level, minutes]) => (
              <div key={level} className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-600">{level}</div>
                <div className="text-lg font-bold text-blue-600">{minutes}min</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Milestones */}
      {stats.milestones_achieved.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Achievements 🏆</h3>
          <div className="flex flex-wrap gap-2">
            {stats.milestones_achieved.map((milestone, index) => (
              <span key={index} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                🎉 {milestone}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const VideoCard = ({ video, onWatchProgress, sessionId }) => {
  const [isWatching, setIsWatching] = useState(false);
  const [watchedMinutes, setWatchedMinutes] = useState(0);

  const handleWatchVideo = async () => {
    setIsWatching(true);
    
    // Simulate watching progress (in real app, this would be video player events)
    const duration = video.duration_minutes;
    let currentMinutes = 0;
    
    const watchInterval = setInterval(async () => {
      currentMinutes += 1;
      setWatchedMinutes(currentMinutes);
      
      // Record progress every minute
      try {
        await axios.post(`${API}/videos/${video.id}/watch`, {}, {
          params: {
            session_id: sessionId
          },
          data: {
            watched_minutes: currentMinutes
          }
        });
        
        // Notify parent to refresh progress
        if (onWatchProgress) {
          onWatchProgress();
        }
      } catch (error) {
        console.error('Error recording watch progress:', error);
      }
      
      // Stop when video is "finished"
      if (currentMinutes >= duration) {
        clearInterval(watchInterval);
        setIsWatching(false);
        setWatchedMinutes(0);
      }
    }, 2000); // Update every 2 seconds for demo purposes
  };

  const levelColors = {
    'New Beginner': 'bg-green-100 text-green-800',
    'Beginner': 'bg-blue-100 text-blue-800',
    'Intermediate': 'bg-yellow-100 text-yellow-800',
    'Advanced': 'bg-red-100 text-red-800'
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="relative">
        <img 
          src={video.thumbnail_url} 
          alt={video.title}
          className="w-full h-48 object-cover"
        />
        {video.is_premium && (
          <span className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            PREMIUM
          </span>
        )}
      </div>
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-gray-800 line-clamp-2">{video.title}</h3>
          <span className="text-sm text-gray-500 ml-2">{video.duration_minutes}min</span>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{video.description}</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${levelColors[video.level]}`}>
            {video.level}
          </span>
          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
            {video.category}
          </span>
          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
            {video.accent}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            <span className="block">{video.guide}</span>
            <span className="block">{video.country}</span>
          </div>
          
          <button
            onClick={handleWatchVideo}
            disabled={isWatching}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              isWatching 
                ? 'bg-green-500 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isWatching ? `Watching... ${watchedMinutes}min` : 'Watch Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

const FilterPanel = ({ filters, onFilterChange, onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Filter Videos</h2>
      
      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </div>
      </form>
      
      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
          <select
            value={filters.level || ''}
            onChange={(e) => onFilterChange('level', e.target.value || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Levels</option>
            <option value="New Beginner">New Beginner</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={filters.category || ''}
            onChange={(e) => onFilterChange('category', e.target.value || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            <option value="Conversation">Conversation</option>
            <option value="Grammar">Grammar</option>
            <option value="Vocabulary">Vocabulary</option>
            <option value="Pronunciation">Pronunciation</option>
            <option value="Culture">Culture</option>
            <option value="Business">Business</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Accent</label>
          <select
            value={filters.accent || ''}
            onChange={(e) => onFilterChange('accent', e.target.value || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Accents</option>
            <option value="British">British</option>
            <option value="American">American</option>
            <option value="Australian">Australian</option>
            <option value="Canadian">Canadian</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
          <select
            value={filters.sort_by || 'newest'}
            onChange={(e) => onFilterChange('sort_by', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest</option>
            <option value="popular">Popular</option>
            <option value="shortest">Shortest</option>
            <option value="longest">Longest</option>
          </select>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [sessionId] = useState(getSessionId());
  const [refreshProgress, setRefreshProgress] = useState(0);

  useEffect(() => {
    fetchVideos();
  }, [filters]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const response = await axios.get(`${API}/videos?${params.toString()}`);
      setVideos(response.data.videos);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSearch = (searchTerm) => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm
    }));
  };

  const handleWatchProgress = () => {
    // Trigger progress refresh
    setRefreshProgress(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              English Fiesta
            </h1>
            <p className="text-xl md:text-2xl opacity-90 mb-8">
              Master English through immersive, comprehensible input
            </p>
            <div className="max-w-2xl mx-auto">
              <img 
                src="https://images.unsplash.com/photo-1645594287996-086e2217a809?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwzfHxsYW5ndWFnZSUyMGxlYXJuaW5nfGVufDB8fHxibHVlfDE3NTMxNzE5NDR8MA&ixlib=rb-4.1.0&q=85"
                alt="English Learning"
                className="rounded-xl shadow-2xl mx-auto"
                style={{ maxHeight: '300px', width: 'auto' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Progress Tracker */}
        <ProgressTracker sessionId={sessionId} key={refreshProgress} />
        
        {/* Filter Panel */}
        <FilterPanel 
          filters={filters}
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
        />
        
        {/* Videos Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            📚 Video Library
          </h2>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-48 rounded-xl mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map(video => (
                <VideoCard 
                  key={video.id} 
                  video={video}
                  onWatchProgress={handleWatchProgress}
                  sessionId={sessionId}
                />
              ))}
            </div>
          )}
          
          {!loading && videos.length === 0 && (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600">No videos found matching your filters.</p>
              <p className="text-gray-500 mt-2">Try adjusting your search criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;