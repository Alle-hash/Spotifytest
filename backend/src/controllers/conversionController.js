const SpotifyWebApi = require('spotify-web-api-node');
const { getYoutubeClient } = require('./youtubeController');

// In-memory job tracking (in production, use Redis or a database)
const conversionJobs = new Map();

const getSpotifyClient = (req) => {
    const accessToken = req.cookies.spotify_access_token;
    if (!accessToken) throw new Error('No Spotify access token found');
    const client = new SpotifyWebApi();
    client.setAccessToken(accessToken);
    return client;
};

// Start conversion job
exports.startConversion = async (req, res) => {
    const { playlistId, fromProvider, toProvider } = req.body;

    if (!playlistId || !fromProvider || !toProvider) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    if (fromProvider === toProvider) {
        return res.status(400).json({ message: 'Source and destination must be different' });
    }

    try {
        // Create job ID
        const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Initialize job status
        conversionJobs.set(jobId, {
            id: jobId,
            status: 'starting',
            fromProvider,
            toProvider,
            playlistId,
            progress: 0,
            totalTracks: 0,
            convertedTracks: 0,
            failedTracks: 0,
            tracks: [],
            createdAt: new Date(),
            errors: []
        });

        // Start conversion asynchronously
        performConversion(jobId, req).catch(err => {
            console.error('Conversion error:', err);
            const job = conversionJobs.get(jobId);
            if (job) {
                job.status = 'failed';
                job.error = err.message;
            }
        });

        res.json({ jobId, message: 'Conversion started' });

    } catch (error) {
        console.error('Failed to start conversion:', error);
        res.status(500).json({ message: 'Failed to start conversion', error: error.message });
    }
};

// Get conversion status
exports.getConversionStatus = async (req, res) => {
    const { jobId } = req.params;

    const job = conversionJobs.get(jobId);
    if (!job) {
        return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
};

// Perform the actual conversion
async function performConversion(jobId, req) {
    const job = conversionJobs.get(jobId);
    if (!job) return;

    try {
        job.status = 'fetching';

        // Fetch source playlist
        let sourceTracks = [];
        let playlistName = '';

        if (job.fromProvider === 'spotify') {
            const spotify = getSpotifyClient(req);
            const playlistData = await spotify.getPlaylist(job.playlistId);
            playlistName = playlistData.body.name;

            // Fetch all tracks (handle pagination)
            let offset = 0;
            const limit = 100;
            let hasMore = true;

            while (hasMore) {
                const tracksData = await spotify.getPlaylistTracks(job.playlistId, { offset, limit });
                const tracks = tracksData.body.items.map(item => ({
                    name: item.track.name,
                    artist: item.track.artists[0].name,
                    album: item.track.album.name,
                    uri: item.track.uri
                }));
                sourceTracks.push(...tracks);

                offset += limit;
                hasMore = tracksData.body.next !== null;
            }
        } else if (job.fromProvider === 'youtube') {
            const youtube = await getYoutubeClient(req);
            const playlistData = await youtube.playlists.list({
                part: 'snippet',
                id: job.playlistId
            });
            playlistName = playlistData.data.items[0].snippet.title;

            // Fetch all video items
            let pageToken = null;
            do {
                const response = await youtube.playlistItems.list({
                    part: 'snippet',
                    playlistId: job.playlistId,
                    maxResults: 50,
                    pageToken
                });

                const videos = response.data.items.map(item => ({
                    name: item.snippet.title,
                    artist: item.snippet.videoOwnerChannelTitle || 'Unknown',
                    videoId: item.snippet.resourceId.videoId
                }));
                sourceTracks.push(...videos);

                pageToken = response.data.nextPageToken;
            } while (pageToken);
        }

        job.totalTracks = sourceTracks.length;
        job.tracks = sourceTracks.map(t => ({
            name: t.name,
            artist: t.artist,
            status: 'pending'
        }));
        job.status = 'converting';

        // Convert tracks
        const convertedTracks = [];
        for (let i = 0; i < sourceTracks.length; i++) {
            const track = sourceTracks[i];
            job.progress = Math.floor(((i + 1) / sourceTracks.length) * 100);

            try {
                job.tracks[i].status = 'searching';
                let matchedTrack = null;

                if (job.toProvider === 'spotify') {
                    // Search for track on Spotify
                    const spotify = getSpotifyClient(req);
                    const searchQuery = `track:${track.name} artist:${track.artist}`;
                    const searchResult = await spotify.searchTracks(searchQuery, { limit: 1 });

                    if (searchResult.body.tracks.items.length > 0) {
                        matchedTrack = searchResult.body.tracks.items[0].uri;
                    }
                } else if (job.toProvider === 'youtube') {
                    // Search for video on YouTube
                    const youtube = await getYoutubeClient(req);
                    const searchQuery = `${track.name} ${track.artist}`;
                    const searchResult = await youtube.search.list({
                        part: 'snippet',
                        q: searchQuery,
                        type: 'video',
                        maxResults: 1
                    });

                    if (searchResult.data.items.length > 0) {
                        matchedTrack = searchResult.data.items[0].id.videoId;
                    }
                }

                if (matchedTrack) {
                    convertedTracks.push(matchedTrack);
                    job.convertedTracks++;
                    job.tracks[i].status = 'added';
                } else {
                    job.failedTracks++;
                    job.tracks[i].status = 'not_found';
                    job.errors.push(`Could not find match for: ${track.name} - ${track.artist}`);
                }
            } catch (error) {
                console.error(`Error converting track ${track.name}:`, error);
                job.failedTracks++;
                job.tracks[i].status = 'failed';
                job.errors.push(`Error converting: ${track.name} - ${error.message}`);
            }

            // Update job
            conversionJobs.set(jobId, job);
        }

        // Create destination playlist
        job.status = 'creating_playlist';

        if (job.toProvider === 'spotify') {
            const spotify = getSpotifyClient(req);
            const newPlaylist = await spotify.createPlaylist(`${playlistName} (from YouTube)`, {
                description: `Converted from YouTube Music on ${new Date().toLocaleDateString()}`,
                public: false
            });

            // Add tracks in batches of 100
            for (let i = 0; i < convertedTracks.length; i += 100) {
                const batch = convertedTracks.slice(i, i + 100);
                await spotify.addTracksToPlaylist(newPlaylist.body.id, batch);
            }

            job.destinationPlaylistId = newPlaylist.body.id;
            job.newPlaylistUrl = newPlaylist.body.external_urls.spotify;
        } else if (job.toProvider === 'youtube') {
            const youtube = await getYoutubeClient(req);
            const newPlaylist = await youtube.playlists.insert({
                part: 'snippet,status',
                requestBody: {
                    snippet: {
                        title: `${playlistName} (from Spotify)`,
                        description: `Converted from Spotify on ${new Date().toLocaleDateString()}`
                    },
                    status: {
                        privacyStatus: 'private'
                    }
                }
            });

            // Add videos to playlist
            for (const videoId of convertedTracks) {
                try {
                    await youtube.playlistItems.insert({
                        part: 'snippet',
                        requestBody: {
                            snippet: {
                                playlistId: newPlaylist.data.id,
                                resourceId: {
                                    kind: 'youtube#video',
                                    videoId: videoId
                                }
                            }
                        }
                    });
                } catch (error) {
                    console.error(`Failed to add video ${videoId}:`, error);
                }
            }

            job.destinationPlaylistId = newPlaylist.data.id;
            job.newPlaylistUrl = `https://music.youtube.com/playlist?list=${newPlaylist.data.id}`;
        }

        job.status = 'completed';
        job.completedAt = new Date();
        conversionJobs.set(jobId, job);

    } catch (error) {
        console.error('Conversion failed:', error);
        job.status = 'failed';
        job.error = error.message;
        conversionJobs.set(jobId, job);
    }
}

module.exports = exports;
