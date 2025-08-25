import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, User, Calendar, Tag, Plus, Trash2 } from 'lucide-react';
import { taskAPI, userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import SearchableSelect from '../common/SearchableSelect';  

const EditTaskModal = ({ task, projectMembers, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || '',
    status: task.status,
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
  });
  
  // Handle both old single assignee and new multiple assignees structure
  const [assignees, setAssignees] = useState(() => {
    if (task.assignees && task.assignees.length > 0) {
      return task.assignees.map(a => ({ user: a.user._id, role: a.role }));
    } else if (task.assignee) {
      return [{ user: task.assignee._id, role: '' }];
    } else {
      return [{ user: '', role: '' }];
    }
  });
  
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Enhanced permission check
  const isAdmin = user.role === 'admin';
  const isProjectManager = user.role === 'pm';
  const isAssignee = task.assignees 
    ? task.assignees.some(assignee => assignee.user._id === user._id)
    : task.assignee?._id === user._id;
  
  const canEdit = isAdmin || isProjectManager;
  const canChangeStatus = isAdmin || isProjectManager || isAssignee;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit && !canChangeStatus) return;

    setLoading(true);
    try {
      const validAssignees = assignees.filter(a => a.user && a.role.trim());
      
      const taskData = {
        ...(canEdit && {
          title: formData.title,
          description: formData.description,
          assignees: validAssignees
        }),
        ...(canChangeStatus && { status: formData.status }),
        dueDate: formData.dueDate || null
      };

      const response = await taskAPI.updateTask(task._id, taskData);
      toast.success('Task updated successfully!');
      onSuccess(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const addAssignee = () => {
    setAssignees([...assignees, { user: '', role: '' }]);
  };

  const removeAssignee = (index) => {
    setAssignees(assignees.filter((_, i) => i !== index));
  };

  const updateAssignee = (index, field, value) => {
    const updated = [...assignees];
    updated[index][field] = value;
    setAssignees(updated);
  };

  // Status-only edit mode for assignees
  if (!canEdit && canChangeStatus) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
        >
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-lg font-semibold">Update Status</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <p className="text-gray-900 font-medium">{task.title}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Tag className="h-4 w-4 inline mr-1" />
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="todo">To Do</option>
                  <option value="inprogress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    );
  }

  // Read-only mode
  if (!canEdit && !canChangeStatus) {
    return (
      <motion.div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">View Task</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <p className="text-gray-900">{task.title}</p>
            </div>
            
            {task.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-gray-900">{task.description}</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <p className="text-gray-900 capitalize">{task.status.replace(/([A-Z])/g, ' $1')}</p>
            </div>
            
            {((task.assignees && task.assignees.length > 0) || task.assignee) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assignees</label>
                {task.assignees ? task.assignees.map((assignee, index) => (
                  <p key={index} className="text-gray-900">
                    {assignee.user.name} - {assignee.role}
                  </p>
                )) : (
                  <p className="text-gray-900">{task.assignee.name}</p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Full edit mode
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Edit Task</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Tag className="h-4 w-4 inline mr-1" />
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="todo">To Do</option>
                <option value="inprogress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            {/* Assignees Section - Updated */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  <User className="h-4 w-4 inline mr-1" />
                  Assignees
                </label>
                <button
                  type="button"
                  onClick={addAssignee}
                  className="text-sm text-purple-600 hover:text-purple-700 flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </button>
              </div>
              
                <div className="space-y-2">
                  {assignees.map((assignee, index) => (
                    <div key={index} className="flex space-x-2">
                      <select
                        value={assignee.user}
                        onChange={(e) => updateAssignee(index, 'user', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      >
                        <option value="">Select Member</option>
                        {projectMembers.map((member) => (
                          <option key={member._id} value={member._id}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={assignee.role}
                        onChange={(e) => updateAssignee(index, 'role', e.target.value)}
                        placeholder="Role"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                      {assignees.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAssignee(index)}
                          className="p-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="h-4 w-4 inline mr-1" />
                Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Task
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default EditTaskModal;
