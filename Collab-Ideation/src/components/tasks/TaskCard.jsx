import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, Clock, Edit, Trash2, MoreVertical, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { taskAPI } from '../../services/api';
import toast from 'react-hot-toast';

const TaskCard = ({ task, project, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();

  const getStatusColor = () => {
    switch (task.status) {
      case 'todo': return 'border-l-gray-400';
      case 'inprogress': return 'border-l-yellow-400';
      case 'done': return 'border-l-green-400';
      default: return 'border-l-gray-400';
    }
  };

  // Enhanced permission check
  const isAdmin = user.role === 'admin';
  const isProjectManager = project?.owner === user._id;
  const isAssignee = task.assignees?.some(assignee => 
    assignee.user._id === user._id
  );
  
  const canEdit = isAdmin || isProjectManager;
  const canChangeStatus = isAdmin || isProjectManager || isAssignee;

  // Check if task is overdue
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    setDeleting(true);
    try {
      await taskAPI.deleteTask(task._id);
      toast.success('Task deleted successfully');
      onDelete(task._id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  // Get card styling based on overdue status
  const getCardStyling = () => {
    let baseClasses = `bg-white p-4 rounded-lg shadow-sm border-l-4 ${getStatusColor()} hover:shadow-md transition-shadow relative`;
    
    if (isOverdue) {
      baseClasses += ' border-2 border-red-200 bg-red-50';
    }
    
    return baseClasses;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={getCardStyling()}
    >
      {canEdit && (
        <div className="absolute top-2 right-2">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <MoreVertical className="h-4 w-4 text-gray-500" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-6 bg-white border rounded-lg shadow-lg z-10 min-w-32">
              <button
                onClick={() => {
                  onEdit(task);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
              <button
                onClick={() => {
                  handleDelete();
                  setShowMenu(false);
                }}
                disabled={deleting}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overdue badge */}
      {isOverdue && (
        <div className="absolute -top-2 -right-2">
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-md">
            OVERDUE
          </span>
        </div>
      )}

      <h4 className={`font-medium mb-2 pr-8 ${isOverdue ? 'text-red-800' : 'text-gray-900'}`}>
        {task.title}
      </h4>
      
      {task.description && (
        <p className={`text-sm mb-3 ${isOverdue ? 'text-red-700' : 'text-gray-600'}`}>
          {task.description}
        </p>
      )}
      
      <div className="space-y-2">
        {/* Assignees */}
        {task.assignees && task.assignees.length > 0 && (
          <div className="space-y-1">
            {task.assignees.map((assignee, index) => (
              <div key={index} className={`flex items-center text-sm ${isOverdue ? 'text-red-700' : 'text-gray-600'}`}>
                <User className="h-4 w-4 mr-2" />
                <span className="font-medium">{assignee.user.name}</span>
                <span className="mx-2">•</span>
                <div className="flex items-center">
                  <Shield className="h-3 w-3 mr-1" />
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {assignee.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Due Date */}
        {task.dueDate && (
          <div className={`flex items-center text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
            <Calendar className="h-4 w-4 mr-2" />
            Due {new Date(task.dueDate).toLocaleDateString()}
          </div>
        )}
        
        {/* Created Date */}
        <div className={`flex items-center text-xs ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
          <Clock className="h-3 w-3 mr-1" />
          Created {new Date(task.createdAt).toLocaleDateString()}
        </div>

        {/* Permission indicator for current user */}
        {canChangeStatus && !canEdit && (
          <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit">
            <Shield className="h-3 w-3 mr-1" />
            Can modify status
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TaskCard;
