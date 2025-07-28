import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const HeroSection = () => {
  const { isAuthenticated, login } = useAuth();

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          {/* Hero Title */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 hero-title">
            Learn English the Natural Way
          </h1>
          
          {/* Hero Subheadline */}
          <h2 className="text-xl md:text-2xl mb-8 opacity-90 hero-subtitle">
            Real conversations. Real people. No textbooks.
          </h2>
          
          {/* CTA Button */}
          {!isAuthenticated && (
            <button
              onClick={login}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-xl font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg mb-12"
            >
              Start Learning Free
            </button>
          )}
          
          {/* Value Props */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 hover:bg-opacity-20 transition-all duration-300">
              <div className="text-3xl mb-3">📈</div>
              <h3 className="font-semibold mb-2">Track your learning and build streaks</h3>
              <p className="text-sm opacity-80">Monitor your progress and stay motivated with daily streak tracking</p>
            </div>
            
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 hover:bg-opacity-20 transition-all duration-300">
              <div className="text-3xl mb-3">🎥</div>
              <h3 className="font-semibold mb-2">Learn through videos, not memorization</h3>
              <p className="text-sm opacity-80">Absorb language naturally through engaging video content</p>
            </div>
            
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 hover:bg-opacity-20 transition-all duration-300">
              <div className="text-3xl mb-3">🌍</div>
              <h3 className="font-semibold mb-2">Hear real accents from real people</h3>
              <p className="text-sm opacity-80">Experience authentic English from speakers around the world</p>
            </div>
            
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 hover:bg-opacity-20 transition-all duration-300">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="font-semibold mb-2">Designed for beginners and beyond</h3>
              <p className="text-sm opacity-80">Content tailored to your level, from new beginner to advanced</p>
            </div>
            
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 hover:bg-opacity-20 transition-all duration-300 md:col-span-2 lg:col-span-1">
              <div className="text-3xl mb-3">🧠</div>
              <h3 className="font-semibold mb-2">Comprehensible Input Method</h3>
              <p className="text-sm opacity-80">Science-backed and effective language acquisition approach</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;