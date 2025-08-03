import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';

const CommentList = ({ videoId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchComments = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/comments/${videoId}`
      );

      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      } else {
        setError('Failed to load comments');
      }
    } catch (err) {
      setError('Network error loading comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [videoId]);

  const handleCommentSubmitted = (newComment) => {
    setComments(prev => [newComment, ...prev]);
  };

  const handleCommentDeleted = (commentId) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-300 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-300 rounded"></div>
            <div className="h-16 bg-gray-300 rounded"></div>
            <div className="h-18 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="bg-red-50 border border-red-200 rounded-xl p-6 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-red-600 font-poppins">❌ {error}</p>
        <motion.button
          onClick={fetchComments}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg font-poppins hover:bg-red-700 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Try Again
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <motion.div 
        className="flex items-center gap-3"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-2">
          <span className="text-3xl">💬</span>
          <h3 className="text-2xl font-bold text-gray-800 font-baloo">
            Comments
          </h3>
        </div>
        
        <motion.div 
          className="bg-gradient-to-r from-fiesta-yellow to-fiesta-orange text-gray-800 px-3 py-1 rounded-full text-sm font-bold font-poppins"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
        >
          {comments.length} comment{comments.length !== 1 ? 's' : ''}
        </motion.div>
      </motion.div>

      {/* Comment Form */}
      <CommentForm 
        videoId={videoId} 
        onCommentSubmitted={handleCommentSubmitted} 
      />

      {/* Comments List */}
      <AnimatePresence>
        {comments.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {comments.map((comment, index) => (
              <motion.div
                key={comment.id}
                variants={itemVariants}
                layout
                exit={{ 
                  opacity: 0, 
                  x: -100,
                  transition: { duration: 0.3 }
                }}
              >
                <CommentItem 
                  comment={comment} 
                  onCommentDeleted={handleCommentDeleted}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            className="bg-gray-50 rounded-xl p-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-6xl mb-4">🎬</div>
            <h4 className="text-lg font-semibold text-gray-700 mb-2 font-baloo">
              No comments yet!
            </h4>
            <p className="text-gray-600 font-poppins">
              Be the first to share your thoughts about this video.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fun emoji decoration */}
      <motion.div 
        className="flex justify-center space-x-4 opacity-60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ duration: 1, delay: 1 }}
      >
        {["💭", "🗨️", "💬", "🎉", "✨"].map((emoji, index) => (
          <motion.span
            key={index}
            className="text-2xl"
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2 + index * 0.3, 
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.2
            }}
          >
            {emoji}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
};

export default CommentList;