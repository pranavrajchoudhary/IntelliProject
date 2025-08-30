import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, MoreVertical, Users, Calendar, Trash2, Edit } from 'lucide-react';
import { projectAPI, taskAPI, userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CreateProjectModal from './CreateProjectModal';
import EditProjectModal from './EditProjectModal';
import DeleteProjectModal from './DeleteProjectModal';
import toast from 'react-hot-toast';

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, filterBy]);

  const fetchProjects = async () => {
    try {
      const [projectsRes, tasksRes] = await Promise.all([
        projectAPI.getProjects(),
        Promise.all([]) // We'll fetch task counts for each project
      ]);
      
      const projectsWithStats = await Promise.all(
        projectsRes.data.map(async (project) => {
          try {
            const tasksRes = await taskAPI.getProjectTasks(project._id);
            const tasks = tasksRes.data;
            return {
              ...project,
              taskCount: tasks.length,
              completedTasks: tasks.filter(t => t.status === 'done').length,
              pendingTasks: tasks.filter(t => t.status !== 'done').length
            };
          } catch (error) {
            return {
              ...project,
              taskCount: 0,
              completedTasks: 0,
              pendingTasks: 0
            };
          }
        })
      );
      
      setProjects(projectsWithStats);
    } catch (error) {
      toast.error('Failed to fetch projects');
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getUsersForCollaboration();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const filterProjects = () => {
    let filtered = projects;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    switch (filterBy) {
      case 'owned':
        filtered = filtered.filter(project => project.owner._id === user._id);
        break;
      case 'member':
        filtered = filtered.filter(project => project.members.some(member => member._id === user._id));
        break;
      default:
        break;
    }

    setFilteredProjects(filtered);
  };

  const handleDeleteProject = async (projectId) => {
    try {
      await projectAPI.deleteProject(projectId);
      setProjects(projects.filter(p => p._id !== projectId));
      toast.success('Project deleted successfully');
    } catch (error) {
      toast.error('Failed to delete project');
    } finally {
      setDeletingProject(null);
    }
  };

  const handleEditProject = async (projectId, updatedData) => {
    try {
      const response = await projectAPI.updateProject(projectId, updatedData);
      setProjects(projects.map(p => p._id === projectId ? { ...p, ...response.data } : p));
      toast.success('Project updated successfully');
    } catch (error) {
      toast.error('Failed to update project');
    } finally {
      setEditingProject(null);
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
          <h1 className="text-3xl font-bold text-black">Projects</h1>
          <p className="text-gray-600 mt-2">Manage your projects and collaborate with your team</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors mt-4 sm:mt-0"
        >
          <Plus className="w-5 h-5" />
          <span>New Project</span>
        </motion.button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="pl-10 pr-8 py-2 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors appearance-none bg-white"
          >
            <option value="all">All Projects</option>
            <option value="owned">Owned by Me</option>
            <option value="member">I'm a Member</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 border-2 border-gray-200 border-dashed">
          <h3 className="text-lg font-medium text-black mb-2">
            {searchTerm || filterBy !== 'all' ? 'No projects match your criteria' : 'No projects yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterBy !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by creating your first project'
            }
          </p>
          {!searchTerm && filterBy === 'all' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-black text-white hover:bg-gray-800 transition-colors"
            >
              Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, index) => (
            <ProjectCard
              key={project._id}
              project={project}
              index={index}
              onEdit={() => setEditingProject(project)}
              onDelete={() => setDeletingProject(project)}
              onClick={() => navigate(`/project/${project._id}`)}
              currentUser={user}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newProject) => {
            setProjects([newProject, ...projects]);
            setShowCreateModal(false);
          }}
          users={users}
        />
      )}

      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSuccess={handleEditProject}
          users={users}
        />
      )}

      {deletingProject && (
        <DeleteProjectModal
          project={deletingProject}
          onClose={() => setDeletingProject(null)}
          onConfirm={() => handleDeleteProject(deletingProject._id)}
        />
      )}
    </div>
  );
};

const ProjectCard = ({ project, index, onEdit, onDelete, onClick, currentUser }) => {
  const [showMenu, setShowMenu] = useState(false);

  const canEdit = currentUser.role === 'admin' || currentUser.role === 'pm' || project.owner._id === currentUser._id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white border-2 border-black p-6 hover:shadow-lg transition-shadow cursor-pointer relative"
      onClick={onClick}
    >
      {/* Project Menu */}
      {canEdit && (
        <div className="absolute top-4 right-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <MoreVertical className="w-5 h-5 text-gray-400" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 w-32 bg-white border-2 border-black shadow-lg z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                  setShowMenu(false);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 text-left"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                  setShowMenu(false);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-red-50 text-red-600 text-left"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Project Content */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-black mb-2 line-clamp-1 pr-8">
          {project.title}
        </h3>
        <p className="text-gray-600 text-sm line-clamp-2">
          {project.description || 'No description available'}
        </p>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-black">{project.taskCount || 0}</div>
          <div className="text-xs text-gray-500">Total Tasks</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{project.completedTasks || 0}</div>
          <div className="text-xs text-gray-500">Completed</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-600">Progress</span>
          <span className="text-sm text-gray-600">
            {project.taskCount ? Math.round((project.completedTasks / project.taskCount) * 100) : 0}%
          </span>
        </div>
        <div className="w-full bg-gray-200 h-2">
          <div
            className="bg-green-500 h-2"
            style={{
              width: `${project.taskCount ? (project.completedTasks / project.taskCount) * 100 : 0}%`
            }}
          ></div>
        </div>
      </div>

      {/* Project Info */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{project.members?.length || 0} members</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Member Avatars */}
      <div className="flex items-center mt-4 -space-x-2">
        {project.members?.slice(0, 3).map((member, index) => (
          <div
            key={index}
            className="w-8 h-8 bg-black rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
            title={member.name}
          >
            {member.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        ))}
        {project.members?.length > 3 && (
          <div className="w-8 h-8 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center text-gray-600 text-xs font-bold">
            +{project.members.length - 3}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProjectsPage;
