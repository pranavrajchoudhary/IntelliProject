import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { aiChatAPI } from '../../services/api';

const AIChat = ({ onClose }) => {
  const [messages, setMessages] = useState([
    {
      _id: '1',
      content: 'Hi! I\'m your AI assistant. How can I help you today?',
      sender: { name: 'AI Assistant' },
      isAI: true,
      options: [
        'How do I create a project?',
        'How do I add team members?',
        'How does the Kanban board work?',
        'How do I use the AI idea generator?'
      ]
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSendMessage = async (messageContent = null, useAdvanced = false) => {
    const content = messageContent || newMessage.trim();
    if (!content) return;

    //Add user message
    const userMessage = {
      _id: Date.now().toString(),
      content,
      sender: { name: user.name },
      isAI: false
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setLoading(true);

    try {
      //Call backend AI chat
      const response = useAdvanced 
        ? await aiChatAPI.advancedChat(content)
        : await aiChatAPI.chat(content);

      const aiMessage = {
        _id: (Date.now() + 1).toString(),
        content: response.data.message,
        sender: { name: 'AI Assistant' },
        isAI: true,
        options: response.data.options,
        isAdvanced: response.data.isAdvanced
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI chat error:', error);
      const errorMessage = {
        _id: (Date.now() + 1).toString(),
        content: 'Sorry, I\'m having trouble right now. Please try again later.',
        sender: { name: 'AI Assistant' },
        isAI: true,
        options: [
          'How do I create a project?',
          'How do I add team members?',
          'How does the Kanban board work?'
        ]
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="p-4 border-b-2 border-black bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-black">AI Assistant</h1>
            <p className="text-sm text-gray-600">Get help with platform features</p>
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
            <div className={`max-w-xs lg:max-w-md ${
              message.isAI ? 'bg-blue-100 text-black' : 'bg-black text-white'
            } rounded-lg p-3`}>
              <div className="flex items-center space-x-2 mb-1">
                {message.isAI ? (
                  <div className="flex items-center space-x-1">
                    <Bot className="w-4 h-4 text-blue-600" />
                    {message.isAdvanced && <Sparkles className="w-3 h-3 text-yellow-500" />}
                  </div>
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span className="text-xs font-medium">{message.sender.name}</span>
              </div>
              <p className="text-sm whitespace-pre-line">{message.content}</p>
              
              {/* AI Options */}
              {message.options && (
                <div className="mt-3 space-y-2">
                  {message.options.map((option, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => handleSendMessage(option)}
                      className="w-full text-left px-3 py-2 bg-white border border-blue-300 hover:bg-blue-50 rounded text-sm transition-colors"
                    >
                      {option}
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-blue-100 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-blue-600" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="p-4 border-t-2 border-black bg-white">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ask me anything about the platform..."
            disabled={loading}
            className="flex-1 px-3 py-2 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors disabled:opacity-50"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!newMessage.trim() || loading}
            className="px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center space-x-1"
          >
            <Send className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => handleSendMessage(newMessage, true)}
            disabled={!newMessage.trim() || loading}
            className="px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
            title="Advanced AI (powered by Gemini)"
          >
            <Sparkles className="w-4 h-4" />
          </motion.button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Use the ✨ button for advanced AI responses powered by Gemini
        </p>
      </form>
    </>
  );
};

export default AIChat;
