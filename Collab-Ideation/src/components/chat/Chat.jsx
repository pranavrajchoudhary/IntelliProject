import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, X, User } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { messageAPI } from '../../services/api';

const Chat = ({ projectId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const { socket, joinRoom } = useSocket();
  const { user } = useAuth();
  const [aiMode, setAIMode] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchMessages();
    }
  }, [projectId]);

  const fetchMessages = async () => {
    try {
      const response = await messageAPI.getProjectMessages(projectId);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (socket && projectId) {
      joinRoom(projectId);
      
      socket.on('chatMessage', (message) => {
        setMessages(prev => [...prev, message]);
      });

      return () => {
        socket.off('chatMessage');
      };
    }
  }, [socket, projectId, joinRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !user) return;

    try {
      const response = await messageAPI.createMessage({
        content: newMessage,
        projectId: projectId
      });

      socket.emit('chatMessage', {
        roomId: projectId,
        ...response.data
      });

      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white border-l-2 border-black">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin w-6 h-6 border-2 border-black border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white border-l-2 border-black">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-black">
        <h3 className="font-bold text-black">Project Chat</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAIMode(!aiMode)}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              aiMode ? 'bg-green-500 text-white' : 'bg-gray-200 text-black'
            }`}
          >
            AI Assistant {aiMode ? 'ON' : 'OFF'}
          </button>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {aiMode ? (
        <ProjectAIChat 
          projectId={projectId} 
          projectTitle="Current Project" 
        />
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <motion.div
                  key={message._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${
                    message.sender._id === user._id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div className={`max-w-xs ${
                    message.sender._id === user._id
                      ? 'bg-black text-white'
                      : 'bg-gray-200 text-black'
                  } rounded-lg p-3`}>
                    {message.sender._id !== user._id && (
                      <div className="text-xs font-medium mb-1 opacity-75">
                        {message.sender.name}
                      </div>
                    )}
                    <p className="text-sm">{message.content}</p>
                    <div className="text-xs mt-1 opacity-75">
                      {new Date(message.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t-2 border-black">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={!newMessage.trim()}
                className="px-3 py-2 bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default Chat;
