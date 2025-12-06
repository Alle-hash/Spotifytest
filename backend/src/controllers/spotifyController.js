const { spotifyApi, generateLoginUrl } = require('../config/spotify');
const SpotifyWebApi = require('spotify-web-api-node');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:5173';

// Helper to get a client with user's token
const getSpotifyClient = (req) => {
    const accessToken = req.cookies.spotify_access_token || req.headers.authorization?.split(' ')[1];

    if (!accessToken) {
        console.log('❌ No access token found in cookies or headers');
        console.log('Cookies:', Object.keys(req.cookies));
        console.log('Authorization header:', req.headers.authorization);
        throw new Error('No access token found');
    }

    console.log('✅ Access token found, creating Spotify client');
    const client = new SpotifyWebApi();
    client.setAccessToken(accessToken);
    return client;
};

exports.getSpotifyClient = getSpotifyClient;

// Login route - redirects to Spotify authorization
exports.login = (req, res) => {
    try {
        console.log('🔐 Login request received, generating Spotify auth URL...');
        const url = generateLoginUrl();
        console.log('📨 Redirecting to Spotify authorization page');
        res.redirect(url);
    } catch (err) {
        console.error('❌ Error generating login URL:', err);
        res.redirect(`${FRONTEND_URL}/?error=config_error`);
    }
};

// Callback route - exchanges code for tokens
exports.callback = async (req, res) => {
    const { code, error } = req.query;

    console.log('\n🔄 Spotify callback received');
    console.log('- Has code:', !!code);
    console.log('- Has error:', !!error);

    // Check if Spotify returned an error
    if (error) {
        console.error('❌ Spotify authorization error:', error);
        return res.redirect(`${FRONTEND_URL}/?error=spotify_denied`);
    }

    // Check if code is present
    if (!code) {
        console.error('❌ No authorization code received');
        return res.redirect(`${FRONTEND_URL}/?error=no_code`);
    }

    try {
        console.log('🔑 Exchanging authorization code for tokens...');

        // Exchange code for access token and refresh token
        const data = await spotifyApi.authorizationCodeGrant(code);
        const { access_token, refresh_token, expires_in } = data.body;

        console.log('✅ Token exchange successful!');
        console.log('- Access token received:', access_token ? access_token.substring(0, 20) + '...' : 'NO TOKEN');
        console.log('- Refresh token received:', !!refresh_token);
        console.log('- Expires in:', expires_in, 'seconds');

        const isProduction = process.env.NODE_ENV === 'production' || process.env.FRONTEND_URL?.includes('vercel');

        // Store tokens in HTTP-only cookies
        res.cookie('spotify_access_token', access_token, {
            httpOnly: true,
            secure: isProduction, // true in production with HTTPS
            sameSite: isProduction ? 'none' : 'lax', // 'none' required for cross-origin in production
            maxAge: expires_in * 1000,
            path: '/'
        });

        res.cookie('spotify_refresh_token', refresh_token, {
            httpOnly: true,
            secure: isProduction, // true in production with HTTPS
            sameSite: isProduction ? 'none' : 'lax', // 'none' required for cross-origin in production
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            path: '/'
        });

        console.log('🍪 Cookies set successfully');
        console.log('📨 Redirecting to dashboard with success signal');

        res.redirect(`${FRONTEND_URL}/dashboard?login=success&provider=spotify`);
    } catch (err) {
        console.error('❌ Error in Spotify Callback:');
        console.error('Error message:', err.message);
        console.error('Error body:', err.body);
        console.error('Status code:', err.statusCode);

        // Provide more specific error information
        let errorType = 'auth_failed';
        if (err.message?.includes('client_secret')) {
            errorType = 'invalid_credentials';
            console.error('⚠️  HINT: Check your SPOTIFY_CLIENT_SECRET in .env file');
        } else if (err.message?.includes('redirect_uri')) {
            errorType = 'redirect_uri_mismatch';
            console.error('⚠️  HINT: Redirect URI must match exactly in Spotify Dashboard');
        }

        res.redirect(`${FRONTEND_URL}/?error=${errorType}`);
    }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
    try {
        console.log('👤 Fetching user profile...');
        const client = getSpotifyClient(req);
        const data = await client.getMe();
        console.log('✅ User profile retrieved:', data.body.display_name || data.body.id);
        res.json(data.body);
    } catch (err) {
        console.error('❌ Failed to fetch profile:', err.message);
        res.status(401).json({
            message: 'Failed to fetch profile',
            error: err.message,
            hint: 'Make sure you are logged in and cookies are enabled'
        });
    }
};

// Get user playlists
exports.getUserPlaylists = async (req, res) => {
    try {
        console.log('📋 Fetching user playlists...');
        const client = getSpotifyClient(req);
        const data = await client.getUserPlaylists();
        console.log('✅ Retrieved', data.body.items?.length || 0, 'playlists');
        res.json(data.body);
    } catch (err) {
        console.error('❌ Failed to fetch playlists:', err.message);
        res.status(500).json({ message: 'Failed to fetch playlists' });
    }
};

// Get playlist tracks
exports.getPlaylistTracks = async (req, res) => {
    const { id } = req.params;
    try {
        console.log('🎵 Fetching tracks for playlist:', id);
        const client = getSpotifyClient(req);
        const data = await client.getPlaylistTracks(id);
        console.log('✅ Retrieved', data.body.items?.length || 0, 'tracks');
        res.json(data.body);
    } catch (err) {
        console.error('❌ Failed to fetch tracks:', err.message);
        res.status(500).json({ message: 'Failed to fetch tracks' });
    }
};

// Get audio features
exports.getAudioFeatures = async (req, res) => {
    const { ids } = req.body;
    try {
        console.log('🎶 Fetching audio features for', ids?.length || 0, 'tracks');
        const client = getSpotifyClient(req);
        const data = await client.getAudioFeaturesForTracks(ids);
        res.json(data.body);
    } catch (err) {
        console.error('❌ Failed to fetch audio features:', err.message);
        res.status(500).json({ message: 'Failed to fetch audio features' });
    }
};

// Get recommendations
exports.recommendSongs = async (req, res) => {
    const { seed_artists, seed_genres, seed_tracks, target_danceability, target_energy } = req.body;
    try {
        console.log('🎯 Getting song recommendations...');
        const client = getSpotifyClient(req);
        const options = {};
        if (seed_artists) options.seed_artists = seed_artists;
        if (seed_genres) options.seed_genres = seed_genres;
        if (seed_tracks) options.seed_tracks = seed_tracks;
        if (target_danceability) options.target_danceability = target_danceability;
        if (target_energy) options.target_energy = target_energy;

        const data = await client.getRecommendations(options);
        console.log('✅ Retrieved', data.body.tracks?.length || 0, 'recommendations');
        res.json(data.body);
    } catch (err) {
        console.error('❌ Failed to get recommendations:', err.message);
        res.status(500).json({ message: 'Failed to get recommendations' });
    }
};

// Logout/Disconnect
exports.logout = (req, res) => {
    try {
        // Clear Spotify cookies
        res.clearCookie('spotify_access_token', { path: '/' });
        res.clearCookie('spotify_refresh_token', { path: '/' });
        console.log('✅ Spotify disconnected - tokens cleared');
        res.json({ message: 'Disconnected successfully' });
    } catch (err) {
        console.error('❌ Error disconnecting Spotify:', err);
        res.status(500).json({ message: 'Failed to disconnect' });
    }
};
