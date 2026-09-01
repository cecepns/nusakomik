const express = require('express');
const { authenticateToken } = require('../middlewares/auth');
const requireAdmin = require('../middlewares/requireAdmin');
const KomiknesiaSyncController = require('../controllers/KomiknesiaSyncController');

const router = express.Router();

// Admin protection for all sync routes
router.use(authenticateToken, requireAdmin);

router.get('/status', KomiknesiaSyncController.checkStatus);
router.get('/source-feed', KomiknesiaSyncController.getSourceFeed);
router.post('/sync-latest', KomiknesiaSyncController.syncLatest);
router.post('/sync-selected', KomiknesiaSyncController.syncSelected);
router.post('/sync-slug/:slug', KomiknesiaSyncController.syncBySlug);

module.exports = router;
