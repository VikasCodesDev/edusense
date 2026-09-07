const express = require('express');
const router = express.Router();
const bugController = require('../controllers/bugController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.post('/', requireAuth, requireRole(['student', 'faculty']), bugController.createReport);

module.exports = router;
