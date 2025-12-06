const { oauth2Client, generateGoogleLoginUrl } = require('../config/google');
const { google } = require('googleapis');
const matchSong = require('../utils/matchSong');
const { getSpotifyClient } = require('./spotifyController');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:5173';

// Helper to get youtube client with auto-refresh
const getYoutubeClient = async (req) => {
    const rawTokens = req.cookies.google_tokens;
    if (!rawTokens) throw new Error('No Google tokens found');

    const tokens = JSON.parse(rawTokens);
    oauth2Client.setCredentials(tokens);

    // Refresh if expired
    if (!tokens.expiry_date || tokens.expiry_date < Date.now()) {
        try {
            const { credentials } = await oauth2Client.refreshAccessToken();
            oauth2Client.setCredentials(credentials);

            // Save new tokens back to cookie (need access to res object, which is on req in some middlewares, 
            // but here we might need to rely on the caller passing res or just updating the cookie if possible.)
            // req.res is often available in Express if not stripped.)
            if (req.res) {
                req.res.cookie('google_tokens', JSON.stringify(credentials), {
                    httpOnly: true,
                    maxAge: 30 * 24 * 60 * 60 * 1000
                });
            }
        } catch (err) {
            console.error('Failed to refresh token', err);
            throw new Error('Token refresh failed');
        }
    }

    return google.youtube({ version: 'v3', auth: oauth2Client });
};

// Export the helper
exports.getYoutubeClient = getYoutubeClient;

exports.login = (req, res) => {
    res.redirect(generateGoogleLoginUrl());
};

exports.callback = async (req, res) => {
    const { code } = req.query;
    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        const isProduction = process.env.NODE_ENV === 'production' || process.env.FRONTEND_URL?.includes('vercel');

        res.cookie('google_tokens', JSON.stringify(tokens), {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        res.redirect(`${FRONTEND_URL}/dashboard?login=success&provider=youtube`);
    } catch (err) {
        console.error('Error in Google Callback:', err);
        res.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
    }
};

exports.checkStatus = async (req, res) => {
    try {
        const rawTokens = req.cookies.google_tokens;
        if (!rawTokens) {
            return res.status(401).json({ connected: false });
        }

        const tokens = JSON.parse(rawTokens);
        if (!tokens.access_token) {
            return res.status(401).json({ connected: false });
        }

        res.json({ connected: true });
    } catch (err) {
        console.error('YouTube status check failed:', err);
        res.status(401).json({ connected: false });
    }
};

exports.createPlaylist = async (req, res) => {
    const { title, description } = req.body;
    try {
        const youtube = await getYoutubeClient(req);
        const response = await youtube.playlists.insert({
            part: 'snippet,status',
            requestBody: {
                snippet: { title, description },
                status: { privacyStatus: 'private' }
            }
        });
        res.json(response.data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to create playlist' });
    }
};

exports.searchVideo = async (youtube, query) => {
    try {
        const response = await youtube.search.list({
            part: 'snippet',
            q: query,
            type: 'video',
            maxResults: 5,
            videoCategoryId: '10' // Music
        });
        return response.data.items;
    } catch (err) {
        console.error('Search failed:', err);
        return [];
    }
};

exports.exportPlaylist = async (req, res) => {
    const { spotifyPlaylistId, name } = req.body;

    try {
        // 1. Fetch Spotify Tracks using shared helper
        const spotify = getSpotifyClient(req);
        const spotifyData = await spotify.getPlaylistTracks(spotifyPlaylistId);
        const tracks = spotifyData.body.items.map(item => item.track);

        // 2. Create YouTube Playlist
        const youtube = await getYoutubeClient(req);
        const playlistResp = await youtube.playlists.insert({
            part: 'snippet,status',
            requestBody: {
                snippet: { title: name || 'Spotify Export', description: 'Exported from Spotify' },
                status: { privacyStatus: 'private' }
            }
        });
        const youtubePlaylistId = playlistResp.data.id;

        // 3. Search and Add
        const results = [];
        for (const track of tracks) {
            const query = `${track.name} ${track.artists[0].name}`;

            // Use specific search helper
            const videos = await exports.searchVideo(youtube, query);
            const match = matchSong(track, videos);

            if (match.matched && match.video) {
                try {
                    await youtube.playlistItems.insert({
                        part: 'snippet',
                        requestBody: {
                            snippet: {
                                playlistId: youtubePlaylistId,
                                resourceId: {
                                    kind: 'youtube#video',
                                    videoId: match.video.id.videoId
                                }
                            }
                        }
                    });
                    results.push({ track: track.name, status: 'Added', videoId: match.video.id.videoId });
                } catch (insertErr) {
                    console.error(`Failed to insert ${track.name}`, insertErr);
                    results.push({ track: track.name, status: 'Error' });
                }
            } else {
                results.push({ track: track.name, status: 'Not Found' });
            }
        }

        res.json({ message: 'Export complete', playlistId: youtubePlaylistId, results });

    } catch (err) {
        console.error('Export failed', err);
        res.status(500).json({ message: 'Export failed' });
    }
};

// Disconnect/Logout
exports.disconnect = (req, res) => {
    try {
        // Clear the Google tokens cookie
        res.clearCookie('google_tokens', { path: '/' });
        console.log('✅ YouTube disconnected - Google tokens cleared');
        res.json({ message: 'Disconnected successfully' });
    } catch (err) {
        console.error('❌ Error disconnecting YouTube:', err);
        res.status(500).json({ message: 'Failed to disconnect' });
    }
};
