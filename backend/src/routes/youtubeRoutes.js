const express = require('express');
const router = express.Router();
const youtubeController = require('../controllers/youtubeController');

// Auth
router.get('/auth/google/login', youtubeController.login);
router.get('/auth/google/callback', youtubeController.callback);
router.post('/auth/google/disconnect', youtubeController.disconnect);

// Export
router.post('/youtube/export', youtubeController.exportPlaylist);

// Create Playlist
router.post('/youtube/playlist/create', youtubeController.createPlaylist);

// Status check
router.get('/youtube/status', youtubeController.checkStatus);

module.exports = router;
