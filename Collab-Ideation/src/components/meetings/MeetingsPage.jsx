import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Video, 
  Plus, 
  Users, 
  Clock, 
  Play, 
  Square, 
  Settings,
  History,
  Calendar
} from 'lucide-react';
import { meetingAPI, projectAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import CreateMeetingModal from './CreateMeetingModal';
import ActiveMeetingCard from './ActiveMeetingCard';
import MeetingHistoryCard from './MeetingHistoryCard';
import { useSocket } from '../../context/SocketContext';
import UpcomingMeetingCard from './UpcomingMeetingCard';

const MeetingsPage = () => {
  const [activeMeetings, setActiveMeetings] = useState([]);
  const [meetingHistory, setMeetingHistory] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [loading, setLoading] = useState(true);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  
  const { user } = useAuth();
  const { socket } = useSocket();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!socket) return;

  const handleMeetingStarted = (room) => {
    setUpcomingMeetings(prev => prev.filter(m => m._id !== room._id));
    setActiveMeetings(prev => [room, ...prev]);
    toast.success(`${room.title} has started!`);
  };

  socket.on('meetingRoomStarted', handleMeetingStarted);
  return () => socket.off('meetingRoomStarted', handleMeetingStarted);
}, [socket]);


  const fetchData = async () => {
    setLoading(true);
    try {
      const [meetingsRes, upcomingRes, historyRes, projectsRes] = await Promise.all([
        meetingAPI.getActiveMeetings(),
        meetingAPI.getUpcomingMeetings(), 
        meetingAPI.getMeetingHistory(),
        projectAPI.getProjects()
      ]);
      
      setActiveMeetings(meetingsRes.data);
      setUpcomingMeetings(upcomingRes.data);
      setMeetingHistory(historyRes.data.meetings);
      setProjects(projectsRes.data);
    } catch (error) {
      console.error('Failed to fetch meetings data:', error);
      toast.error('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async (meetingData) => {
    try {
      const response = await meetingAPI.createMeeting(meetingData);
      if (response.data.status === 'scheduled') {
      setUpcomingMeetings(prev => [response.data, ...prev]);
    } else {
      setActiveMeetings(prev => [response.data, ...prev]);
    }
      setShowCreateModal(false);
      toast.success('Meeting room created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create meeting');
    }
  };

  const canCreateMeeting = user?.role === 'admin' || user?.role === 'pm';

  const handleCancelMeeting = (meetingId) => {
  setUpcomingMeetings(prev => prev.filter(m => m._id !== meetingId));
};

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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Meetings</h1>
            <p className="text-gray-600 mt-2">Host and join voice meetings with whiteboard collaboration</p>
          </div>
          
          {canCreateMeeting && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Host Meeting
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg shadow-sm border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Meetings</p>
                <p className="text-3xl font-bold text-gray-900">{activeMeetings.length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Video className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-lg shadow-sm border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Participants</p>
                <p className="text-3xl font-bold text-gray-900">
                  {activeMeetings.reduce((acc, meeting) => 
                    acc + meeting.participants.filter(p => p.isConnected).length, 0
                  )}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-lg shadow-sm border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Meetings This Week</p>
                <p className="text-3xl font-bold text-gray-900">{meetingHistory.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('active')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'active'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Active Meetings ({activeMeetings.length})
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upcoming'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Upcoming Meetings ({upcomingMeetings.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Meeting History
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            {activeMeetings.length === 0 ? (
              <div className="text-center py-12">
                <Video className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No active meetings</h3>
                <p className="text-gray-600 mb-4">Start a meeting to collaborate with your team</p>
                {canCreateMeeting && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800"
                  >
                    Host Your First Meeting
                  </button>
                )}
              </div>
            ) : (
              activeMeetings.map((meeting) => (
                <ActiveMeetingCard 
                  key={meeting._id} 
                  meeting={meeting} 
                  onUpdate={fetchData}
                />
              ))
            )}
          </div>
        )} 
        
        {activeTab === 'upcoming' && (
          <div className="grid gap-4">
            {upcomingMeetings.length > 0 ? (
              upcomingMeetings.map(meeting => (
                <UpcomingMeetingCard key={meeting._id} meeting={meeting} onUpdate={fetchData} onCancel={handleCancelMeeting}/>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No upcoming meetings</p>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            {meetingHistory.length === 0 ? (
              <div className="text-center py-12">
                <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No meeting history</h3>
                <p className="text-gray-600">Past meetings will appear here</p>
              </div>
            ) : (
              meetingHistory.map((meeting) => (
                <MeetingHistoryCard key={meeting._id} meeting={meeting} />
              ))
            )}
          </div>
        )}

        {/* Create Meeting Modal */}
        {showCreateModal && (
          <CreateMeetingModal
            projects={projects}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateMeeting}
          />
        )}
      </div>
    </div>
  );
};

export default MeetingsPage;
