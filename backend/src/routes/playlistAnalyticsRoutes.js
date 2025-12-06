const express = require('express');
const router = express.Router();
const playlistAnalyticsController = require('../controllers/playlistAnalyticsController');

// Get playlist analytics
router.get('/analytics/:playlistId', playlistAnalyticsController.getPlaylistAnalytics);

module.exports = router;
