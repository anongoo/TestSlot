import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import AdminVideoUpload from './AdminVideoUpload';
import AdminYouTubeAdd from './AdminYouTubeAdd';
import AdminVideoManagement from './AdminVideoManagement';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const { user, sessionToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('management'); // 'management', 'upload', 'youtube'
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/admin/users`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await axios.post(`${API}/admin/users/role`, {
        user_id: userId,
        new_role: newRole
      }, {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      
      // Refresh users list
      fetchUsers();
      alert('User role updated successfully!');
    } catch (error) {
      console.error('Failed to update user role:', error);
      alert('Failed to update user role. Please try again.');
    }
  };

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    // Switch to management tab to see uploaded videos
    setActiveTab('management');
  };

  const handleYouTubeSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    // Switch to management tab to see added video
    setActiveTab('management');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="text-center py-8">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Admin Dashboard Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <span className="text-yellow-600 mr-2">👑</span>
          Admin Dashboard
        </h2>
        
        {/* Tab Navigation */}
        <div className="border-b mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('management')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'management'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🎬 Video Management
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📤 Upload Videos
            </button>
            <button
              onClick={() => setActiveTab('youtube')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'youtube'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📺 Add YouTube
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              👥 User Management
            </button>
          </nav>
        </div>

        {/* User Management Stats */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{users.length}</div>
              <div className="text-sm text-blue-800">Total Users</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {users.filter(u => u.role === 'student').length}
              </div>
              <div className="text-sm text-green-800">Students</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">
                {users.filter(u => u.role === 'instructor').length}
              </div>
              <div className="text-sm text-purple-800">Instructors</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {users.filter(u => u.role === 'admin').length}
              </div>
              <div className="text-sm text-yellow-800">Admins</div>
            </div>
          </div>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'management' && (
        <AdminVideoManagement refreshTrigger={refreshTrigger} />
      )}

      {activeTab === 'upload' && (
        <AdminVideoUpload onUploadSuccess={handleUploadSuccess} />
      )}

      {activeTab === 'youtube' && (
        <AdminYouTubeAdd onAddSuccess={handleYouTubeSuccess} />
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">User Management</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Name</th>
                  <th className="text-left py-3 px-2">Email</th>
                  <th className="text-left py-3 px-2">Current Role</th>
                  <th className="text-left py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2">{u.name}</td>
                    <td className="py-3 px-2">{u.email}</td>
                    <td className="py-3 px-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        u.role === 'admin' ? 'bg-yellow-100 text-yellow-800' :
                        u.role === 'instructor' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {u.role === 'admin' && '👑 '}
                        {u.role === 'instructor' && '🎓 '}
                        {u.role === 'student' && '📚 '}
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <select
                        value={u.role}
                        onChange={(e) => updateUserRole(u.id, e.target.value)}
                        className="text-xs border rounded px-2 py-1 bg-white"
                        disabled={u.id === user.id} // Prevent self-modification
                      >
                        <option value="student">Student</option>
                        <option value="instructor">Instructor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;