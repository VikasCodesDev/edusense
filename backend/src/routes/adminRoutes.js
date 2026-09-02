const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const adminController = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/overview', requireAuth, requireRole('admin'), adminController.getOverview);
router.get('/users', requireAuth, requireRole('admin'), adminController.getUsers);
router.post('/users', requireAuth, requireRole('admin'), adminController.createUser);
router.put('/users/:id/assign-students', requireAuth, requireRole('admin'), adminController.assignStudentsToFaculty);
router.delete('/users/:id', requireAuth, requireRole('admin'), adminController.deleteUser);
router.post('/import/preview', requireAuth, requireRole('admin'), upload.single('file'), adminController.previewDatasetImport);
router.post('/import/confirm', requireAuth, requireRole('admin'), adminController.confirmDatasetImport);
router.get('/model', requireAuth, requireRole('admin'), adminController.getModelStatus);
router.post('/model/retrain', requireAuth, requireRole('admin'), adminController.triggerModelRetrain);
router.get('/logs', requireAuth, requireRole('admin'), adminController.getActivityLogs);

module.exports = router;
