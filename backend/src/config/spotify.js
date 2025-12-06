const SpotifyWebApi = require('spotify-web-api-node');

// Log configuration on startup (without exposing secret)
console.log('Spotify OAuth Configuration:');
console.log('- Client ID:', process.env.SPOTIFY_CLIENT_ID || 'NOT SET');
console.log('- Client Secret:', process.env.SPOTIFY_CLIENT_SECRET ? '***SET***' : 'NOT SET');
console.log('- Redirect URI:', process.env.SPOTIFY_REDIRECT_URI || 'NOT SET');

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

const generateLoginUrl = () => {
    const scopes = [
        'user-read-private',
        'user-read-email',
        'playlist-read-private',
        'playlist-read-collaborative',
        'playlist-modify-public',
        'playlist-modify-private',
        'user-top-read',
        'user-library-read'
    ];

    const authorizeURL = spotifyApi.createAuthorizeURL(scopes);
    console.log('Generated Spotify login URL');
    return authorizeURL;
};

module.exports = {
    spotifyApi,
    generateLoginUrl
};
