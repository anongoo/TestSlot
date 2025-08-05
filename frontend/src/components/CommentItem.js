import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import CommentForm from './CommentForm';

const CommentItem = ({ comment, onCommentDeleted, onCommentPinToggled, onCommentUpdated, level = 0 }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPinToggling, setIsPinToggling] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const { user, isAuthenticated, sessionToken } = useAuth();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const handlePinToggle = async () => {
    setIsPinToggling(true);
    try {
      const endpoint = comment.pinned ? 'unpin' : 'pin';
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/comments/${comment.id}/${endpoint}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${sessionToken}`
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        onCommentPinToggled(result.comment);
      } else {
        console.error('Failed to toggle pin status');
      }
    } catch (error) {
      console.error('Error toggling pin status:', error);
    } finally {
      setIsPinToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/comments/${comment.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user.sessionToken}`
          }
        }
      );

      if (response.ok) {
        onCommentDeleted(comment.id);
      } else {
        console.error('Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const canDelete = isAuthenticated && user.role === 'admin';

  return (
    <motion.div 
      className={`rounded-xl shadow-md p-4 border-l-4 hover:shadow-lg transition-shadow duration-200 ${
        comment.pinned 
          ? 'bg-gradient-to-r from-fiesta-yellow from-5% to-white border-fiesta-yellow shadow-lg' 
          : 'bg-white border-fiesta-blue'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.01 }}
    >
      {/* Pinned Badge */}
      {comment.pinned && (
        <motion.div 
          className="flex items-center gap-1 mb-3 text-fiesta-orange font-semibold text-sm"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <span className="text-lg">📌</span>
          <span className="font-poppins">Pinned</span>
        </motion.div>
      )}

      <div className="flex items-start gap-3">
        {/* User Avatar Placeholder */}
        <motion.div 
          className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-fiesta-green to-fiesta-blue flex items-center justify-center text-white font-bold text-sm font-poppins"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {comment.user_name.charAt(0).toUpperCase()}
        </motion.div>

        <div className="flex-1 min-w-0">
          {/* User Name and Time */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800 font-poppins">
                {comment.user_name}
              </span>
              <span className="text-xs text-gray-500 font-poppins">
                {formatDate(comment.created_at)}
              </span>
            </div>
            
            {/* Admin Controls */}
            {canDelete && (
              <div className="flex items-center gap-2">
                {/* Pin/Unpin Button */}
                <motion.button
                  onClick={handlePinToggle}
                  disabled={isPinToggling}
                  className={`text-sm p-2 rounded transition-colors font-poppins ${
                    comment.pinned
                      ? 'text-fiesta-orange hover:text-orange-700 bg-fiesta-yellow bg-opacity-20'
                      : 'text-gray-500 hover:text-fiesta-orange'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title={comment.pinned ? "Unpin comment" : "Pin comment"}
                >
                  {isPinToggling ? '⏳' : (comment.pinned ? '📌' : '📍')}
                </motion.button>

                {/* Delete Button */}
                <motion.button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-red-500 hover:text-red-700 text-sm p-2 rounded transition-colors font-poppins"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Delete comment (Admin only)"
                >
                  {isDeleting ? '⏳' : '🗑️'}
                </motion.button>
              </div>
            )}
          </div>

          {/* Comment Text */}
          <motion.p 
            className="text-gray-700 leading-relaxed font-poppins"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {comment.text}
          </motion.p>

          {/* Interaction Buttons */}
          <div className="flex items-center gap-4 mt-3">
            <motion.button
              className="flex items-center gap-1 text-gray-500 hover:text-fiesta-pink text-sm font-poppins transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>👍</span>
              <span>Like</span>
            </motion.button>
            
            <motion.button
              className="flex items-center gap-1 text-gray-500 hover:text-fiesta-blue text-sm font-poppins transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>💬</span>
              <span>Reply</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CommentItem;