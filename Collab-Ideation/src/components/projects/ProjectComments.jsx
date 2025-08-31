import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Reply, Trash2, Edit2, Send, X, Check } from 'lucide-react';
import { commentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ProjectComments = ({ projectId, project }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (projectId) {
      fetchComments();
    }
  }, [projectId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await commentAPI.getProjectComments(projectId);
      setComments(response.data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const response = await commentAPI.createComment(projectId, {
        content: newComment.trim()
      });
      setComments([response.data, ...comments]);
      setNewComment('');
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Failed to create comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !replyingTo) return;

    setSubmitting(true);
    try {
      const response = await commentAPI.createComment(projectId, {
        content: replyText.trim(),
        parentComment: replyingTo
      });

      setComments(comments.map(comment => {
        if (comment._id === replyingTo) {
          return {
            ...comment,
            replies: [...(comment.replies || []), response.data]
          };
        }
        return comment;
      }));

      setReplyText('');
      setReplyingTo(null);
      toast.success('Reply added successfully');
    } catch (error) {
      console.error('Failed to create reply:', error);
      toast.error('Failed to add reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (e) => {
    e.preventDefault();
    if (!editText.trim() || !editingComment) return;

    setSubmitting(true);
    try {
      const response = await commentAPI.updateComment(editingComment, {
        content: editText.trim()
      });

      setComments(comments.map(comment => {
        if (comment._id === editingComment) {
          return response.data;
        }
        if (comment.replies) {
          comment.replies = comment.replies.map(reply => {
            if (reply._id === editingComment) {
              return response.data;
            }
            return reply;
          });
        }
        return comment;
      }));

      setEditText('');
      setEditingComment(null);
      toast.success('Comment updated successfully');
    } catch (error) {
      console.error('Failed to update comment:', error);
      toast.error('Failed to update comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await commentAPI.deleteComment(commentId);
      
      setComments(comments.filter(comment => {
        if (comment._id === commentId) return false;
        if (comment.replies) {
          comment.replies = comment.replies.filter(reply => reply._id !== commentId);
        }
        return true;
      }));

      toast.success('Comment deleted successfully');
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const canDeleteComment = (comment) => {
    return (
      comment.author._id === user._id || 
      project?.owner._id === user._id || 
      user.role === 'admin' 
    );
  };

  const canEditComment = (comment) => {
    return comment.author._id === user._id; 
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-6 h-6 border-2 border-black border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="border-t-2 border-black bg-white">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <MessageSquare className="w-6 h-6 text-black" />
          <h2 className="text-2xl font-bold text-black">Comments</h2>
          <span className="text-sm text-gray-500">({comments.length})</span>
        </div>

        {/* Add New Comment */}
        <form onSubmit={handleCreateComment} className="mb-8">
          <div className="mb-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors resize-none"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="flex items-center space-x-2 px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Posting...' : 'Post Comment'}</span>
          </motion.button>
        </form>

        {/* Comments List */}
        <div className="space-y-6">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <motion.div
                key={comment._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-2 border-gray-200 rounded-lg p-4"
              >
                {/* Main Comment */}
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {comment.author.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-black">{comment.author.name}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString()} at{' '}
                        {new Date(comment.createdAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    
                    {editingComment === comment._id ? (
                      <form onSubmit={handleEditComment} className="space-y-3">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors resize-none"
                        />
                        <div className="flex space-x-2">
                          <button
                            type="submit"
                            disabled={!editText.trim() || submitting}
                            className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            <Check className="w-3 h-3" />
                            <span>Save</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingComment(null);
                              setEditText('');
                            }}
                            className="flex items-center space-x-1 px-3 py-1 border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors"
                          >
                            <X className="w-3 h-3" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <p className="text-gray-800 mb-3 whitespace-pre-line">{comment.content}</p>
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => setReplyingTo(comment._id)}
                            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-black transition-colors"
                          >
                            <Reply className="w-4 h-4" />
                            <span>Reply</span>
                          </button>
                          
                          {canEditComment(comment) && (
                            <button
                              onClick={() => {
                                setEditingComment(comment._id);
                                setEditText(comment.content);
                              }}
                              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-black transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                              <span>Edit</span>
                            </button>
                          )}
                          
                          {canDeleteComment(comment) && (
                            <button
                              onClick={() => handleDeleteComment(comment._id)}
                              className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-800 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Reply Form */}
                {replyingTo === comment._id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 ml-11"
                  >
                    <form onSubmit={handleReply} className="space-y-3">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        rows={2}
                        className="w-full px-3 py-2 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors resize-none"
                      />
                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          disabled={!replyText.trim() || submitting}
                          className="flex items-center space-x-1 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                          <Send className="w-3 h-3" />
                          <span>Reply</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText('');
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-4 ml-11 space-y-4">
                    {comment.replies.map((reply) => (
                      <motion.div
                        key={reply._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {reply.author.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-black text-sm">{reply.author.name}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(reply.createdAt).toLocaleDateString()} at{' '}
                              {new Date(reply.createdAt).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                          
                          {editingComment === reply._id ? (
                            <form onSubmit={handleEditComment} className="space-y-2">
                              <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 focus:border-black focus:outline-none transition-colors resize-none text-sm"
                              />
                              <div className="flex space-x-2">
                                <button
                                  type="submit"
                                  disabled={!editText.trim() || submitting}
                                  className="flex items-center space-x-1 px-2 py-1 bg-green-600 text-white text-xs hover:bg-green-700 transition-colors disabled:opacity-50"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Save</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingComment(null);
                                    setEditText('');
                                  }}
                                  className="flex items-center space-x-1 px-2 py-1 border border-gray-300 text-gray-700 text-xs hover:bg-gray-50 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                  <span>Cancel</span>
                                </button>
                              </div>
                            </form>
                          ) : (
                            <>
                              <p className="text-gray-800 text-sm mb-2 whitespace-pre-line">{reply.content}</p>
                              <div className="flex items-center space-x-3">
                                {canEditComment(reply) && (
                                  <button
                                    onClick={() => {
                                      setEditingComment(reply._id);
                                      setEditText(reply.content);
                                    }}
                                    className="flex items-center space-x-1 text-xs text-gray-600 hover:text-black transition-colors"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>
                                )}
                                
                                {canDeleteComment(reply) && (
                                  <button
                                    onClick={() => handleDeleteComment(reply._id)}
                                    className="flex items-center space-x-1 text-xs text-red-600 hover:text-red-800 transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Delete</span>
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectComments;
