const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorizeProjectAccess } = require('../middleware/authorize');
const taskController = require('../controllers/taskController');

// Create task - Project members can create
router.post('/', protect, taskController.createTask);

// Get project tasks - Project members can view
router.get('/project/:projectId', protect, authorizeProjectAccess('read'), taskController.getProjectTasks);

// Get single task
router.get('/:id', protect, taskController.getTask);

// Update task - Only admins and project owners
router.put('/:id', protect, taskController.updateTask);

// Delete task - Only admins and project owners
router.delete('/:id', protect, taskController.deleteTask);

module.exports = router;
