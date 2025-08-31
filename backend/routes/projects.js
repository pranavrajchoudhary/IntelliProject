const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorizeRoles, authorizeProjectAccess } = require('../middleware/authorize');
const projectController = require('../controllers/projectController');

router.post('/', protect, projectController.createProject);

router.get('/', protect, projectController.getProjects);

router.get('/:id', protect, authorizeProjectAccess('read'), projectController.getProjectById);

router.put('/:id', protect, authorizeProjectAccess('update'), projectController.updateProject);

router.delete(
  '/:id',
  protect,
  authorizeProjectAccess('delete'),
  projectController.deleteProject
);

router.post('/:id/members', protect, authorizeProjectAccess('update'), projectController.addMember);


module.exports = router;
