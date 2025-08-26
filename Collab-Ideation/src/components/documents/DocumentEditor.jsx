import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Clock, Users, FileText, X } from 'lucide-react';
import { documentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const DocumentEditor = ({ projectId, documentId, onClose }) => {
  const [document, setDocument] = useState(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [versions, setVersions] = useState([]);
  const [showVersions, setShowVersions] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (documentId) {
      fetchDocument();
    } else {
      // New document
      setTitle('Untitled Document');
      setContent('');
      setLoading(false);
    }
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      const response = await documentAPI.getDocument(documentId);
      const doc = response.data;
      setDocument(doc);
      setTitle(doc.title);
      setContent(doc.currentContent || '');
      setVersions(doc.versions || []);
    } catch (error) {
      toast.error('Failed to load document');
      console.error('Error fetching document:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter a document title');
      return;
    }

    setSaving(true);
    try {
      if (documentId) {
        // Update existing document
        const response = await documentAPI.updateDocument(documentId, {
          title,
          currentContent: content
        });
        setDocument(response.data);
        setVersions(response.data.versions || []);
      } else {
        // Create new document
        const response = await documentAPI.createDocument({
          projectId,
          title,
          content
        });
        setDocument(response.data);
      }
      toast.success('Document saved successfully!');
    } catch (error) {
      toast.error('Failed to save document');
      console.error('Error saving document:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreVersion = async (versionIndex) => {
    if (!versions[versionIndex]) return;
    
    const version = versions[versionIndex];
    setContent(version.content);
    setShowVersions(false);
    toast.success('Version restored! Don\'t forget to save.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-2 sm:p-4 gap-2 sm:gap-0 border-b-2 border-black">
        <div className="flex items-center space-x-4">
          <div className="flex items-center ml-5">
            <FileText className="w-6 h-6 text-black" />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl w-50 lg:w-80 font-bold bg-transparent border-none outline-none focus:bg-gray-50 px-2 py-1 rounded"
              placeholder="Document title..."
            />
          </div>
          {document && (
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-1" />
              <span>Last saved: {new Date(document.updatedAt).toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {versions.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowVersions(!showVersions)}
              className="flex items-center space-x-2 px-3 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors"
            >
              <Clock className="w-4 h-4" />
              <span>Versions ({versions.length})</span>
            </motion.button>
          )}
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </motion.button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Version History Sidebar */}
        {showVersions && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            className="w-80 border-r-2 border-black p-4 bg-gray-50 overflow-y-auto"
          >
            <h3 className="text-lg font-bold text-black mb-4">Version History</h3>
            <div className="space-y-3">
              {versions.map((version, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  className="p-3 bg-white border-2 border-gray-200 hover:border-black transition-colors cursor-pointer"
                  onClick={() => handleRestoreVersion(index)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Version {versions.length - index}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(version.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <Users className="w-3 h-3" />
                    <span>Edited by {version.editedBy?.name || 'Unknown'}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                    {version.content.substring(0, 100)}...
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Main Editor */}
        <div className="flex-1 p-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing your document..."
            className="w-full h-full resize-none border-2 border-gray-200 focus:border-black focus:outline-none p-4 text-base leading-relaxed"
            style={{ minHeight: '500px' }}
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-t-2 border-black p-2 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Words: {content.split(/\s+/).filter(word => word.length > 0).length}</span>
            <span>Characters: {content.length}</span>
          </div>
          {user && (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-black rounded-full"></div>
              <span>Editing as {user.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;
