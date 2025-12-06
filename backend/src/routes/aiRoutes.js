const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// Session management
router.get('/ai/session', aiController.getSession);

// Generation
router.post('/ai/generate', aiController.generatePlaylist);
router.post('/ai/vibe', aiController.suggestNewSongsFromVibe);

// Selected songs management
router.post('/ai/add-selected', aiController.addToSelected);
router.get('/ai/selected', aiController.getSelected);

// Playlist creation
router.post('/ai/create-playlist', aiController.createPlaylistFromTracks);

module.exports = router;
