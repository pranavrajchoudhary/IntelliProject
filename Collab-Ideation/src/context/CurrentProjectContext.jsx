import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { projectAPI } from '../services/api';

const CurrentProjectContext = createContext();

export const useCurrentProject = () => useContext(CurrentProjectContext);

export const CurrentProjectProvider = ({ children }) => {
  const [currentProject, setCurrentProject] = useState(null);
  const [projects, setProjects] = useState([]);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await projectAPI.getProjects();
      setProjects(res.data);
    } catch (err) {
      // handle error if needed
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <CurrentProjectContext.Provider value={{ currentProject, setCurrentProject, projects, fetchProjects }}>
      {children}
    </CurrentProjectContext.Provider>
  );
};