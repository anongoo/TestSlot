import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { user, login, logout, isAuthenticated } = useAuth();

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div>
            <a href="/" className="flex items-center">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">English Fiesta</h1>
            </a>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6">
              <a href="/" className="text-gray-600 hover:text-gray-800 transition-colors">Home</a>
              <a href="/about" className="text-gray-600 hover:text-gray-800 transition-colors">About</a>
              <a href="/faq" className="text-gray-600 hover:text-gray-800 transition-colors">FAQ</a>
            </nav>
            
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-semibold text-gray-800">{user.name}</div>
                  <div className="text-xs text-gray-500 capitalize">
                    {user.role === 'admin' && '👑 '}
                    {user.role === 'instructor' && '🎓 '}
                    {user.role === 'student' && '📚 '}
                    {user.role}
                  </div>
                </div>
                {user.picture && (
                  <img 
                    src={user.picture} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full border-2 border-gray-200"
                  />
                )}
                <button
                  onClick={logout}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Login / Sign Up
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;