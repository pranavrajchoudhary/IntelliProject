import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, Clock } from 'lucide-react';

const TaskCard = ({ task }) => {
  const getStatusColor = () => {
    switch (task.status) {
      case 'todo': return 'border-l-gray-400';
      case 'inprogress': return 'border-l-yellow-400';
      case 'done': return 'border-l-green-400';
      default: return 'border-l-gray-400';
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-white border-2 border-gray-200 border-l-4 ${getStatusColor()} p-4 cursor-pointer hover:border-black transition-colors`}
    >
      <h4 className="font-bold text-black mb-2 line-clamp-2">{task.title}</h4>
      
      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="space-y-2">
        {task.assignee && (
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
              <User className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs text-gray-600">
              {task.assignee.name || 'Assigned User'}
            </span>
          </div>
        )}

        {task.dueDate && (
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className={`text-xs ${isOverdue ? 'text-red-500' : 'text-gray-600'}`}>
              Due {new Date(task.dueDate).toLocaleDateString()}
            </span>
            {isOverdue && <span className="text-xs text-red-500 font-bold">OVERDUE</span>}
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500">
            Created {new Date(task.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default TaskCard;
