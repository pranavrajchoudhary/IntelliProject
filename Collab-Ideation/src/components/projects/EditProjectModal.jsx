import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Users } from 'lucide-react';

const EditProjectModal = ({ project, onClose, onSuccess, users }) => {
  const [formData, setFormData] = useState({
    title: project.title,
    description: project.description || ''
  });
  const [selectedMembers, setSelectedMembers] = useState(
    project.members?.map(m => m._id) || []
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setLoading(true);
    try {
      await onSuccess(project._id, {
        ...formData,
        members: selectedMembers
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (userId) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white border-2 border-black p-8 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-black">Edit Project</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
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
              required
              className="w-full px-4 py-3 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors"
              placeholder="Enter project title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Description
            </label>
            <textarea
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors resize-none"
              placeholder="Describe your project..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Team Members
            </label>
            <div className="max-h-40 overflow-y-auto border-2 border-gray-300 p-2">
              {users.map(user => (
                <label key={user._id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(user._id)}
                    onChange={() => toggleMember(user._id)}
                    className="form-checkbox"
                  />
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm">{user.name}</span>
                    <span className="text-xs text-gray-500">({user.role})</span>
                  </div>
                </label>
              ))}
            </div>
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
              <Save className="w-5 h-5" />
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditProjectModal;
