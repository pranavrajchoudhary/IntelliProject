const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');
const projectController = require('../controllers/projectController');

router.post('/', protect, projectController.createProject);
router.get('/', protect, projectController.getProjects);
router.get('/:id', protect, projectController.getProjectById);
router.put('/:id', protect, projectController.updateProject);
router.delete('/:id', protect, authorizeRoles('admin','pm'), projectController.deleteProject);
router.post('/:id/members', protect, authorizeRoles('admin','pm'), projectController.addMember);

module.exports = router;
