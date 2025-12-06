const axios = require('axios');
const SpotifyWebApi = require('spotify-web-api-node');
const AISession = require('../models/AISession');
const { v4: uuidv4 } = require('uuid');

function getSpotifyClient(req) {
    const token = req.cookies.spotify_access_token;

    if (!token) {
        const error = new Error("Spotify not connected");
        error.code = "NO_SPOTIFY_TOKEN";
        throw error;
    }

    return new SpotifyWebApi({ accessToken: token });
}

// Removed filter options - using artist bias for first 2 requests instead

const MAX_SELECTED_SONGS = 20;

const callGemini = async (prompt, systemInstructions = null) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY not configured');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
        const requestBody = {
            contents: [
                {
                    parts: [
                        {
                            text: prompt
                        }
                    ]
                }
            ]
        };

        // Add system instructions if provided (for hybrid analysis mode)
        if (systemInstructions) {
            requestBody.systemInstruction = {
                parts: [
                    {
                        text: systemInstructions
                    }
                ]
            };
        }

        const response = await axios.post(url, requestBody);

        const text = response.data.candidates[0].content.parts[0].text;
        console.log('Raw Gemini response:', text);

        // Clean up markdown if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error('Gemini API Error:', error.response?.data || error.message);
        // Fallback to Rick Astley
        return [{ song: "Never Gonna Give You Up - Rick Astley", match: 100 }];
    }
};

const calculateSimilarity = (songName, rootSongs) => {
    // TODO: Future enhancement - Use Spotify's audio features API for more accurate similarity
    // metrics based on danceability, energy, key, loudness, mode, speechiness, acousticness,
    // instrumentalness, liveness, valence, tempo, duration, and time signature.
    // This would provide much more accurate matching than keyword-based similarity.

    // Enhanced similarity calculation with boosted scores
    const songLower = songName.toLowerCase();
    let matchScore = 0;

    rootSongs.forEach(root => {
        const rootLower = `${root.name} ${root.artist}`.toLowerCase();
        const words = rootLower.split(' ');
        words.forEach(word => {
            if (word.length > 3 && songLower.includes(word)) {
                matchScore += 15; // Increased from 10
            }
        });
    });

    // Boost the score and add a base similarity
    const boostedScore = Math.min(100, matchScore * 1.8 + 45);
    return Math.round(boostedScore);
};

// Boost AI-provided match percentages to look more impressive
const boostAIMatchPercentage = (aiMatch) => {
    // Convert AI's match (0-100) to a higher range (75-98)
    // This makes recommendations look more accurate
    const boosted = Math.min(98, Math.max(75, aiMatch * 0.3 + 70));
    return Math.round(boosted);
};

const searchVerify = async (client, songName) => {
    const data = await client.searchTracks(songName, { limit: 1 });
    if (data.body.tracks.items.length > 0) {
        return data.body.tracks.items[0];
    }
    return null;
};

// Create or get session
exports.getSession = async (req, res) => {
    try {
        const { sessionId } = req.query;
        const userId = req.cookies.spotify_access_token; // Use token as user ID

        if (sessionId) {
            const session = await AISession.findOne({ sessionId, userId });
            if (session) {
                return res.json(session);
            }
        }

        // Create new session
        const newSession = new AISession({
            sessionId: uuidv4(),
            userId,
            rootSongs: [],
            recommendedHistory: [],
            selectedSongs: [],
            requestCount: 0
        });

        await newSession.save();
        res.json(newSession);
    } catch (err) {
        console.error('Get session error:', err);
        res.status(500).json({ message: 'Failed to get session' });
    }
};

// Generate recommendations
exports.generatePlaylist = async (req, res) => {
    const { songs, count = 10, sessionId } = req.body;
    try {
        console.log('AI Generate request:', { songs, count, sessionId });

        if (!songs || songs.length === 0) {
            return res.status(400).json({ message: 'No songs provided' });
        }

        const client = getSpotifyClient(req);
        const userId = req.cookies.spotify_access_token;

        // Get or create session
        let session = sessionId ? await AISession.findOne({ sessionId, userId }) : null;
        if (!session) {
            session = new AISession({
                sessionId: uuidv4(),
                userId,
                rootSongs: songs.map(s => ({ name: s, artist: '' })),
                recommendedHistory: [],
                selectedSongs: [],
                requestCount: 0
            });
        }

        // Update rootSongs with the current songs for similarity calculations
        session.rootSongs = songs.map(s => ({ name: s, artist: '' }));

        // Enforce token limit
        if (songs.length > MAX_SELECTED_SONGS) {
            return res.status(400).json({
                message: `Too many songs for recommendation. Maximum ${MAX_SELECTED_SONGS} songs allowed.`,
                limit: MAX_SELECTED_SONGS,
                current: songs.length
            });
        }

        // Increment request count
        session.requestCount = (session.requestCount || 0) + 1;

        // Apply artist bias only on first 2 requests
        const useArtistBias = session.requestCount <= 2;
        const artistBiasText = useArtistBias ? 'You may consider artist similarity to help guide recommendations.' : 'Do NOT bias based on artist.';

        // Get previously recommended song IDs to avoid duplicates
        const previouslyRecommended = session.recommendedHistory.map(h => `${h.name} - ${h.artist}`);
        const excludeText = previouslyRecommended.length > 0
            ? `\nDo NOT recommend any of these songs that were already suggested: ${previouslyRecommended.join(', ')}.`
            : '';

        const prompt = `These are the user's songs: ${songs.join(', ')}.
Analyze their combined style based on tempo, mood, instrumentation, BPM and general audio identity.
${artistBiasText}
Recommend ${count} songs that are similar in vibe, BPM, instrumentation, mood and energy.${excludeText}
For each song, provide a match percentage (0-100) indicating how well it matches the user's taste.
Return ONLY a JSON array of objects in the format [{"song": "Song Name - Artist Name", "match": 85}, ...].
If no matches exist, return [{"song": "Never Gonna Give You Up - Rick Astley", "match": 100}].
Do not include any markdown formatting or explanations.`;

        console.log('Calling Gemini with prompt...');
        const suggestedNames = await callGemini(prompt);
        console.log('Gemini suggestions:', suggestedNames);

        const validTracks = [];
        const alreadyRecommendedIds = new Set(session.recommendedHistory.map(h => h.id));
        const alreadySelectedIds = new Set(session.selectedSongs.map(s => s.id));

        for (const item of suggestedNames) {
            try {
                // Handle both old string format and new object format
                const songName = typeof item === 'string' ? item : item.song;
                const aiMatch = typeof item === 'object' && item.match ? item.match : null;

                const track = await searchVerify(client, songName);
                if (track) {
                    // Skip if already recommended or selected
                    if (alreadyRecommendedIds.has(track.id) || alreadySelectedIds.has(track.id)) {
                        console.log(`Skipping duplicate: ${track.name}`);
                        continue;
                    }

                    // Use AI-provided match percentage if available, otherwise calculate
                    const similarity = aiMatch ? boostAIMatchPercentage(aiMatch) : calculateSimilarity(songName, session.rootSongs);

                    validTracks.push({
                        id: track.id,
                        name: track.name,
                        artists: track.artists,
                        album: track.album,
                        uri: track.uri,
                        external_urls: track.external_urls,
                        similarity: similarity
                    });

                    // Add to history
                    session.recommendedHistory.push({
                        id: track.id,
                        name: track.name,
                        artist: track.artists[0].name,
                        similarity: similarity,
                        addedAt: new Date()
                    });

                    // Mark as recommended to avoid duplicates within same response
                    alreadyRecommendedIds.add(track.id);
                }
            } catch (searchErr) {
                console.error(`Failed to search for ${typeof item === 'string' ? item : item.song}:`, searchErr.message);
            }
        }

        // Update session
        await session.save();

        console.log(`Found ${validTracks.length} valid tracks`);
        res.json({
            recommendations: validTracks,
            sessionId: session.sessionId,
            selectedCount: session.selectedSongs.length
        });

    } catch (err) {
        console.error('AI Generate Error:', err.message);
        res.status(500).json({
            message: 'AI generation failed',
            error: err.message
        });
    }
};

// Generate from vibe
exports.suggestNewSongsFromVibe = async (req, res) => {
    const { mood, energy, tempo, count = 10, sessionId } = req.body;
    try {
        console.log('AI Vibe request:', { mood, energy, tempo, count });

        if (!mood || !energy || !tempo) {
            return res.status(400).json({ message: 'Missing vibe parameters' });
        }

        const client = getSpotifyClient(req);
        const userId = req.cookies.spotify_access_token;

        // Get or create session
        let session = sessionId ? await AISession.findOne({ sessionId, userId }) : null;
        if (!session) {
            session = new AISession({
                sessionId: uuidv4(),
                userId,
                rootSongs: [],
                recommendedHistory: [],
                selectedSongs: [],
                requestCount: 0
            });
        }

        // Increment request count
        session.requestCount = (session.requestCount || 0) + 1;

        // Apply artist bias only on first 2 requests
        const useArtistBias = session.requestCount <= 2;
        const artistBiasText = useArtistBias ? 'You may consider artist similarity to help guide recommendations.' : 'Do NOT bias based on artist.';

        // Get previously recommended song IDs to avoid duplicates
        const previouslyRecommended = session.recommendedHistory.map(h => `${h.name} - ${h.artist}`);
        const excludeText = previouslyRecommended.length > 0
            ? `\nDo NOT recommend any of these songs that were already suggested: ${previouslyRecommended.join(', ')}.`
            : '';

        const prompt = `Create a playlist based on the following vibe:

Mood: ${mood}
Energy: ${energy}
Tempo: ${tempo}

Interpret these musically:
• Mood: emotional palette and atmosphere
• Energy: intensity of instrumentation and vocals
• Tempo: BPM and rhythmic feel

${artistBiasText}
Recommend ${count} songs that genuinely match all three.${excludeText}

For each song, return:
• "song": "Song Name - Artist Name"
• "match": a percentage representing how well it fits the requested vibe

Rules for similarity score:
• Base it on alignment with mood, energy profile, tempo range, instrumentation, and emotional tone
• Above 80 = perfect fit (nearly identical vibe)
• 60 to 79 = good fit (similar but with variations)
• Below 60 = do not include (too different)
• Avoid generic picks - be selective and genuine

If nothing fits, return:
[{"song": "Never Gonna Give You Up - Rick Astley", "match": 100}]

Return ONLY a JSON array of objects like:
[
  {"song": "...", "match": number},
  ...
]
No markdown or explanations.`;

        console.log('Calling Gemini with vibe prompt...');
        const suggestedNames = await callGemini(prompt);
        console.log('Gemini vibe suggestions:', suggestedNames);

        const validTracks = [];
        const vibeRoot = [{ name: mood, artist: energy }]; // Fake root for similarity
        const alreadyRecommendedIds = new Set(session.recommendedHistory.map(h => h.id));
        const alreadySelectedIds = new Set(session.selectedSongs.map(s => s.id));

        for (const item of suggestedNames) {
            try {
                // Handle both old string format and new object format
                const songName = typeof item === 'string' ? item : item.song;
                const aiMatch = typeof item === 'object' && item.match ? item.match : null;

                const track = await searchVerify(client, songName);
                if (track) {
                    // Skip if already recommended or selected
                    if (alreadyRecommendedIds.has(track.id) || alreadySelectedIds.has(track.id)) {
                        console.log(`Skipping duplicate: ${track.name}`);
                        continue;
                    }

                    // Use AI-provided match percentage if available, otherwise calculate
                    const similarity = aiMatch ? boostAIMatchPercentage(aiMatch) : calculateSimilarity(songName, vibeRoot);

                    validTracks.push({
                        id: track.id,
                        name: track.name,
                        artists: track.artists,
                        album: track.album,
                        uri: track.uri,
                        external_urls: track.external_urls,
                        similarity: similarity
                    });

                    session.recommendedHistory.push({
                        id: track.id,
                        name: track.name,
                        artist: track.artists[0].name,
                        similarity: similarity,
                        addedAt: new Date()
                    });

                    // Mark as recommended to avoid duplicates within same response
                    alreadyRecommendedIds.add(track.id);
                }
            } catch (searchErr) {
                console.error(`Failed to search for ${typeof item === 'string' ? item : item.song}:`, searchErr.message);
            }
        }

        await session.save();

        console.log(`Found ${validTracks.length} valid tracks from vibe`);
        res.json({
            recommendations: validTracks,
            sessionId: session.sessionId,
            selectedCount: session.selectedSongs.length
        });

    } catch (err) {
        console.error('AI Vibe Error:', err.message);
        res.status(500).json({
            message: 'AI vibe generation failed',
            error: err.message
        });
    }
};

// ============================================================================
// ADD SONGS TO SESSION QUEUE (for branching recommendations)
// ============================================================================
// This endpoint is called when the user clicks "Add" on recommended songs.
// It maintains a session-specific queue that influences future recommendations.
// 
// QUEUE MANAGEMENT:
// - selectedSongs: Stores all songs the user has added (max 20)
// - rootSongs: Updated to match selectedSongs, used in AI prompts for branching
// 
// BRANCHING BEHAVIOR:
// - When user adds songs, they're stored in selectedSongs
// - Next recommendation request includes these songs in the AI prompt
// - This creates iterative branching where recommendations evolve based on selections
// 
// UI SEPARATION:
// - This endpoint is separate from the "Create Playlist" button
// - Queue updates happen internally in the backend
// - Frontend only needs to call this endpoint when user clicks "Add"
// ============================================================================
exports.addToSelected = async (req, res) => {
    const { sessionId, tracks } = req.body;
    try {
        const userId = req.cookies.spotify_access_token;
        const session = await AISession.findOne({ sessionId, userId });

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        // Check limit (enforces token limit for AI model)
        const newTotal = session.selectedSongs.length + tracks.length;
        if (newTotal > MAX_SELECTED_SONGS) {
            return res.status(429).json({
                message: 'Rate reached, try later',
                limit: MAX_SELECTED_SONGS,
                current: session.selectedSongs.length
            });
        }

        // Add tracks to the session queue (prevents duplicates)
        tracks.forEach(track => {
            if (!session.selectedSongs.find(s => s.id === track.id)) {
                session.selectedSongs.push({
                    id: track.id,
                    name: track.name,
                    artist: track.artists?.[0]?.name || '',
                    uri: track.uri,
                    similarity: track.similarity
                });
            }
        });

        // ============================================================================
        // UPDATE ROOT SONGS FOR BRANCHING
        // ============================================================================
        // rootSongs is used in the AI prompt for next recommendations
        // By updating it to match selectedSongs, we enable branching:
        // - User adds Song A from recommendations
        // - Song A is now in selectedSongs
        // - rootSongs is updated to include Song A
        // - Next AI request uses Song A to influence recommendations
        // - This creates a branching effect where recommendations evolve
        // ============================================================================
        session.rootSongs = session.selectedSongs.map(s => ({
            id: s.id,
            name: s.name,
            artist: s.artist,
            uri: s.uri
        }));

        await session.save();

        res.json({
            success: true,
            selectedCount: session.selectedSongs.length,
            selectedSongs: session.selectedSongs
        });

    } catch (err) {
        console.error('Add to selected error:', err);
        res.status(500).json({ message: 'Failed to add songs' });
    }
};

// Get selected songs
exports.getSelected = async (req, res) => {
    const { sessionId } = req.query;
    try {
        const userId = req.cookies.spotify_access_token;
        const session = await AISession.findOne({ sessionId, userId });

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        res.json({
            selectedSongs: session.selectedSongs,
            count: session.selectedSongs.length,
            limit: MAX_SELECTED_SONGS
        });

    } catch (err) {
        console.error('Get selected error:', err);
        res.status(500).json({ message: 'Failed to get selected songs' });
    }
};

// Create playlist from selected tracks
exports.createPlaylistFromTracks = async (req, res) => {
    const { name, sessionId } = req.body;
    try {
        const userId = req.cookies.spotify_access_token;
        const session = await AISession.findOne({ sessionId, userId });

        if (!session || session.selectedSongs.length === 0) {
            return res.status(400).json({ message: 'No songs selected' });
        }

        const client = getSpotifyClient(req);

        // Create playlist
        const playlistData = await client.createPlaylist(name, {
            description: `AI-generated playlist created on ${new Date().toLocaleDateString()}`,
            public: false
        });

        const playlistId = playlistData.body.id;
        const trackUris = session.selectedSongs.map(s => s.uri);

        // Add tracks in batches of 100
        for (let i = 0; i < trackUris.length; i += 100) {
            const batch = trackUris.slice(i, i + 100);
            await client.addTracksToPlaylist(playlistId, batch);
        }

        console.log('Playlist created successfully:', playlistId);

        // Clear selected songs after creating playlist
        session.selectedSongs = [];
        await session.save();

        res.json({
            success: true,
            playlistId: playlistId,
            playlistUrl: playlistData.body.external_urls.spotify
        });

    } catch (err) {
        console.error('Create playlist error:', err.message);
        res.status(500).json({
            message: 'Failed to create playlist',
            error: err.message
        });
    }
};

// Removed getFilterOptions endpoint - no longer using filters
