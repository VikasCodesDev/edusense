const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/dashboard', requireAuth, requireRole(['faculty', 'admin']), facultyController.getDashboardOverview);
router.get('/students', requireAuth, requireRole(['faculty', 'admin']), facultyController.getStudentsList);
router.get('/students/:id', requireAuth, requireRole(['faculty', 'admin']), facultyController.getStudentDetail);
router.post('/interventions', requireAuth, requireRole(['faculty', 'admin']), facultyController.logIntervention);

module.exports = router;
