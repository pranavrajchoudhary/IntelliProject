const Project = require('../models/Project');

// Role-based authorization middleware
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role '${req.user.role}' is not authorized for this action` 
      });
    }

    next();
  };
};

// Project ownership authorization
const authorizeProjectAccess = (action = 'read') => {
  return async (req, res, next) => {
    try {
      const projectId = req.params.id || req.params.projectId;
      
      if (!projectId) {
        return res.status(400).json({ message: 'Project ID required' });
      }

      const project = await Project.findById(projectId);
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const user = req.user;

      // Admin can access everything
      if (user.role === 'admin') {
        req.project = project;
        return next();
      }

      // Project manager can access their own projects
      if (user.role === 'pm') {
        if (project.owner.toString() === user._id.toString()) {
          req.project = project;
          return next();
        }
        
        if (action === 'read' && project.members.includes(user._id)) {
          req.project = project;
          return next();
        }
        
        return res.status(403).json({ 
          message: 'You can only access projects you own or are a member of' 
        });
      }

      // Members can read projects they belong to
      if (user.role === 'member' || user.role === 'guest') {
        if (action !== 'read') {
          return res.status(403).json({ 
            message: 'Members can only view projects, not modify them' 
          });
        }
        
        if (project.members.includes(user._id)) {
          req.project = project;
          return next();
        }
        
        return res.status(403).json({ 
          message: 'You can only view projects you are a member of' 
        });
      }

      return res.status(403).json({ message: 'Access denied' });
    } catch (error) {
      return res.status(500).json({ message: 'Authorization check failed' });
    }
  };
};

module.exports = { authorizeRoles, authorizeProjectAccess };
