import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ProgressTrackingToast = ({ 
  isVisible, 
  onDismiss, 
  watchTime = 0,
  triggerThreshold = 60 // Show after 60 seconds of watch time
}) => {
  const [shouldShow, setShouldShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if toast was already dismissed this session
    const toastDismissed = sessionStorage.getItem('progress_toast_dismissed');
    if (toastDismissed) {
      setDismissed(true);
      return;
    }

    // Show toast after trigger threshold is reached
    if (watchTime >= triggerThreshold && !dismissed && isVisible) {
      setShouldShow(true);
    }
  }, [watchTime, triggerThreshold, dismissed, isVisible]);

  const handleDismiss = () => {
    setShouldShow(false);
    setDismissed(true);
    sessionStorage.setItem('progress_toast_dismissed', 'true');
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleSignUp = () => {
    // Navigate to sign up - you can customize this
    window.location.href = 'https://auth.emergentagent.com/?redirect=' + encodeURIComponent(window.location.origin + '/watch');
  };

  if (!shouldShow || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.95 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 25,
          duration: 0.4 
        }}
        className="fixed bottom-6 right-6 z-50 max-w-sm"
      >
        <div className="bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-fiesta-blue to-fiesta-purple p-1">
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-gradient-to-r from-fiesta-yellow to-fiesta-orange rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🔒</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 text-sm mb-1">
                      Track Your Progress
                    </h3>
                    <p className="text-gray-600 text-xs leading-relaxed">
                      You've watched {Math.floor(watchTime / 60)}+ minutes! Sign up to save your progress and unlock detailed analytics.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <motion.button
                  onClick={handleSignUp}
                  className="flex-1 bg-gradient-to-r from-fiesta-blue to-fiesta-purple text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Sign Up Free
                </motion.button>
                <motion.button
                  onClick={handleDismiss}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Later
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProgressTrackingToast;