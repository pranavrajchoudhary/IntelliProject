const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorizeProjectAccess } = require('../middleware/authorize');
const taskController = require('../controllers/taskController');

router.post('/', protect, taskController.createTask);

router.get('/project/:projectId', protect, authorizeProjectAccess('read'), taskController.getProjectTasks);

router.get('/:id', protect, taskController.getTask);

router.put('/:id', protect, taskController.updateTask);

router.delete('/:id', protect, taskController.deleteTask);

module.exports = router;
