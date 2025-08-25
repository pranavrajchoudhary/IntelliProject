import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Video, Users } from 'lucide-react';

const CreateMeetingModal = ({ projects, onClose, onSubmit }) => {
  const [startMode, setStartMode]   = useState('now');  // 'now' | 'later'
  const [pickDate, setPickDate]     = useState(null);   // Date object
  const [formData, setFormData] = useState({
    title: '',
    projectId: ''
  });
  const [loading, setLoading] = useState(false);
  // console.log('Projects in modal:', projects);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.projectId) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        title: formData.title,
        projectId: formData.projectId,
        scheduledStartTime: startMode === 'later' ? pickDate : null,
      });

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
      >
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <Video className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Host New Meeting</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter meeting title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project
            </label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select a project...</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>
              {/* Start-time selector */}
              <div className="flex gap-4 mt-6 mb-6 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="now"
                    checked={startMode === 'now'}
                    onChange={() => setStartMode('now')}
                  />
                  Start now
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="later"
                    checked={startMode === 'later'}
                    onChange={() => setStartMode('later')}
                  />
                  Schedule for later
                </label>
              </div>

              {startMode === 'later' && (
                <input
                  type="datetime-local"
                  required
                  className="mt-2 mb-5 w-full border rounded px-3 py-2"
                  value={pickDate ? pickDate.toISOString().slice(0, 16) : ''}
                  onChange={(e) => setPickDate(new Date(e.target.value))}
                  min={new Date().toISOString().slice(0, 16)}
                />
              )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim() || !formData.projectId}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Video className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Creating...' : 'Start Meeting'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateMeetingModal;
