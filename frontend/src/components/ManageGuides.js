import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const ManageGuides = () => {
  const { user, sessionToken } = useAuth();
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingGuide, setEditingGuide] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    visible: true
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchGuides = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/guides`,
        {
          headers: {
            'Authorization': `Bearer ${user.sessionToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setGuides(data.guides);
      } else {
        setError('Failed to fetch guides');
      }
    } catch (err) {
      setError('Network error loading guides');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');

    try {
      const url = editingGuide 
        ? `${process.env.REACT_APP_BACKEND_URL}/api/admin/guides/${editingGuide.id}`
        : `${process.env.REACT_APP_BACKEND_URL}/api/admin/guides`;
      
      const method = editingGuide ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.sessionToken}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchGuides();
        setFormData({ name: '', visible: true });
        setEditingGuide(null);
        setIsCreating(false);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to save guide');
      }
    } catch (err) {
      setError('Network error saving guide');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (guide) => {
    setEditingGuide(guide);
    setFormData({
      name: guide.name,
      visible: guide.visible
    });
    setIsCreating(true);
  };

  const handleDelete = async (guideId) => {
    if (!confirm('Are you sure you want to delete this guide?')) return;

    setActionLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/guides/${guideId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user.sessionToken}`
          }
        }
      );

      if (response.ok) {
        await fetchGuides();
      } else {
        setError('Failed to delete guide');
      }
    } catch (err) {
      setError('Network error deleting guide');
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', visible: true });
    setEditingGuide(null);
    setIsCreating(false);
    setError('');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-300 rounded"></div>
            <div className="h-16 bg-gray-300 rounded"></div>
            <div className="h-16 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">👨‍🏫</span>
          <h2 className="text-2xl font-bold text-gray-800 font-baloo">Manage Guides</h2>
        </div>
        
        <motion.button
          onClick={() => setIsCreating(true)}
          className="bg-gradient-to-r from-fiesta-purple to-purple-500 text-white px-4 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ➕ Add Guide
        </motion.button>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div 
          className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-red-600 font-poppins">{error}</p>
        </motion.div>
      )}

      {/* Create/Edit Form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div 
            className="bg-white rounded-xl shadow-lg border-2 border-fiesta-purple p-6 mb-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4 font-baloo">
              {editingGuide ? 'Edit Guide' : 'Create New Guide'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-poppins">
                  Guide Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter guide/instructor name"
                  required
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-fiesta-purple focus:outline-none font-poppins"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="visible"
                  id="guideVisible"
                  checked={formData.visible}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-fiesta-purple focus:ring-fiesta-purple border-gray-300 rounded"
                />
                <label htmlFor="guideVisible" className="ml-2 text-sm font-medium text-gray-700 font-poppins">
                  Visible in frontend filters
                </label>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <motion.button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-gradient-to-r from-fiesta-purple to-purple-500 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50 font-poppins"
                  whileHover={{ scale: actionLoading ? 1 : 1.05 }}
                  whileTap={{ scale: actionLoading ? 1 : 0.95 }}
                >
                  {actionLoading ? 'Saving...' : (editingGuide ? 'Update Guide' : 'Create Guide')}
                </motion.button>
                
                <motion.button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold font-poppins"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guides List */}
      <div className="space-y-4">
        {guides.length === 0 ? (
          <motion.div 
            className="bg-gray-50 rounded-xl p-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-4xl mb-4">🎓</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2 font-baloo">No Guides Yet</h3>
            <p className="text-gray-600 font-poppins">Create your first guide to get started.</p>
          </motion.div>
        ) : (
          guides.map((guide, index) => (
            <motion.div
              key={guide.id}
              className="bg-white rounded-xl shadow-md p-6 border-l-4 border-fiesta-purple hover:shadow-lg transition-shadow duration-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800 font-poppins">{guide.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      guide.visible 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {guide.visible ? '👁️ Visible' : '🚫 Hidden'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-poppins">
                    Created: {new Date(guide.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => handleEdit(guide)}
                    className="text-fiesta-purple hover:text-purple-700 p-2 rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Edit guide"
                  >
                    ✏️
                  </motion.button>
                  
                  <motion.button
                    onClick={() => handleDelete(guide.id)}
                    disabled={actionLoading}
                    className="text-red-500 hover:text-red-700 p-2 rounded-lg transition-colors disabled:opacity-50"
                    whileHover={{ scale: actionLoading ? 1 : 1.1 }}
                    whileTap={{ scale: actionLoading ? 1 : 0.9 }}
                    title="Delete guide"
                  >
                    🗑️
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ManageGuides;