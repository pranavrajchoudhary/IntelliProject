import React from 'react';
import { useCurrentProject } from '../context/CurrentProjectContext';
import ProjectDetail from './projects/ProjectDetail';

const KanbanBoard = () => {
  const { currentProject } = useCurrentProject();

  if (!currentProject) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <span className="text-xl font-bold text-red-600 mb-2">Please select a current working project</span>
        <span className="text-gray-500">Use the dropdown in the navbar to choose a project.</span>
      </div>
    );
  }

  // Pass the current project id as prop to ProjectDetail
  return <ProjectDetail id={currentProject._id} />;
};

export default KanbanBoard;