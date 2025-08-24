import React from 'react';
import { motion } from 'framer-motion';
import { Video, Users, Clock, Calendar } from 'lucide-react';

const MeetingHistoryCard = ({ meeting }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border p-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <div className="p-2 bg-gray-100 rounded-lg mr-3">
              <Video className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
              <p className="text-sm text-gray-600">{meeting.project.title}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {meeting.participants.length} participant{meeting.participants.length !== 1 ? 's' : ''}
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {formatDuration(meeting.duration)}
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {formatDate(meeting.startedAt)}
            </div>
          </div>

          <div className="mt-3">
            <p className="text-sm text-gray-600">
              Hosted by <span className="font-medium">{meeting.host.name}</span>
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-500">
            Ended {formatDate(meeting.endedAt)}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MeetingHistoryCard;
