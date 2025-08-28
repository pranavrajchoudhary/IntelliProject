import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Activity, Search, Download, Filter } from 'lucide-react';

const ActivityLogModal = ({ activities, isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.user?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || activity.type === typeFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const activityDate = new Date(activity.timestamp);
      const now = new Date();
      const daysDiff = (now - activityDate) / (1000 * 60 * 60 * 24);
      
      switch (dateFilter) {
        case 'today':
          matchesDate = daysDiff < 1;
          break;
        case 'week':
          matchesDate = daysDiff < 7;
          break;
        case 'month':
          matchesDate = daysDiff < 30;
          break;
      }
    }
    
    return matchesSearch && matchesType && matchesDate;
  });

  const exportActivities = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "User,Action,Description,Timestamp\n"
      + filteredActivities.map(activity => 
          `${activity.user?.name || 'Unknown'},${activity.type},${activity.description},${activity.timestamp}`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "activity_log.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">Activity Log</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
            </select>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <button
              onClick={exportActivities}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Activity List */}
        <div className="flex-1 overflow-y-auto">
          {filteredActivities.map((activity, index) => (
            <div key={index} className="flex items-center p-4 border-b border-gray-100 hover:bg-gray-50">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.user?.name || 'Unknown User'}</span>
                    {' '}{activity.description}
                  </p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    activity.type === 'login' ? 'bg-green-50 text-green-600' :
                    activity.type === 'logout' ? 'bg-gray-50 text-gray-600' :
                    activity.type === 'create' ? 'bg-blue-50 text-blue-600' :
                    activity.type === 'update' ? 'bg-yellow-50 text-yellow-600' :
                    activity.type === 'delete' ? 'bg-red-50 text-red-600' :
                    'bg-gray-50 text-gray-600'
                  }`}>
                    {activity.type}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(activity.timestamp).toLocaleString()}
                  {activity.ipAddress && ` • ${activity.ipAddress}`}
                  {activity.userAgent && ` • ${activity.userAgent.split(' ')[0]}`}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 text-center text-sm text-gray-500">
          Showing {filteredActivities.length} of {activities.length} activities
        </div>
      </motion.div>
    </div>
  );
};

export default ActivityLogModal;
