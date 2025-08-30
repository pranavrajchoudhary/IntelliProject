import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Lightbulb, Users, CheckCircle, Clock, FolderOpen, TrendingUp, Calendar, TrendingDown, Minus } from 'lucide-react';
import { projectAPI, taskAPI, userAPI, analyticsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ProjectCard from '../projects/ProjectCard';
import CreateProjectModal from '../projects/CreateProjectModal';
import AIIdeaGenerator from '../ai/AIIdeaGenerator';
import CreateMeetingModal from '../meetings/CreateMeetingModal';
import toast from 'react-hot-toast';
import { meetingAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [refreshingTrends, setRefreshingTrends] = useState(false);
  const [showCreateMeetingModal, setShowCreateMeetingModal] = useState(false);
  const navigate = useNavigate();

  const handleCreateMeeting = async (meetingData) => {
  try {
    const response = await meetingAPI.createMeeting(meetingData);
    setShowCreateMeetingModal(false);
    
    if (response.data.status === 'scheduled') {
      // Scheduled meeting -> go to meetings page
      toast.success('Meeting scheduled successfully!');
      navigate('/meetings');
    } else {
      // Active meeting -> join it directly
      toast.success('Meeting started successfully!');
      // navigate(`/meetings/${response.data._id}`);
      navigate('/meetings');
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to create meeting');
  }
};


  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefreshTrends = async () => {
  if (refreshingTrends) return;
  
  setRefreshingTrends(true);
  try {
    // Check if today's snapshot exists
    const snapshotInfo = await analyticsAPI.getLatestSnapshot();
    
    if (snapshotInfo.data.isToday) {
      // Today's snapshot exists, just refresh dashboard data
      await fetchDashboardData();
      console.log('Dashboard refreshed - using existing snapshot');
      alert('Dashboard refreshed successfully!');
    } else {
      // No snapshot for today, create new one
      const result = await analyticsAPI.saveStatsSnapshot(false);
      console.log('New snapshot created:', result);
      await fetchDashboardData();
      alert('Trends snapshot created and dashboard refreshed!');
    }
  } catch (error) {
    console.error('Failed to refresh trends:', error);
    alert('Failed to refresh trends');
  } finally {
    setRefreshingTrends(false);
  }
};

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Use analytics API for stats with trends
      const [projectsRes, analyticsRes] = await Promise.all([
        projectAPI.getProjects(),
        analyticsAPI.getDashboardStats()
      ]);

      setProjects(projectsRes.data);
      setStats(analyticsRes.data.stats);
      setTrends(analyticsRes.data.trends);
      setRecentActivity(analyticsRes.data.recentActivities || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get trend icon and color
  const getTrendIcon = (change, percentage) => {
    if (change > 0) return { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50' };
    if (change < 0) return { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50' };
    return { icon: Minus, color: 'text-gray-400', bg: 'bg-gray-50' };
  };

  const dashboardStats = stats && trends ? [
    {
      name: 'Active Projects',
      value: stats.totalProjects,
      icon: FolderOpen,
      color: 'bg-blue-500',
      change: trends.projectsChange,
      percentage: trends.projectsPercentage
    },
    {
      name: 'Team Members',
      value: stats.teamMembers,
      icon: Users,
      color: 'bg-green-500',
      change: trends.membersChange,
      percentage: trends.membersPercentage
    },
    {
      name: 'Completed Tasks',
      value: stats.completedTasks,
      icon: CheckCircle,
      color: 'bg-purple-500',
      change: trends.completedChange,
      percentage: trends.completedPercentage
    },
    {
      name: 'Total Tasks',
      value: stats.totalTasks,
      icon: Clock,
      color: 'bg-yellow-500',
      change: trends.tasksChange,
      percentage: trends.tasksPercentage
    }
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-black">
            Welcome back, {user?.name.split(' ')[0]}!
          </h1>
          <p className="text-gray-600 mt-2">Here's what's happening with your projects today.</p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefreshTrends}
            disabled={refreshingTrends}
            className={`flex items-center justify-center space-x-2 px-4 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors ${
              refreshingTrends ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {refreshingTrends ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Refreshing...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                Refresh Trends
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAIGenerator(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors"
          >
            <Lightbulb className="w-5 h-5" />
            <span>AI Ideas</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Project</span>
          </motion.button>
        </div>
      </div>

       {/* Stats with Dynamic Trends */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {dashboardStats.map((stat, index) => {
              const trend = getTrendIcon(stat.change, stat.percentage);
              const IconComponent = stat.icon;
              const TrendIcon = trend.icon;
              
              return (
                <motion.div
                  key={stat.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                      
                      {/* Trend Indicator */}
                      <div className="flex items-center mt-2">
                        <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${trend.bg} ${trend.color}`}>
                          <TrendIcon className="h-3 w-3 mr-1" />
                          {Math.abs(stat.percentage)}%
                        </div>
                        <span className="text-xs text-gray-500 ml-2">
                          {stat.change > 0 ? '+' : ''}{stat.change} from last period
                        </span>
                      </div>
                    </div>
                    
                    <div className={`${stat.color} p-3 rounded-lg`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

      {/* Quick Actions */}
      <div className="bg-white border-2 border-black p-6">
        <h2 className="text-xl font-bold text-black mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => setShowCreateModal(true)}
            className="p-4 border border-gray-300 hover:border-black transition-colors text-left"
          >
            <Plus className="w-8 h-8 text-black mb-2" />
            <h3 className="font-bold">Create Project</h3>
            <p className="text-sm text-gray-600">Start a new collaborative project</p>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => setShowAIGenerator(true)}
            className="p-4 border border-gray-300 hover:border-black transition-colors text-left"
          >
            <Lightbulb className="w-8 h-8 text-black mb-2" />
            <h3 className="font-bold">Generate Ideas</h3>
            <p className="text-sm text-gray-600">Get AI-powered creative suggestions</p>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            className="p-4 border border-gray-300 hover:border-black transition-colors text-left"
            onClick={() => setShowCreateMeetingModal(true)}
          >
            <Calendar className="w-8 h-8 text-black mb-2" />
            <h3 className="font-bold">Schedule Meeting</h3>
            <p className="text-sm text-gray-600">Plan team collaboration sessions</p>
          </motion.button>
        </div>
      </div>

      {/* Recent Activity & Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="bg-white border-2 border-black p-6">
          <h2 className="text-xl font-bold text-black mb-4">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-gray-500">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((task) => (
                <div key={task._id} className="flex items-start space-x-3">
                  <div className={`w-3 h-3 rounded-full mt-2 ${
                    task.status === 'done' ? 'bg-green-500' : 
                    task.status === 'inprogress' ? 'bg-yellow-500' : 'bg-gray-400'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-gray-500">{task.projectTitle}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(task.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-black">Recent Projects</h2>
            {projects.length > 4 && (
              <a href='/projects'>
              <button className="text-black hover:underline font-medium">
                View all projects
              </button>
              </a>
            )}
          </div>
          
          {projects.length === 0 ? (
            <div className="text-center py-12 border-2 border-gray-200 border-dashed">
              <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-black mb-2">No projects yet</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first project</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2 bg-black text-white hover:bg-gray-800 transition-colors"
              >
                Create Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.slice(0, 4).map((project, index) => (
                <motion.div
                  key={project._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ProjectCard project={project} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newProject) => {
            setProjects([newProject, ...projects]);
            setShowCreateModal(false);
            fetchDashboardData(); // Refresh stats
          }}
        />
      )}

      {showCreateMeetingModal && (
          <CreateMeetingModal
            projects={projects}
            onClose={() => setShowCreateMeetingModal(false)}
            onSubmit={handleCreateMeeting}
          />
        )}

      {showAIGenerator && (
        <AIIdeaGenerator
          onClose={() => setShowAIGenerator(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
