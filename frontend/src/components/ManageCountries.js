import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const ManageCountries = () => {
  const { user, sessionToken } = useAuth();
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCountry, setEditingCountry] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    visible: true
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCountries = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/countries`,
        {
          headers: {
            'Authorization': `Bearer ${sessionToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCountries(data.countries);
      } else {
        setError('Failed to fetch countries');
      }
    } catch (err) {
      setError('Network error loading countries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  const generateSlug = (name) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue,
      // Auto-generate slug when name changes
      ...(name === 'name' && { slug: generateSlug(value) })
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');

    try {
      const url = editingCountry 
        ? `${process.env.REACT_APP_BACKEND_URL}/api/admin/countries/${editingCountry.id}`
        : `${process.env.REACT_APP_BACKEND_URL}/api/admin/countries`;
      
      const method = editingCountry ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchCountries();
        setFormData({ name: '', slug: '', visible: true });
        setEditingCountry(null);
        setIsCreating(false);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to save country');
      }
    } catch (err) {
      setError('Network error saving country');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (country) => {
    setEditingCountry(country);
    setFormData({
      name: country.name,
      slug: country.slug,
      visible: country.visible
    });
    setIsCreating(true);
  };

  const handleDelete = async (countryId) => {
    if (!confirm('Are you sure you want to delete this country?')) return;

    setActionLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/countries/${countryId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user.sessionToken}`
          }
        }
      );

      if (response.ok) {
        await fetchCountries();
      } else {
        setError('Failed to delete country');
      }
    } catch (err) {
      setError('Network error deleting country');
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', slug: '', visible: true });
    setEditingCountry(null);
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
          <span className="text-3xl">🌍</span>
          <h2 className="text-2xl font-bold text-gray-800 font-baloo">Manage Countries</h2>
        </div>
        
        <motion.button
          onClick={() => setIsCreating(true)}
          className="bg-gradient-to-r from-fiesta-blue to-blue-500 text-white px-4 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ➕ Add Country
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
            className="bg-white rounded-xl shadow-lg border-2 border-fiesta-blue p-6 mb-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4 font-baloo">
              {editingCountry ? 'Edit Country' : 'Create New Country'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-poppins">
                    Country Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter country name"
                    required
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-fiesta-blue focus:outline-none font-poppins"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-poppins">
                    Slug *
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    placeholder="country-slug"
                    required
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-fiesta-blue focus:outline-none font-poppins"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="visible"
                  id="countryVisible"
                  checked={formData.visible}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-fiesta-blue focus:ring-fiesta-blue border-gray-300 rounded"
                />
                <label htmlFor="countryVisible" className="ml-2 text-sm font-medium text-gray-700 font-poppins">
                  Visible in frontend filters
                </label>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <motion.button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-gradient-to-r from-fiesta-blue to-blue-500 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50 font-poppins"
                  whileHover={{ scale: actionLoading ? 1 : 1.05 }}
                  whileTap={{ scale: actionLoading ? 1 : 0.95 }}
                >
                  {actionLoading ? 'Saving...' : (editingCountry ? 'Update Country' : 'Create Country')}
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

      {/* Countries List */}
      <div className="space-y-4">
        {countries.length === 0 ? (
          <motion.div 
            className="bg-gray-50 rounded-xl p-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2 font-baloo">No Countries Yet</h3>
            <p className="text-gray-600 font-poppins">Create your first country to get started.</p>
          </motion.div>
        ) : (
          countries.map((country, index) => (
            <motion.div
              key={country.id}
              className="bg-white rounded-xl shadow-md p-6 border-l-4 border-fiesta-blue hover:shadow-lg transition-shadow duration-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800 font-poppins">{country.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      country.visible 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {country.visible ? '👁️ Visible' : '🚫 Hidden'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 font-poppins">Slug: {country.slug}</p>
                  <p className="text-xs text-gray-500 font-poppins">
                    Created: {new Date(country.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => handleEdit(country)}
                    className="text-fiesta-blue hover:text-blue-700 p-2 rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Edit country"
                  >
                    ✏️
                  </motion.button>
                  
                  <motion.button
                    onClick={() => handleDelete(country.id)}
                    disabled={actionLoading}
                    className="text-red-500 hover:text-red-700 p-2 rounded-lg transition-colors disabled:opacity-50"
                    whileHover={{ scale: actionLoading ? 1 : 1.1 }}
                    whileTap={{ scale: actionLoading ? 1 : 0.9 }}
                    title="Delete country"
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

export default ManageCountries;