import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, Clock, Edit, Trash2, MoreVertical } from 'lucide-react';
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

  const canEdit = user.role === 'admin' || 
                 (user.role === 'pm' && project?.owner === user._id);

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${getStatusColor()} hover:shadow-md transition-shadow relative`}
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

      <h4 className="font-medium text-gray-900 mb-2 pr-8">{task.title}</h4>
      
      {task.description && (
        <p className="text-sm text-gray-600 mb-3">{task.description}</p>
      )}
      
      <div className="space-y-2">
        {task.assignee && (
          <div className="flex items-center text-sm text-gray-600">
            <User className="h-4 w-4 mr-2" />
            {task.assignee.name}
          </div>
        )}
        
        {task.dueDate && (
          <div className={`flex items-center text-sm ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
            <Calendar className="h-4 w-4 mr-2" />
            Due {new Date(task.dueDate).toLocaleDateString()}
            {isOverdue && <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded">OVERDUE</span>}
          </div>
        )}
        
        <div className="flex items-center text-xs text-gray-500">
          <Clock className="h-3 w-3 mr-1" />
          Created {new Date(task.createdAt).toLocaleDateString()}
        </div>
      </div>
    </motion.div>
  );
};

export default TaskCard;
