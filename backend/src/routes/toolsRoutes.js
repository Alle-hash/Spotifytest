const express = require('express');
const router = express.Router();
const playlistToolsController = require('../controllers/playlistToolsController');

router.get('/tools/analytics', playlistToolsController.analyzePlaylist);
router.post('/tools/cleanup', playlistToolsController.cleanPlaylist);
router.post('/tools/preview', playlistToolsController.previewChanges);

module.exports = router;
