const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorizeRoles, authorizeProjectAccess } = require('../middleware/authorize');
const projectController = require('../controllers/projectController');

// Create project - Any authenticated user
router.post('/', protect, projectController.createProject);

// Get projects - Role-based filtering
router.get('/', protect, projectController.getProjects);

// Get project by ID - Access controlled
router.get('/:id', protect, authorizeProjectAccess('read'), projectController.getProjectById);

// Update project - Only admins and project owners
router.put('/:id', protect, authorizeProjectAccess('update'), projectController.updateProject);

router.delete(
  '/:id',
  protect,
  authorizeProjectAccess('delete'),
  projectController.deleteProject
);

// Add member - Only admins and project owners
router.post('/:id/members', protect, authorizeProjectAccess('update'), projectController.addMember);


module.exports = router;
