import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Lightbulb, Users, CheckCircle, Clock, FolderOpen, TrendingUp, Calendar } from 'lucide-react';
import { projectAPI, taskAPI, userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ProjectCard from '../projects/ProjectCard';
import CreateProjectModal from '../projects/CreateProjectModal';
import AIIdeaGenerator from '../ai/AIIdeaGenerator';
import DashboardAIChat from '../ai/DashboardAIChat';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    teamMembers: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [projectsRes, usersRes] = await Promise.all([
        projectAPI.getProjects(),
        userAPI.getUsers()
      ]);

      const projects = projectsRes.data;
      const users = usersRes.data;

      //Fetch task counts for each project
      const projectsWithStats = await Promise.all(
        projects.map(async (project) => {
          try {
            const tasksRes = await taskAPI.getProjectTasks(project._id);
            const tasks = tasksRes.data;
            return {
              ...project,
              taskCount: tasks.length,
              completedTasks: tasks.filter(t => t.status === 'done').length,
              tasks: tasks
            };
          } catch (error) {
            return { ...project, taskCount: 0, completedTasks: 0, tasks: [] };
          }
        })
      );

      //Calculate stats
      const totalTasks = projectsWithStats.reduce((sum, p) => sum + p.taskCount, 0);
      const completedTasks = projectsWithStats.reduce((sum, p) => sum + p.completedTasks, 0);

      setProjects(projectsWithStats);
      setStats({
        totalProjects: projects.length,
        totalTasks,
        completedTasks,
        teamMembers: users.length
      });

      //Generate recent activity
      const allTasks = projectsWithStats.flatMap(p => p.tasks.map(t => ({ ...t, projectTitle: p.title })));
      const recentTasks = allTasks
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 5);
      
      setRecentActivity(recentTasks);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const dashboardStats = [
    { 
      name: 'Active Projects', 
      value: stats.totalProjects, 
      icon: FolderOpen, 
      color: 'bg-blue-500',
      change: '+12%'
    },
    { 
      name: 'Team Members', 
      value: stats.teamMembers, 
      icon: Users, 
      color: 'bg-green-500',
      change: '+3'
    },
    { 
      name: 'Completed Tasks', 
      value: stats.completedTasks, 
      icon: CheckCircle, 
      color: 'bg-purple-500',
      change: '+24%'
    },
    { 
      name: 'Pending Tasks', 
      value: stats.totalTasks - stats.completedTasks, 
      icon: Clock, 
      color: 'bg-yellow-500',
      change: stats.totalTasks > 0 ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}%` : '0%'
    },
  ];

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">
            Welcome back, {user?.name.split(' ')[0]}!
          </h1>
          <p className="text-gray-600 mt-2">Here's what's happening with your projects today.</p>
        </div>
        <div className="flex space-x-4 mt-4 sm:mt-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAIGenerator(true)}
            className="flex items-center space-x-2 px-4 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors"
          >
            <Lightbulb className="w-5 h-5" />
            <span>AI Ideas</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Project</span>
          </motion.button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white border-2 border-black p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-black mt-1">{stat.value}</p>
                {stat.change && (
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">{stat.change}</span>
                  </div>
                )}
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-full flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
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
              <button className="text-black hover:underline font-medium">
                View all projects
              </button>
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

      {showAIGenerator && (
        <AIIdeaGenerator
          onClose={() => setShowAIGenerator(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
