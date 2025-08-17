import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, X, User } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

const Chat = ({ projectId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const { socket, joinRoom } = useSocket();
  const { user } = useAuth();

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

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !user) return;

    const message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: {
        _id: user._id,
        name: user.name
      },
      timestamp: new Date()
    };

    socket.emit('chatMessage', {
      roomId: projectId,
      ...message
    });

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-black">
        <h3 className="text-lg font-bold text-black">Project Chat</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${
                message.sender._id === user?._id ? 'justify-end' : 'justify-start'
              }`}
            >
              <div className={`max-w-xs ${
                message.sender._id === user?._id
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-black'
              } rounded-lg p-3`}>
                {message.sender._id !== user?._id && (
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center">
                      <User className="w-2 h-2 text-white" />
                    </div>
                    <span className="text-xs font-medium">
                      {message.sender.name}
                    </span>
                  </div>
                )}
                <p className="text-sm">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.sender._id === user?._id
                    ? 'text-gray-300'
                    : 'text-gray-500'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
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
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
