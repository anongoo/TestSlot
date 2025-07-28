import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const GuestHomepage = () => {
  const { login } = useAuth();

  return (
    <div className="bg-white py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Intro Paragraph */}
        <div className="text-center mb-12">
          <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
            Welcome to English Fiesta — your place to learn English naturally, through real videos and real conversations. 
            We believe language learning should be joyful and effective — not robotic or overwhelming.
          </p>
        </div>

        {/* How It Works Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">How It Works</h2>
          <div className="bg-blue-50 rounded-2xl p-8">
            <p className="text-lg text-gray-700 leading-relaxed text-center">
              You watch videos you can actually understand — even as a beginner. As you watch, your brain picks up 
              new vocabulary, grammar, and natural phrasing without effort. You track your progress, hear real accents, 
              and build confidence — all at your own pace.
            </p>
          </div>
        </div>

        {/* Why Join Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Why Join English Fiesta</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
              <div className="text-4xl mb-4">🎥</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Access exclusive beginner-friendly videos</h3>
              <p className="text-gray-600">Content designed specifically for your learning level</p>
            </div>
            
            <div className="text-center bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Track your time and build motivation</h3>
              <p className="text-gray-600">See your progress and maintain learning streaks</p>
            </div>
            
            <div className="text-center bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Learn with input that's actually fun</h3>
              <p className="text-gray-600">Engaging content that keeps you coming back</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Ready to Start Your English Journey?</h3>
            <p className="text-lg opacity-90 mb-6">Join thousands of learners who are mastering English naturally</p>
            <button
              onClick={login}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-xl font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Get Started Now - It's Free!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestHomepage;