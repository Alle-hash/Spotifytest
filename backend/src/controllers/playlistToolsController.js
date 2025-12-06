const SpotifyWebApi = require('spotify-web-api-node');
const cleanup = require('../utils/cleanup');

const getSpotifyClient = (req) => {
    const accessToken = req.cookies.spotify_access_token;
    if (!accessToken) throw new Error('No access token found');
    const client = new SpotifyWebApi();
    client.setAccessToken(accessToken);
    return client;
};

// Helper to fetch all tracks (handles pagination if needed, but simplified here)
const fetchAllTracks = async (client, playlistId) => {
    const data = await client.getPlaylistTracks(playlistId);
    // simplified: just taking first page or what's returned. 
    // In production, would loop through 'next'.
    return data.body.items.map(i => i.track);
};

exports.analyzePlaylist = async (req, res) => {
    const { playlistId } = req.query;
    try {
        console.log('Analytics request for playlist:', playlistId);

        if (!playlistId) {
            return res.status(400).json({ message: 'Playlist ID is required' });
        }

        const client = getSpotifyClient(req);
        const tracks = await fetchAllTracks(client, playlistId);
        console.log(`Analyzing ${tracks.length} tracks`);

        // Artist Distribution
        const artistDist = {};
        tracks.forEach(t => {
            const artist = t.artists[0].name;
            artistDist[artist] = (artistDist[artist] || 0) + 1;
        });

        // Popularity Curve (just raw values for now)
        const popularity = tracks.map(t => t.popularity);

        // Release Year Trends
        const years = {};
        tracks.forEach(t => {
            const year = t.album.release_date.split('-')[0];
            years[year] = (years[year] || 0) + 1;
        });

        // Try to get audio features, but don't fail if we can't
        let tempoDist = {};
        try {
            const trackIds = tracks.map(t => t.id).filter(id => id); // Filter out null/undefined
            if (trackIds.length > 0) {
                const featuresData = await client.getAudioFeaturesForTracks(trackIds.slice(0, 100)); // limit 100
                const features = featuresData.body.audio_features;

                // Tempo Histogram (buckets of 10)
                features.forEach(f => {
                    if (f && f.tempo) {
                        const bucket = Math.floor(f.tempo / 10) * 10;
                        tempoDist[bucket] = (tempoDist[bucket] || 0) + 1;
                    }
                });
            }
        } catch (audioErr) {
            console.log('Could not fetch audio features (this is optional):', audioErr.message);
            // Continue without audio features
        }

        console.log('Analytics complete');
        res.json({
            artistDistribution: artistDist,
            popularityCurve: popularity,
            releaseYearTrends: years,
            tempoDistribution: tempoDist,
            totalTracks: tracks.length
        });

    } catch (err) {
        console.error('Analytics Error:', err.message);
        console.error('Full error:', err);
        res.status(500).json({
            message: 'Analysis failed',
            error: err.message
        });
    }
};

exports.cleanPlaylist = async (req, res) => {
    const { playlistId, rules } = req.body;
    // rules: { removeDuplicates, minPopularity, minYear }

    try {
        const client = getSpotifyClient(req);
        const tracks = await fetchAllTracks(client, playlistId);

        let cleaned = tracks;

        if (rules.removeDuplicates) {
            cleaned = cleanup.removeDuplicates(cleaned);
        }
        if (rules.minPopularity) {
            cleaned = cleanup.filterByPopularity(cleaned, rules.minPopularity);
        }
        if (rules.minYear) {
            cleaned = cleanup.filterByYear(cleaned, rules.minYear);
        }

        // Apply changes: Create new playlist or replace tracks?
        // "cleanPlaylist" usually implies modifying or creating new.
        // Safest is creating a new one 'Cleaned - [Name]'

        const currentUser = await client.getMe();
        const userId = currentUser.body.id;

        const newPlaylist = await client.createPlaylist('Cleaned Playlist', {
            description: 'Cleaned by Spotify App'
        });

        const uris = cleaned.map(t => t.uri);
        // Add in batches of 100
        for (let i = 0; i < uris.length; i += 100) {
            await client.addTracksToPlaylist(newPlaylist.body.id, uris.slice(i, i + 100));
        }

        res.json({ message: 'Playlist cleaned', newPlaylistId: newPlaylist.body.id });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Cleanup failed' });
    }
};

exports.previewChanges = async (req, res) => {
    const { playlistId, rules } = req.body;
    try {
        const client = getSpotifyClient(req);
        const tracks = await fetchAllTracks(client, playlistId);

        let kepTracks = tracks;
        // Logic same as clean but just return stats
        if (rules.removeDuplicates) kepTracks = cleanup.removeDuplicates(kepTracks);
        if (rules.minPopularity) kepTracks = cleanup.filterByPopularity(kepTracks, rules.minPopularity);
        if (rules.minYear) kepTracks = cleanup.filterByYear(kepTracks, rules.minYear);

        const removedCount = tracks.length - kepTracks.length;

        res.json({
            originalCount: tracks.length,
            resultCount: kepTracks.length,
            removedCount: removedCount
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Preview failed' });
    }
};
