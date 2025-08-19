import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Lightbulb, Loader2, Sparkles } from 'lucide-react';
import { aiAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AIIdeaGenerator = ({ onClose, projectId, projectTitle }) => {
  const [prompt, setPrompt] = useState('');
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setLoading(true);
    try {
      const response = await aiAPI.generateIdeas(prompt, projectId);
      setIdeas(response.data.ideas);
      toast.success('Ideas generated successfully!');
    } catch (error) {
      console.error('AI Error:', error);
      toast.error(error.response?.data?.message || 'Failed to generate ideas');
    } finally {
      setLoading(false);
    }
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Sparkles className="h-6 w-6 text-purple-600" />
            <div>
              <h3 className="text-lg font-semibold">AI Idea Generator</h3>
              {projectTitle && (
                <p className="text-sm text-gray-600">For project: {projectTitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Input Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What kind of ideas do you need?
            </label>
            <div className="flex space-x-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., 'new features for user engagement', 'mobile app improvements', 'marketing strategies'..."
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows="3"
              />
              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
                <span>{loading ? 'Generating...' : 'Generate'}</span>
              </button>
            </div>
          </div>

          {/* Results */}
          {ideas.length > 0 && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <h4 className="font-semibold text-gray-800 flex items-center space-x-2">
                <Sparkles className="h-4 w-4" />
                <span>Generated Ideas ({ideas.length})</span>
              </h4>
              
              {ideas.map((idea, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border">
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-medium text-gray-900">
                      {idea.text || idea.Title}
                    </h5>
                    <div className="flex items-center space-x-2 text-xs">
                      <span className={`px-2 py-1 rounded-full text-white ${getPriorityColor(idea.priority || idea.Priority)}`}>
                        {idea.priority || idea.Priority}
                      </span>
                      {(idea.feasibility || idea.Feasibility) && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          Feasibility: {idea.feasibility || idea.Feasibility}/10
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-2">
                    {idea.description || idea.ShortDescription}
                  </p>
                  
                  {(idea.category || idea.Category) && (
                    <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                      {idea.category || idea.Category}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-purple-600" />
              <p className="text-gray-600">AI is generating creative ideas...</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AIIdeaGenerator;
