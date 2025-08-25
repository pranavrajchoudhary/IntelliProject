import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Trash2, User, Calendar, Lightbulb, Loader2 } from 'lucide-react';
import { ideaAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const SavedIdeasModal = ({ onClose, projectId, project }) => {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchSavedIdeas();
  }, [projectId]);

  const fetchSavedIdeas = async () => {
    try {
      const response = await ideaAPI.getProjectIdeas(projectId);
      setIdeas(response.data);
    } catch (error) {
      console.error('Failed to fetch saved ideas:', error);
      toast.error('Failed to load saved ideas');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIdea = async (ideaId) => {
    if (!confirm('Are you sure you want to delete this idea?')) return;
    
    setDeleting(ideaId);
    try {
      await ideaAPI.deleteIdea(ideaId);
      setIdeas(prev => prev.filter(idea => idea._id !== ideaId));
      toast.success('Idea deleted successfully');
    } catch (error) {
      console.error('Failed to delete idea:', error);
      toast.error(error.response?.data?.message || 'Failed to delete idea');
    } finally {
      setDeleting(null);
    }
  };

  const canDeleteIdea = (idea) => {
    const isCreator = idea.createdBy._id === user._id;
    const isProjectOwner = project?.owner._id === user._id;
    const isAdmin = user.role === 'admin';
    return isCreator || isProjectOwner || isAdmin;
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Lightbulb className="w-6 h-6 mr-2 text-green-600" />
              Saved Ideas
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {project?.title} • {ideas.length} ideas saved
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
              <p className="text-gray-600">Loading saved ideas...</p>
            </div>
          ) : ideas.length === 0 ? (
            <div className="text-center py-12">
              <Lightbulb className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No saved ideas yet</h3>
              <p className="text-gray-600">Generate some AI ideas and save them to see them here.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {ideas.map((idea) => (
                <motion.div
                  key={idea._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm"
                >
                  {/* Header with title and actions */}
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex-1 mr-4">
                      {idea.title}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs text-white ${getPriorityColor(idea.priority)}`}>
                        {idea.priority}
                      </span>
                      {canDeleteIdea(idea) && (
                        <button
                          onClick={() => handleDeleteIdea(idea._id)}
                          disabled={deleting === idea._id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          title="Delete idea"
                        >
                          {deleting === idea._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 mb-4">{idea.description}</p>

                  {/* Metadata row */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>by {idea.createdBy.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(idea.createdAt).toLocaleDateString()}</span>
                      </div>
                      {idea.feasibility && (
                        <span>Feasibility: {idea.feasibility}/10</span>
                      )}
                    </div>
                    
                    {idea.category && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {idea.category}
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  {idea.tags && idea.tags.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {idea.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Original prompt */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Original Prompt:</h4>
                    <p className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded">
                      "{idea.prompt}"
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SavedIdeasModal;