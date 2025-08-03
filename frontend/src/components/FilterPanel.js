import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const FilterPanel = ({ filters, onFilterChange, onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    topics: [],
    countries: [],
    guides: []
  });
  const [loading, setLoading] = useState(true);

  const fetchFilterOptions = async () => {
    try {
      const [topicsRes, countriesRes, guidesRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/filters/topics`),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/filters/countries`),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/filters/guides`)
      ]);

      const [topicsData, countriesData, guidesData] = await Promise.all([
        topicsRes.json(),
        countriesRes.json(),
        guidesRes.json()
      ]);

      setFilterOptions({
        topics: topicsData.topics || [],
        countries: countriesData.countries || [],
        guides: guidesData.guides || []
      });
    } catch (error) {
      console.error('Error fetching filter options:', error);
      setFilterOptions({ topics: [], countries: [], guides: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <motion.div 
      className="bg-white rounded-2xl shadow-2xl p-6 mb-8 border-4 border-fiesta-yellow"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🔍</span>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-fiesta-blue to-fiesta-purple bg-clip-text text-transparent font-baloo">
          Filter Videos
        </h2>
      </div>
      
      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="🔍 Search videos, instructors, or topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-fiesta-blue focus:ring-2 focus:ring-fiesta-blue/20 transition-all font-poppins"
          />
          <motion.button
            type="submit"
            className="bg-gradient-to-r from-fiesta-blue to-blue-500 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 font-semibold font-poppins"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Search
          </motion.button>
        </div>
      </form>
      
      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Sort By */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 font-poppins">📊 Sort By</label>
          <select
            value={filters.sort_by || 'newest'}
            onChange={(e) => onFilterChange('sort_by', e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-fiesta-purple focus:ring-2 focus:ring-fiesta-purple/20 transition-all font-poppins"
          >
            <option value="newest">📅 Newest</option>
            <option value="popular">⭐ Popular</option>
            <option value="shortest">⚡ Shortest</option>
            <option value="longest">🕐 Longest</option>
          </select>
        </div>

        {/* Levels */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 font-poppins">📊 Levels</label>
          <select
            value={filters.level || ''}
            onChange={(e) => onFilterChange('level', e.target.value || null)}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-fiesta-green focus:ring-2 focus:ring-fiesta-green/20 transition-all font-poppins"
          >
            <option value="">All Levels</option>
            <option value="New Beginner">🌱 New Beginner</option>
            <option value="Beginner">📚 Beginner</option>
            <option value="Intermediate">📖 Intermediate</option>
            <option value="Advanced">🎓 Advanced</option>
          </select>
        </div>

        {/* Countries */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 font-poppins">🌍 Countries</label>
          <select
            value={filters.country || ''}
            onChange={(e) => onFilterChange('country', e.target.value || null)}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-fiesta-blue focus:ring-2 focus:ring-fiesta-blue/20 transition-all font-poppins"
            disabled={loading}
          >
            <option value="">All Countries</option>
            {filterOptions.countries.map(country => (
              <option key={country.id} value={country.slug}>
                🌍 {country.name}
              </option>
            ))}
          </select>
        </div>

        {/* Guides */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 font-poppins">👨‍🏫 Guides</label>
          <select
            value={filters.guide || ''}
            onChange={(e) => onFilterChange('guide', e.target.value || null)}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-fiesta-purple focus:ring-2 focus:ring-fiesta-purple/20 transition-all font-poppins"
            disabled={loading}
          >
            <option value="">All Guides</option>
            {filterOptions.guides.map(guide => (
              <option key={guide.id} value={guide.name}>
                👨‍🏫 {guide.name}
              </option>
            ))}
          </select>
        </div>

        {/* Topics */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 font-poppins">🏷️ Topics</label>
          <select
            value={filters.topic || ''}
            onChange={(e) => onFilterChange('topic', e.target.value || null)}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-fiesta-green focus:ring-2 focus:ring-fiesta-green/20 transition-all font-poppins"
            disabled={loading}
          >
            <option value="">All Topics</option>
            {filterOptions.topics.map(topic => (
              <option key={topic.id} value={topic.slug}>
                🏷️ {topic.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 font-poppins">📂 Category</label>
          <select
            value={filters.category || ''}
            onChange={(e) => onFilterChange('category', e.target.value || null)}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-fiesta-orange focus:ring-2 focus:ring-fiesta-orange/20 transition-all font-poppins"
          >
            <option value="">All Categories</option>
            <option value="Conversation">💬 Conversation</option>
            <option value="Grammar">📝 Grammar</option>
            <option value="Vocabulary">📚 Vocabulary</option>
            <option value="Pronunciation">🗣️ Pronunciation</option>
            <option value="Culture">🌍 Culture</option>
            <option value="Business">💼 Business</option>
          </select>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <motion.div 
          className="flex items-center justify-center mt-4 text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-fiesta-blue border-t-transparent mr-3"></div>
          <span className="font-poppins text-sm">Loading filter options...</span>
        </motion.div>
      )}

      {/* Clear Filters Button */}
      <motion.div 
        className="mt-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.button
          onClick={() => {
            onFilterChange('level', null);
            onFilterChange('category', null);
            onFilterChange('country', null);
            onFilterChange('guide', null);
            onFilterChange('topic', null);
            onFilterChange('sort_by', 'newest');
            setSearchTerm('');
            onSearch('');
          }}
          className="bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 px-6 py-2 rounded-xl hover:shadow-lg transition-all duration-300 font-semibold font-poppins"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🔄 Clear All Filters
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default FilterPanel;

export default FilterPanel;