import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NewVideoPlayer from './NewVideoPlayer';
import WatchVideoCard from './WatchVideoCard';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SeriesTab = () => {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    fetchSeries();
  }, []);

  const fetchSeries = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/videos`);
      const videos = response.data.videos;
      
      // Group videos by series_id or create individual series
      const seriesMap = new Map();
      
      videos.forEach(video => {
        if (video.series_id) {
          if (!seriesMap.has(video.series_id)) {
            seriesMap.set(video.series_id, {
              id: video.series_id,
              title: `${video.instructor_name} Series`,
              description: `A series of videos by ${video.instructor_name}`,
              level: video.level,
              instructor_name: video.instructor_name,
              category: video.category,
              country: video.country,
              videos: [],
              total_duration: 0,
              thumbnail_url: video.thumbnail_url
            });
          }
          const series = seriesMap.get(video.series_id);
          series.videos.push(video);
          series.total_duration += video.duration_minutes;
        } else {
          // Create individual "series" for standalone videos
          seriesMap.set(video.id, {
            id: video.id,
            title: video.title,
            description: video.description,
            level: video.level,
            instructor_name: video.instructor_name,
            category: video.category,
            country: video.country,
            videos: [video],
            total_duration: video.duration_minutes,
            thumbnail_url: video.thumbnail_url,
            is_single_video: true
          });
        }
      });

      // Sort series by video count (actual series first) and then by title
      const sortedSeries = Array.from(seriesMap.values()).sort((a, b) => {
        if (a.videos.length !== b.videos.length) {
          return b.videos.length - a.videos.length; // Multi-video series first
        }
        return a.title.localeCompare(b.title);
      });

      setSeries(sortedSeries);
    } catch (error) {
      console.error('Error fetching series:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeriesSelect = (seriesData) => {
    setSelectedSeries(seriesData);
  };

  const handleBackToSeries = () => {
    setSelectedSeries(null);
    setSelectedVideo(null);
  };

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
  };

  const handleClosePlayer = () => {
    setSelectedVideo(null);
  };

  if (selectedVideo) {
    return (
      <NewVideoPlayer
        video={selectedVideo}
        onClose={handleClosePlayer}
        onVideoEnd={() => {
          // Auto-play next video in series or return to series view
          if (selectedSeries) {
            const currentIndex = selectedSeries.videos.findIndex(v => v.id === selectedVideo.id);
            if (currentIndex < selectedSeries.videos.length - 1) {
              setSelectedVideo(selectedSeries.videos[currentIndex + 1]);
            } else {
              setSelectedVideo(null);
            }
          } else {
            setSelectedVideo(null);
          }
        }}
      />
    );
  }

  if (selectedSeries) {
    return (
      <div>
        {/* Series Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <button
            onClick={handleBackToSeries}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to All Series
          </button>

          <div className="flex flex-col md:flex-row gap-6">
            <img
              src={selectedSeries.thumbnail_url}
              alt={selectedSeries.title}
              className="w-full md:w-64 h-36 object-cover rounded-lg"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="144" viewBox="0 0 256 144"><rect width="256" height="144" fill="%23f3f4f6"/><text x="128" y="72" text-anchor="middle" fill="%236b7280" font-family="Arial" font-size="14">Series</text></svg>';
              }}
            />
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{selectedSeries.title}</h1>
              <p className="text-gray-600 mb-4">{selectedSeries.description}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Videos:</span>
                  <div className="font-semibold text-blue-600">{selectedSeries.videos.length}</div>
                </div>
                <div>
                  <span className="text-gray-500">Total Duration:</span>
                  <div className="font-semibold text-green-600">{selectedSeries.total_duration}min</div>
                </div>
                <div>
                  <span className="text-gray-500">Level:</span>
                  <div className="font-semibold text-purple-600">{selectedSeries.level}</div>
                </div>
                <div>
                  <span className="text-gray-500">Instructor:</span>
                  <div className="font-semibold text-orange-600">{selectedSeries.instructor_name}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Series Videos */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            Videos in this {selectedSeries.is_single_video ? 'collection' : 'series'} ({selectedSeries.videos.length})
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {selectedSeries.videos
              .sort((a, b) => (a.series_order || 0) - (b.series_order || 0))
              .map((video, index) => (
                <div key={video.id} className="relative">
                  {/* Episode Number for Multi-Video Series */}
                  {!selectedSeries.is_single_video && (
                    <div className="absolute top-2 left-2 z-10 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                      #{video.series_order || index + 1}
                    </div>
                  )}
                  <WatchVideoCard
                    video={video}
                    onVideoSelect={handleVideoSelect}
                  />
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Series Overview */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Video Series & Collections</h2>
        <p className="text-gray-600">
          Discover organized learning paths and themed collections. Perfect for structured learning or exploring topics in depth.
        </p>
      </div>

      {/* Series Grid */}
      <div>
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
        ) : series.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-xl text-gray-600 mb-2">No series available yet</p>
            <p className="text-gray-500">Check back later for organized learning collections.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {series.map(seriesData => (
              <div
                key={seriesData.id}
                onClick={() => handleSeriesSelect(seriesData)}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
              >
                {/* Series Thumbnail */}
                <div className="relative">
                  <img
                    src={seriesData.thumbnail_url}
                    alt={seriesData.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect width="320" height="180" fill="%23f3f4f6"/><text x="160" y="90" text-anchor="middle" fill="%236b7280" font-family="Arial" font-size="16">Series</text></svg>';
                    }}
                  />
                  
                  {/* Video Count Badge */}
                  <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                    {seriesData.videos.length} video{seriesData.videos.length > 1 ? 's' : ''}
                  </div>

                  {/* Series Badge */}
                  {!seriesData.is_single_video && (
                    <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                      📚 SERIES
                    </div>
                  )}

                  {/* Total Duration */}
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                    {seriesData.total_duration}min total
                  </div>
                </div>

                {/* Series Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                    {seriesData.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                    {seriesData.description}
                  </p>

                  {/* Metadata */}
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>👨‍🏫 {seriesData.instructor_name}</span>
                    <span>📊 {seriesData.level}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                    <span>🌍 {seriesData.country}</span>
                    <span>📁 {seriesData.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SeriesTab;