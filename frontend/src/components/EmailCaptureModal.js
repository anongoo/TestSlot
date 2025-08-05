import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EmailCaptureModal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user has already seen, dismissed, or subscribed
    const hasSeenModal = localStorage.getItem('email_capture_seen');
    const hasDismissedModal = localStorage.getItem('email_capture_dismissed'); 
    const hasSubscribed = localStorage.getItem('email_subscribed');
    
    // Don't show modal if any of these conditions are true
    if (hasSeenModal || hasDismissedModal || hasSubscribed) {
      return;
    }

    let modalShown = false; // Prevent double triggering

    // Show modal function
    const showModal = () => {
      if (modalShown) return; // Prevent multiple calls
      modalShown = true;
      setIsVisible(true);
      localStorage.setItem('email_capture_seen', 'true');
    };

    // Timer trigger (10 seconds)
    const timer = setTimeout(() => {
      showModal();
    }, 10000);

    // Scroll trigger  
    const handleScroll = () => {
      if (window.scrollY > 500) {
        showModal();
        window.removeEventListener('scroll', handleScroll);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/email/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          name: formData.name.trim() || undefined
        })
      });

      if (response.ok) {
        setIsSubmitted(true);
        localStorage.setItem('email_subscribed', 'true');
        
        // Auto-close after 3 seconds
        setTimeout(() => {
          setIsVisible(false);
        }, 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to subscribe. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (e) => {
    // Prevent event bubbling if triggered from click
    if (e) {
      e.stopPropagation();
    }
    
    setIsVisible(false);
    localStorage.setItem('email_capture_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={(e) => {
            // Only close if clicking directly on backdrop, not on modal content
            if (e.target === e.currentTarget) {
              handleClose(e);
            }
          }}
        />
        
        {/* Modal Content */}
        <motion.div 
          className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Close Button */}
          <motion.button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-white bg-opacity-80 rounded-full text-gray-600 hover:text-gray-800 transition-colors shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </motion.button>

          {/* Header with Image/Visual */}
          <div className="bg-gradient-to-r from-fiesta-blue via-fiesta-purple to-fiesta-pink p-6 text-white text-center relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20">
              <motion.div 
                className="absolute top-4 left-4 text-4xl"
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                🎉
              </motion.div>
              <motion.div 
                className="absolute top-6 right-6 text-3xl"
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, -15, 15, 0]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
              >
                📚
              </motion.div>
              <motion.div 
                className="absolute bottom-4 left-6 text-2xl"
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 360]
                }}
                transition={{ 
                  duration: 5, 
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2
                }}
              >
                ✨
              </motion.div>
            </div>

            <motion.div 
              className="relative z-10"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <img 
                  src="/english-fiesta-logo-hq.png" 
                  alt="English Fiesta Logo" 
                  className="w-12 h-12"
                />
                <h2 className="text-2xl font-bold font-baloo">English Fiesta</h2>
              </div>
              <p className="text-lg font-poppins leading-relaxed">
                Join the English Fiesta community for more help on your English learning journey!
              </p>
            </motion.div>
          </div>

          {/* Form Content */}
          <div className="p-6">
            {!isSubmitted ? (
              <motion.form 
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="space-y-4">
                  {/* Name Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-poppins">
                      Name (Optional)
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-fiesta-blue focus:outline-none transition-colors font-poppins"
                    />
                  </div>

                  {/* Email Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-poppins">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-fiesta-blue focus:outline-none transition-colors font-poppins"
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <motion.div 
                      className="text-red-600 text-sm font-poppins"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {error}
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-4 rounded-lg font-bold text-lg font-poppins transition-all duration-300 ${
                      isSubmitting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-fiesta-yellow to-fiesta-orange text-gray-800 hover:shadow-lg hover:scale-105'
                    }`}
                    whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                    whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        Joining...
                      </div>
                    ) : (
                      '🎯 Join Now'
                    )}
                  </motion.button>

                  {/* No Thanks Link */}
                  <motion.button
                    type="button"
                    onClick={handleClose}
                    className="block w-full text-center text-gray-500 hover:text-gray-700 transition-colors text-sm font-poppins py-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    No thanks
                  </motion.button>
                </div>
              </motion.form>
            ) : (
              // Success Message
              <motion.div 
                className="text-center py-6"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <motion.div 
                  className="text-6xl mb-4"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ duration: 0.6 }}
                >
                  🎉
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2 font-baloo">
                  Welcome to the Fiesta!
                </h3>
                <p className="text-gray-600 font-poppins">
                  Thank you for joining! You'll receive helpful tips and updates to support your English learning journey.
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EmailCaptureModal;