const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/me', requireAuth, requireRole('student'), studentController.getMyProfile);
router.put('/me/academic-data', requireAuth, requireRole('student'), studentController.updateMyAcademicData);
router.get('/:id', requireAuth, studentController.getStudentById);
router.get('/:id/risk', requireAuth, studentController.getRiskAnalysis);
router.get('/:id/recommendations', requireAuth, studentController.getRecommendations);
router.post('/:id/recommendations/generate', requireAuth, studentController.regenerateRecommendations);
router.get('/:id/progress', requireAuth, studentController.getProgressHistory);

module.exports = router;
