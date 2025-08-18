import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Search, Users, MessageSquare, Clock } from 'lucide-react';
import { messageAPI, projectAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const MessagesPage = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchProjects();
    fetchUserMessages();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectMessages(selectedProject._id);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const response = await projectAPI.getProjects();
      setProjects(response.data);
    } catch (error) {
      toast.error('Failed to fetch projects');
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
    } catch (error) {
      toast.error('Failed to fetch project messages');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedProject) return;

    try {
      const response = await messageAPI.createMessage({
        content: newMessage,
        projectId: selectedProject._id
      });
      
      setMessages([...messages, response.data]);
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const filteredMessages = messages.filter(message =>
    message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.sender.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Projects Sidebar */}
      <div className="w-80 border-r-2 border-black bg-gray-50">
        <div className="p-4 border-b-2 border-black">
          <h2 className="text-xl font-bold text-black">Projects</h2>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="overflow-y-auto h-full">
          {projects.map((project) => (
            <motion.div
              key={project._id}
              whileHover={{ backgroundColor: '#f3f4f6' }}
              onClick={() => setSelectedProject(project)}
              className={`p-4 cursor-pointer border-b border-gray-200 ${
                selectedProject?._id === project._id ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{project.title}</h3>
                  <p className="text-sm opacity-75">
                    {project.members?.length || 0} members
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedProject ? (
          <>
            {/* Header */}
            <div className="p-4 border-b-2 border-black bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-black">{selectedProject.title}</h1>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{selectedProject.members?.length || 0} members</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {filteredMessages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                filteredMessages.map((message) => (
                  <motion.div
                    key={message._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${
                      message.sender._id === user._id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div className={`max-w-xs lg:max-w-md ${
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
                      <div className={`text-xs mt-1 flex items-center space-x-1 ${
                        message.sender._id === user._id ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        <Clock className="w-3 h-3" />
                        <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="p-4 border-t-2 border-black bg-white">
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-24 h-24 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-bold text-black mb-2">Select a Project</h2>
              <p className="text-gray-600">Choose a project to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
