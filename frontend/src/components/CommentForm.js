import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const CommentForm = ({ 
  videoId, 
  onCommentSubmitted, 
  parentCommentId = null, 
  placeholder = "Write a comment...", 
  buttonText = "Post Comment" 
}) => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { sessionToken, isAuthenticated, user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!text.trim()) return;
    
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/comments/${videoId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`
          },
          body: JSON.stringify({ 
            text: text.trim(),
            parent_comment_id: parentCommentId 
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        setText(''); // Clear form
        onCommentSubmitted(result.comment); // Notify parent component
      } else if (response.status === 401) {
        setError('You need to be logged in to post comments');
      } else if (response.status === 403) {
        setError('You need to be a student or higher to post comments');
      } else {
        setError('Failed to post comment. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <motion.div 
        className="bg-gradient-to-r from-fiesta-blue to-fiesta-purple rounded-xl p-6 text-center text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="font-poppins text-lg mb-2">💬 Join the conversation!</p>
        <p className="font-poppins text-sm opacity-90 mb-4">
          Sign up as a student to share your thoughts and connect with other learners.
        </p>
        <motion.button
          onClick={() => window.location.href = '/'}
          className="bg-fiesta-yellow text-gray-800 px-6 py-2 rounded-full font-bold font-poppins hover:bg-yellow-300 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Sign Up to Comment
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.form 
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-lg p-6 border-2 border-fiesta-yellow"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-start gap-4">
        {/* User Avatar */}
        <motion.div
          className="flex-shrink-0"
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {user.picture ? (
            <img 
              src={user.picture} 
              alt={user.name} 
              className="w-10 h-10 rounded-full border-2 border-fiesta-pink"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-fiesta-purple to-fiesta-pink flex items-center justify-center text-white font-bold font-poppins">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </motion.div>

        {/* Comment Input */}
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your thoughts about this video... 💭"
            className="w-full p-4 border-2 border-gray-200 rounded-lg resize-none focus:border-fiesta-blue focus:outline-none font-poppins"
            rows={3}
            maxLength={500}
            disabled={isLoading}
          />
          
          {/* Character Counter */}
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500 font-poppins">
              {text.length}/500 characters
            </span>
            
            {error && (
              <span className="text-red-500 text-sm font-poppins">{error}</span>
            )}
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={!text.trim() || isLoading}
            className={`mt-3 px-6 py-2 rounded-full font-bold font-poppins transition-all duration-200 ${
              !text.trim() || isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-fiesta-pink to-fiesta-purple text-white hover:shadow-lg'
            }`}
            whileHover={!text.trim() || isLoading ? {} : { scale: 1.05 }}
            whileTap={!text.trim() || isLoading ? {} : { scale: 0.95 }}
          >
            {isLoading ? '📤 Posting...' : '💬 Post Comment'}
          </motion.button>
        </div>
      </div>
    </motion.form>
  );
};

export default CommentForm;