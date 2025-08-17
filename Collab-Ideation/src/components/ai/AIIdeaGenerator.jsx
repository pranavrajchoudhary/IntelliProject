import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Lightbulb, Loader2 } from 'lucide-react';
import { aiAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AIIdeaGenerator = ({ onClose, projectId }) => {
  const [prompt, setPrompt] = useState('');
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const response = await aiAPI.generateIdeas(prompt, projectId);
      setIdeas(response.data.ideas);
      toast.success('Ideas generated successfully!');
    } catch (error) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white border-2 border-black p-8 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-black">AI Idea Generator</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              What would you like ideas for?
            </label>
            <div className="flex space-x-4">
              <input
                type="text"
                className="flex-1 px-4 py-3 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors"
                placeholder="E.g., mobile app features, marketing strategies, UI improvements..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="flex items-center space-x-2 px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Lightbulb className="w-5 h-5" />
                )}
                <span>{loading ? 'Generating...' : 'Generate'}</span>
              </motion.button>
            </div>
          </div>

          {ideas.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-black mb-4">Generated Ideas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ideas.map((idea, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white border-2 border-gray-200 p-4 hover:border-black transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-black">
                        {idea.Title || idea.text}
                      </h4>
                      {idea.Priority && (
                        <span className={`px-2 py-1 text-xs text-white rounded ${getPriorityColor(idea.Priority)}`}>
                          {idea.Priority}
                        </span>
                      )}
                    </div>
                    
                    {idea.ShortDescription && (
                      <p className="text-sm text-gray-600 mb-2">
                        {idea.ShortDescription}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      {idea.Category && (
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          {idea.Category}
                        </span>
                      )}
                      {idea.Feasibility && (
                        <span>Feasibility: {idea.Feasibility}/10</span>
                      )}
                    </div>
                    
                    {idea.Tags && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {idea.Tags.split(',').map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="bg-black text-white px-2 py-1 text-xs rounded"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AIIdeaGenerator;
