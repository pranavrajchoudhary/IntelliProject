import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Search, Users, MessageSquare, Clock, Check, CheckCheck, Mic, X } from 'lucide-react';
import { messageAPI, projectAPI, uploadAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import AIChat from '../chat/AIChat';
import VoiceRecorder from './VoiceRecorder';
import VoicePlayer from './VoicePlayer';

const MessagesPage = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState([]);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  
  const { user } = useAuth();
  const { socket } = useSocket();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Check if user is at bottom of chat
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isBottom = scrollTop + clientHeight >= scrollHeight - 20; // 20px threshold
      setIsAtBottom(isBottom);
    }
  };

  // Auto-scroll when new messages arrive (only if user is at bottom)
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messages, isAtBottom]);

  // Scroll to bottom when switching chats
  useEffect(() => {
    if (selectedProject && messages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
        setIsAtBottom(true);
      }, 100);
    }
  }, [selectedProject]);

  useEffect(() => {
    fetchProjects();
    fetchUserMessages();
    fetchUnreadCounts();
  }, []);

  useEffect(() => {
    if (selectedProject && !selectedProject.isAI) {
      fetchProjectMessages(selectedProject._id);
      markProjectMessagesAsRead(selectedProject._id);
    }
  }, [selectedProject]);

  // Socket event listeners
useEffect(() => {
  if (socket) {
    socket.on('newMessage', handleNewMessage);
    socket.on('messageDelivered', handleMessageDelivered);
    socket.on('messageRead', handleMessageRead);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messageDelivered', handleMessageDelivered);
      socket.off('messageRead', handleMessageRead);
    };
  }
}, [socket, user._id]); 

  const handleNewMessage = (message) => {
  // Don't add if it's from current user (already added locally)
  if (message.sender._id === user._id) {
    // Just update status if it exists
    setMessages(prev => prev.map(msg =>
      msg.tempId === message.tempId
        ? { ...message, status: 'delivered' }
        : msg
    ));
  } else {
    // Add message from other users
    setMessages(prev => {
      // Check if message already exists to prevent duplicates
      const exists = prev.find(msg => msg._id === message._id);
      if (exists) return prev;
      return [...prev, { ...message, status: 'delivered' }];
    });
    
    // Only update unread counts if this message is NOT from the currently selected project
    if (!selectedProject || message.project !== selectedProject._id) {
      fetchUnreadCounts();
    } else {
      // If it's from current project, mark as read immediately
      setTimeout(() => {
        messageAPI.markAsRead(message._id);
      }, 1000);
    }
  }
};

  const handleMessageDelivered = ({ messageId, tempId }) => {
  setMessages(prev => prev.map(msg => {
    // Match by either messageId or tempId
    if (msg._id === messageId || msg.tempId === tempId) {
      return { ...msg, status: 'delivered' };
    }
    return msg;
  }));
};

const handleMessageRead = ({ messageId, readBy }) => {
  setMessages(prev => prev.map(msg =>
    msg._id === messageId
      ? {
          ...msg,
          status: 'read',
          readBy: [...(msg.readBy || []), { user: readBy, readAt: new Date() }]
        }
      : msg
  ));
};


  const fetchProjects = async () => {
    try {
      const response = await projectAPI.getProjects();
      setProjects(response.data);
    } catch (error) {
      toast.error('Failed to fetch projects');
    }
  };

  const fetchUnreadCounts = async () => {
    try {
      const response = await messageAPI.getUnreadCounts();
      setUnreadCounts(response.data);
    } catch (error) {
      console.error('Failed to fetch unread counts:', error);
    }
  };

  const fetchUserMessages = async () => {
    try {
      const response = await messageAPI.getUserMessages();
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectMessages = async (projectId) => {
    try {
      const response = await messageAPI.getProjectMessages(projectId);
      setMessages(response.data);
      
      // Join socket room
      if (socket) {
        socket.emit('joinRoom', projectId);
      }
    } catch (error) {
      toast.error('Failed to fetch project messages');
    }
  };

  const markProjectMessagesAsRead = async (projectId) => {
    try {
      const unreadMessages = messages.filter(
        msg => msg.sender._id !== user._id && 
               !msg.readBy.some(r => r.user === user._id)
      );

      await Promise.all(
        unreadMessages.map(msg => messageAPI.markAsRead(msg._id))
      );

      fetchUnreadCounts(); // Update counts
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  };

  const sendMessage = async (e) => {
  e.preventDefault();
  if (!newMessage.trim() || !selectedProject) return;
  if (selectedProject.isAI) return;

  // Generate unique temp ID
  const tempId = `temp_${Date.now()}_${Math.random()}`;
  
  const tempMessage = {
    _id: tempId, // Use tempId as _id
    content: newMessage,
    sender: { _id: user._id, name: user.name },
    createdAt: new Date().toISOString(),
    status: 'sending', // Added missing comma
    tempId: tempId, // Add tempId field
    isTemporary: true // Mark as temporary
  };

  setMessages([...messages, tempMessage]);
  setNewMessage('');

  try {
    const response = await messageAPI.createMessage({
      content: newMessage,
      projectId: selectedProject._id, // Added missing comma
      tempId // Send temp ID to backend
    });

    // Replace temp message with real message
    setMessages(prev => prev.map(msg => 
      msg.tempId === tempId 
        ? { ...response.data, status: 'delivered' }
        : msg
    ));
  } catch (error) {
    // Mark temp message as failed
    setMessages(prev => prev.map(msg =>
      msg.tempId === tempId 
        ? { ...msg, status: 'failed' }
        : msg
    ));
    toast.error('Failed to send message');
  }
};

  const sendVoiceMessage = async (audioBlob, duration) => {
  if (!selectedProject || selectedProject.isAI) return;

  try {
    // First upload the audio file to Cloudinary
    const formData = new FormData();
    formData.append('audio', audioBlob, `voice-${Date.now()}.wav`);

    toast.loading('Uploading voice message...');
    const uploadResponse = await uploadAPI.uploadAudio(formData);
    const audioUrl = uploadResponse.data.url;

    // Then create the message with the Cloudinary URL
    const response = await messageAPI.createMessage({
      content: `Voice message (${Math.floor(duration)}s)`,
      projectId: selectedProject._id,
      type: 'voice',
      audioDuration: duration,
      audioUrl: audioUrl
    });

    setMessages(prev => [...prev, response.data]);
    setShowVoiceRecorder(false);
    toast.dismiss();
    toast.success('Voice message sent!');
  } catch (error) {
    console.error('Voice message error:', error);
    toast.dismiss();
    toast.error('Failed to send voice message');
  }
};

  const getMessageStatusIcon = (message) => {
  if (message.sender._id !== user._id) return null;

  switch (message.status) {
    case 'sending':
      return <Clock className="h-3 w-3 text-gray-400 animate-spin" />;
    case 'sent':
      return <Clock className="h-3 w-3 text-gray-400" />;
    case 'delivered':
      return <Check className="h-3 w-3 text-gray-500" />;
    case 'read':
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    case 'failed':
      return <X className="h-3 w-3 text-red-500" />;
    default:
      return null;
  }
};

  const getUnreadCount = (projectId) => {
    const project = unreadCounts.find(p => p.projectId === projectId);
    return project ? project.unreadCount : 0;
  };

  const filteredMessages = messages.filter(message =>
    message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.sender.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border h-[80vh] flex">
          {/* Sidebar */}
          <div className="w-1/3 border-r flex flex-col">
            {/* Header */}
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
              <div className="mt-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
              {/* AI Chat Option */}
              <div
                onClick={() => setSelectedProject({ isAI: true, title: 'AI Assistant' })}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                  selectedProject?.isAI ? 'bg-blue-50 border-r-2 border-r-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">AI Assistant</h3>
                      <p className="text-sm text-gray-600">Get help with platform features</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Chats */}
              {projects.map((project) => {
                const unreadCount = getUnreadCount(project._id);
                return (
                  <div
                    key={project._id}
                    onClick={() => setSelectedProject(project)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedProject?._id === project._id ? 'bg-blue-50 border-r-2 border-r-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {project.title.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900">{project.title}</h3>
                            {unreadCount > 0 && (
                              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="h-3 w-3 mr-1" />
                            {project.members?.length || 0} members
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedProject ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b bg-white">
                  <h3 className="font-semibold text-gray-900">{selectedProject.title}</h3>
                </div>

                {selectedProject.isAI ? (
                  <AIChat />
                ) : (
                  <>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4"
                        ref={messagesContainerRef}
                        onScroll={handleScroll}
                      >
                      {filteredMessages.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No messages yet. Start the conversation!</p>
                        </div>
                      ) : (
                        filteredMessages.map((message) => (
                          <div
                            key={message._id}
                            className={`flex ${
                              message.sender._id === user._id ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.sender._id === user._id
                                  ? 'bg-black text-white'
                                  : 'bg-gray-200 text-gray-900'
                              }`}
                            >
                              {message.sender._id !== user._id && (
                                <p className="text-xs font-medium mb-1 opacity-75">
                                  {message.sender.name}
                                </p>
                              )}
                              
                              {message.type === 'voice' ? (
                                <VoicePlayer 
                                  audioUrl={message.audioUrl}
                                  duration={message.audioDuration}
                                />
                              ) : (
                                <p className="text-sm">{message.content}</p>
                              )}
                              
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs opacity-75">
                                  {new Date(message.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                                {getMessageStatusIcon(message)}
                                
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                         <div ref={messagesEndRef} />
                    </div>
                    {!isAtBottom && (
  <motion.button
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    onClick={scrollToBottom}
    className="absolute bottom-20 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-10"
  >
    ↓
  </motion.button>
)}

                    {/* Voice Recorder */}
                    {showVoiceRecorder && (
                      <div className="p-4 border-t">
                        <VoiceRecorder
                          onSendVoice={sendVoiceMessage}
                          onCancel={() => setShowVoiceRecorder(false)}
                        />
                      </div>
                    )}

                    {/* Message Input */}
                    {!showVoiceRecorder && (
                      <div className="p-4 border-t bg-white">
                        <form onSubmit={sendMessage} className="flex space-x-2">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          
                          <button
                            type="button"
                            onClick={() => setShowVoiceRecorder(true)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                          >
                            <Mic className="h-5 w-5" />
                          </button>
                          
                          <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        </form>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">Choose a project to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
