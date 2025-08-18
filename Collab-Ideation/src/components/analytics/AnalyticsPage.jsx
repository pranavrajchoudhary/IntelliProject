import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, CheckCircle, Clock, Calendar } from 'lucide-react';
import { analyticsAPI, projectAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AnalyticsPage = () => {
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('dashboard');
  const [projectAnalytics, setProjectAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
    if (selectedProject === 'dashboard') {
      fetchDashboardStats();
    } else {
      fetchProjectAnalytics(selectedProject);
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

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const response = await analyticsAPI.getDashboardStats();
      setStats(response.data);
      setProjectAnalytics(null);
    } catch (error) {
      toast.error('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectAnalytics = async (projectId) => {
    setLoading(true);
    try {
      const response = await analyticsAPI.getProjectAnalytics(projectId);
      setProjectAnalytics(response.data);
      setStats(null);
    } catch (error) {
      toast.error('Failed to fetch project analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Analytics</h1>
          <p className="text-gray-600 mt-2">Track your productivity and project progress</p>
        </div>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="px-4 py-2 border-2 border-black focus:border-black focus:outline-none transition-colors appearance-none bg-white mt-4 sm:mt-0"
        >
          <option value="dashboard">Dashboard Overview</option>
          {projects.map(project => (
            <option key={project._id} value={project._id}>{project.title}</option>
          ))}
        </select>
      </div>

      {/* Dashboard Stats */}
      {selectedProject === 'dashboard' && stats && (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                name: 'Total Projects', 
                value: stats.stats.totalProjects, 
                icon: BarChart3, 
                color: 'bg-blue-500' 
              },
              { 
                name: 'Total Tasks', 
                value: stats.stats.totalTasks, 
                icon: CheckCircle, 
                color: 'bg-green-500' 
              },
              { 
                name: 'Completed Tasks', 
                value: stats.stats.completedTasks, 
                icon: CheckCircle, 
                color: 'bg-purple-500' 
              },
              { 
                name: 'In Progress', 
                value: stats.stats.inProgressTasks, 
                icon: Clock, 
                color: 'bg-yellow-500' 
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border-2 border-black p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-black mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.color} rounded-full flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Completion Rate */}
          <div className="bg-white border-2 border-black p-6">
            <h3 className="text-lg font-bold text-black mb-4">Overall Completion Rate</h3>
            <div className="flex items-center space-x-4">
              <div className="flex-1 bg-gray-200 h-4 rounded">
                <div
                  className="bg-green-500 h-4 rounded"
                  style={{ width: `${stats.stats.completionRate}%` }}
                ></div>
              </div>
              <span className="text-xl font-bold text-black">{stats.stats.completionRate}%</span>
            </div>
          </div>

          {/* Project Progress */}
          <div className="bg-white border-2 border-black p-6">
            <h3 className="text-lg font-bold text-black mb-4">Project Progress</h3>
            <div className="space-y-4">
              {stats.projectProgress.map((project) => (
                <div key={project._id} className="border border-gray-200 p-4 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-black">{project.title}</h4>
                    <span className="text-sm text-gray-600">
                      {project.completedTasks}/{project.totalTasks} tasks
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded">
                    <div
                      className="bg-blue-500 h-2 rounded"
                      style={{ 
                        width: `${project.totalTasks > 0 ? (project.completedTasks / project.totalTasks) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white border-2 border-black p-6">
            <h3 className="text-lg font-bold text-black mb-4">Recent Activities</h3>
            <div className="space-y-3">
              {stats.recentActivities.map((activity) => (
                <div key={activity._id} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-b-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-black">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {activity.user.name} in {activity.project.title} • {new Date(activity.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Project Analytics */}
      {selectedProject !== 'dashboard' && projectAnalytics && (
        <>
          {/* Task Status Distribution */}
          <div className="bg-white border-2 border-black p-6">
            <h3 className="text-lg font-bold text-black mb-4">Task Distribution</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { name: 'To Do', value: projectAnalytics.tasksByStatus.todo, color: 'bg-gray-500' },
                { name: 'In Progress', value: projectAnalytics.tasksByStatus.inprogress, color: 'bg-yellow-500' },
                { name: 'Done', value: projectAnalytics.tasksByStatus.done, color: 'bg-green-500' },
              ].map((status) => (
                <div key={status.name} className="text-center">
                  <div className={`w-16 h-16 ${status.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                    <span className="text-white font-bold text-xl">{status.value}</span>
                  </div>
                  <p className="text-sm font-medium text-black">{status.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Project Completion Rate */}
          <div className="bg-white border-2 border-black p-6">
            <h3 className="text-lg font-bold text-black mb-4">Project Completion</h3>
            <div className="flex items-center space-x-4">
              <div className="flex-1 bg-gray-200 h-6 rounded">
                <div
                  className="bg-green-500 h-6 rounded flex items-center justify-center"
                  style={{ width: `${projectAnalytics.completionRate}%` }}
                >
                  <span className="text-white text-sm font-bold">{projectAnalytics.completionRate}%</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {projectAnalytics.tasksByStatus.done} of {projectAnalytics.totalTasks} tasks completed
            </p>
          </div>

          {/* Recent Project Activities */}
          <div className="bg-white border-2 border-black p-6">
            <h3 className="text-lg font-bold text-black mb-4">Project Activity</h3>
            <div className="space-y-3">
              {projectAnalytics.activities.map((activity) => (
                <div key={activity._id} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-b-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-black">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {activity.user.name} • {new Date(activity.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
