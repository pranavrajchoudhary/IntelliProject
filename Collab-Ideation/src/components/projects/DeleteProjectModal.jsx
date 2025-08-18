import React from 'react';
import { motion } from 'framer-motion';
import { X, Trash2, AlertTriangle } from 'lucide-react';

const DeleteProjectModal = ({ project, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white border-2 border-black p-8 w-full max-w-md mx-4"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-black">Delete Project</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-black mb-2">Are you sure?</h3>
          <p className="text-gray-600 mb-4">
            You're about to delete "<strong>{project.title}</strong>". This action cannot be undone.
          </p>
          <div className="bg-red-50 border border-red-200 p-3 rounded text-left">
            <p className="text-sm text-red-800">
              <strong>This will permanently delete:</strong>
            </p>
            <ul className="text-sm text-red-700 mt-2 list-disc list-inside">
              <li>All project tasks and comments</li>
              <li>All project documents and files</li>
              <li>All project activity history</li>
            </ul>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onConfirm}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            <span>Delete Project</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default DeleteProjectModal;
