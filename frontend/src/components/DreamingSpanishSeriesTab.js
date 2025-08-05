import React from 'react';

const DreamingSpanishSeriesTab = () => {
  return (
    <div className="p-8 text-center">
      <div className="max-w-md mx-auto">
        <div className="text-6xl mb-4">📚</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Series Coming Soon!</h2>
        <p className="text-gray-600 mb-6">
          We're working on organizing videos into series collections for better learning progression.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">What to expect:</h3>
          <ul className="text-left text-blue-700 text-sm space-y-1">
            <li>• Structured learning paths</li>
            <li>• Progressive difficulty levels</li>
            <li>• Topic-based video collections</li>
            <li>• Instructor-curated series</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DreamingSpanishSeriesTab;