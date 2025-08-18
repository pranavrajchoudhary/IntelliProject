import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, FileText, Calendar, User, Eye } from 'lucide-react';
import { documentAPI, projectAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import CreateDocumentModal from './CreateDocumentModal';
import DocumentEditor from './DocumentEditor';
import toast from 'react-hot-toast';

const DocumentsPage = () => {
  const [projects, setProjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [selectedProject, setSelectedProject] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
    fetchAllDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, selectedProject, searchTerm]);

  const fetchProjects = async () => {
    try {
      const response = await projectAPI.getProjects();
      setProjects(response.data);
    } catch (error) {
      toast.error('Failed to fetch projects');
    }
  };

  const fetchAllDocuments = async () => {
    try {
      const response = await projectAPI.getProjects();
      const allDocs = [];
      
      for (const project of response.data) {
        try {
          const docsResponse = await documentAPI.getProjectDocs(project._id);
          const projectDocs = docsResponse.data.map(doc => ({
            ...doc,
            projectTitle: project.title,
            projectId: project._id
          }));
          allDocs.push(...projectDocs);
        } catch (error) {
          console.error(`Failed to fetch docs for project ${project._id}`);
        }
      }
      
      setDocuments(allDocs);
    } catch (error) {
      toast.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = documents;

    if (selectedProject !== 'all') {
      filtered = filtered.filter(doc => doc.projectId === selectedProject);
    }

    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.currentContent?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDocuments(filtered);
  };

  const handleCreateDocument = async (docData) => {
    try {
      const response = await documentAPI.createDocument(docData);
      const newDoc = {
        ...response.data,
        projectTitle: projects.find(p => p._id === docData.projectId)?.title,
        projectId: docData.projectId
      };
      setDocuments([newDoc, ...documents]);
      setShowCreateModal(false);
      toast.success('Document created successfully!');
    } catch (error) {
      toast.error('Failed to create document');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (editingDocument) {
    return (
      <DocumentEditor
        documentId={editingDocument._id}
        projectId={editingDocument.projectId}
        onClose={() => setEditingDocument(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Documents</h1>
          <p className="text-gray-600 mt-2">Manage and collaborate on project documents</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors mt-4 sm:mt-0"
        >
          <Plus className="w-5 h-5" />
          <span>New Document</span>
        </motion.button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors"
          />
        </div>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="px-4 py-2 border-2 border-gray-300 focus:border-black focus:outline-none transition-colors appearance-none bg-white"
        >
          <option value="all">All Projects</option>
          {projects.map(project => (
            <option key={project._id} value={project._id}>{project.title}</option>
          ))}
        </select>
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12 border-2 border-gray-200 border-dashed">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-black mb-2">
            {searchTerm || selectedProject !== 'all' 
              ? 'No documents match your criteria' 
              : 'No documents yet'
            }
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedProject !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first document to get started'
            }
          </p>
          {!searchTerm && selectedProject === 'all' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-black text-white hover:bg-gray-800 transition-colors"
            >
              Create Document
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc, index) => (
            <motion.div
              key={doc._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              onClick={() => setEditingDocument(doc)}
              className="bg-white border-2 border-black p-6 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8 text-black" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-black line-clamp-1">
                      {doc.title}
                    </h3>
                    <p className="text-sm text-gray-600">{doc.projectTitle}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-gray-600 text-sm line-clamp-3">
                  {doc.currentContent?.substring(0, 150) || 'No content yet...'}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    <span>{doc.createdBy?.name || 'Unknown'}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="w-3 h-3" />
                  <span>{doc.versions?.length || 0} versions</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Document Modal */}
      {showCreateModal && (
        <CreateDocumentModal
          projects={projects}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateDocument}
        />
      )}
    </div>
  );
};

export default DocumentsPage;
