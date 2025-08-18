import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Lightbulb, Sparkles, User } from 'lucide-react';
import { aiChatAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DashboardAIChat = ({ onClose }) => {
  const [messages, setMessages] = useState([
    {
      _id: '1',
      content: 'Hi! I can help you generate creative project ideas. What type of project are you thinking about?',
      sender: { name: 'AI Project Assistant' },
      isAI: true,
      showForm: true
    }
  ]);
  const [topic, setTopic] = useState('');
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleGenerateIdeas = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    const userMessage = {
      _id: Date.now().toString(),
      content: `Generate project ideas for: ${topic}${industry ? ` (${industry})` : ''}`,
      sender: { name: user.name },
      isAI: false
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await aiChatAPI.generateIdeas(topic, industry);
      
      const aiMessage = {
        _id: (Date.now() + 1).toString(),
        content: response.data.message,
        sender: { name: 'AI Project Assistant' },
        isAI: true,
        showForm: true //Show form again for more ideas
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI ideas error:', error);
      const errorMessage = {
        _id: (Date.now() + 1).toString(),
        content: 'Sorry, I had trouble generating ideas. Please try again with a different topic!',
        sender: { name: 'AI Project Assistant' },
        isAI: true,
        showForm: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setTopic('');
      setIndustry('');
    }
  };

  return (
    <>
      {/* Header */}
      <div className="p-4 border-b-2 border-black bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-black">AI Project Ideas</h1>
            <p className="text-sm text-gray-600">Generate creative project concepts</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <motion.div
            key={message._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.isAI ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`max-w-2xl ${
              message.isAI ? 'bg-purple-100 text-black' : 'bg-black text-white'
            } rounded-lg p-4`}>
              <div className="flex items-center space-x-2 mb-2">
                {message.isAI ? (
                  <Lightbulb className="w-4 h-4 text-purple-600" />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span className="text-xs font-medium">{message.sender.name}</span>
              </div>
              <div className="text-sm whitespace-pre-line">{message.content}</div>
            </div>
          </motion.div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-purple-100 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-600 animate-spin" />
                <span className="text-sm">Generating creative ideas...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Idea Generation Form */}
      <form onSubmit={handleGenerateIdeas} className="p-4 border-t-2 border-black bg-white space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Project topic (e.g., Healthcare, Education, Gaming)"
            disabled={loading}
            className="px-3 py-2 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors disabled:opacity-50"
            required
          />
          <input
            type="text"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="Industry (optional)"
            disabled={loading}
            className="px-3 py-2 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors disabled:opacity-50"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={!topic.trim() || loading}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          <Sparkles className="w-5 h-5" />
          <span>{loading ? 'Generating Ideas...' : 'Generate Project Ideas'}</span>
        </motion.button>
      </form>
    </>
  );
};

export default DashboardAIChat;
