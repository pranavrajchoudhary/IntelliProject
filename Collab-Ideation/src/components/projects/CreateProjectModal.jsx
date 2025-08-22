import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { projectAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useCurrentProject } from '../../context/CurrentProjectContext';

const CreateProjectModal = ({ onClose, onSuccess }) => {
  const { fetchProjects } = useCurrentProject();
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setLoading(true);
    try {
      const response = await projectAPI.createProject(formData);
      toast.success('Project created successfully!');
      onSuccess(response.data);
      await fetchProjects();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white border-2 border-black p-8 w-full max-w-md mx-4"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-black">Create New Project</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Project Title *
            </label>
            <input
              type="text"
              name="title"
              required
              className="w-full px-4 py-3 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors"
              placeholder="Enter project title"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Description
            </label>
            <textarea
              name="description"
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors resize-none"
              placeholder="Describe your project..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={loading || !formData.title.trim()}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              <span>{loading ? 'Creating...' : 'Create Project'}</span>
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateProjectModal;
