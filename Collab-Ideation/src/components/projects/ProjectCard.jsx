import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProjectCard = ({ project }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/project/${project._id}`);
  };

  // Safe member filtering
  const validMembers = (project.members || []).filter(member => member && member.name);
  const memberCount = validMembers.length;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={handleClick}
      className="bg-white border-2 border-black p-6 cursor-pointer hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-black mb-2 line-clamp-1">
            {project.title}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2">
            {project.description || 'No description available'}
          </p>
        </div>
        <button className="p-1 hover:bg-gray-100 rounded">
          <MoreVertical className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{memberCount} members</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Safe Member avatars */}
      <div className="flex items-center mt-4 -space-x-2">
        {validMembers.slice(0, 3).map((member, index) => (
          <div
            key={member._id || index}
            className="w-8 h-8 bg-black rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
            title={member.name}
          >
            {member.name.charAt(0).toUpperCase()}
          </div>
        ))}
        {memberCount > 3 && (
          <div className="w-8 h-8 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center text-gray-600 text-xs font-bold">
            +{memberCount - 3}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProjectCard;
