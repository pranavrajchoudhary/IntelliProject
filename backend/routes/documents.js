const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const docController = require('../controllers/documentController');

router.post('/', protect, docController.createDocument);
router.get('/project/:projectId', protect, docController.getProjectDocs);
router.put('/:id', protect, docController.updateDocument);

module.exports = router;
