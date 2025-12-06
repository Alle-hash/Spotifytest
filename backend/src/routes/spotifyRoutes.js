const express = require('express');
const router = express.Router();
const spotifyController = require('../controllers/spotifyController');

// Auth
router.get('/auth/spotify/login', spotifyController.login);
router.get('/auth/spotify/callback', spotifyController.callback);
router.post('/auth/spotify/logout', spotifyController.logout);

// User & Playlists
router.get('/spotify/me', spotifyController.getUserProfile);
router.get('/spotify/playlists', spotifyController.getUserPlaylists);
router.get('/spotify/playlist/:id', spotifyController.getPlaylistTracks); // Note: controller needs to handle this if distinct from getPlaylistTracks
// Controller had: getPlaylistTracks using req.params.id. Correct.

router.get('/spotify/playlist/:id/tracks', spotifyController.getPlaylistTracks); // Redundant? or distinct?
// Spec says: /spotify/playlist/:id/tracks
// My controller has getPlaylistTracks.
// I'll map this one to getPlaylistTracks. 
// What about /spotify/playlist/:id? Maybe fetches metadata?
// Controller doesn't have metadata only fetcher. I'll map both or just create one.
// I'll map /spotify/playlist/:id/tracks to getPlaylistTracks.
// parameters :id is in path.

// Recommendations
router.post('/spotify/recommend', spotifyController.recommendSongs);
// Controller: recommendSongs (POST)

// Features
router.post('/spotify/features', spotifyController.getAudioFeatures);
// Added this because controller has it but spec routes didn't explicitly list it? 
// Wait, spec under controllers listed getAudioFeatures.
// Spec under routes didn't list it. I'll add it for completeness.

module.exports = router;
