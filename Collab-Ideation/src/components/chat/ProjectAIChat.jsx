import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Target, User } from 'lucide-react';
import { aiChatAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ProjectAIChat = ({ projectId, projectTitle }) => {
  const [messages, setMessages] = useState([
    {
      _id: '1',
      content: `Hi! I'm your AI assistant for "${projectTitle}". I can help with project-specific advice, task management, and team collaboration. What would you like to know?`,
      sender: { name: 'Project AI' },
      isAI: true
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userMessage = {
      _id: Date.now().toString(),
      content: newMessage,
      sender: { name: user.name },
      isAI: false
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = newMessage;
    setNewMessage('');
    setLoading(true);

    try {
      const response = await aiChatAPI.projectChat(currentMessage, projectId);
      
      const aiMessage = {
        _id: (Date.now() + 1).toString(),
        content: response.data.message,
        sender: { name: 'Project AI' },
        isAI: true
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Project AI error:', error);
      const errorMessage = {
        _id: (Date.now() + 1).toString(),
        content: 'Sorry, I had trouble accessing project details. Please try asking about general project management!',
        sender: { name: 'Project AI' },
        isAI: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <motion.div
            key={message._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.isAI ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`max-w-xs lg:max-w-md ${
              message.isAI ? 'bg-green-100 text-black' : 'bg-black text-white'
            } rounded-lg p-3`}>
              <div className="flex items-center space-x-2 mb-1">
                {message.isAI ? (
                  <Target className="w-4 h-4 text-green-600" />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span className="text-xs font-medium">{message.sender.name}</span>
              </div>
              <p className="text-sm whitespace-pre-line">{message.content}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ask about this project..."
            disabled={loading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:border-green-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectAIChat;
