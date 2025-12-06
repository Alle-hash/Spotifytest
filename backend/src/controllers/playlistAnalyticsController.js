const SpotifyWebApi = require('spotify-web-api-node');

function getSpotifyClient(req) {
    const token = req.cookies.spotify_access_token;
    if (!token) {
        const error = new Error("Spotify not connected");
        error.code = "NO_SPOTIFY_TOKEN";
        throw error;
    }
    return new SpotifyWebApi({ accessToken: token });
}

// Get playlist analytics
exports.getPlaylistAnalytics = async (req, res) => {
    try {
        const { playlistId } = req.params;
        console.log('Analytics request for playlist:', playlistId);
        const client = getSpotifyClient(req);

        // Get playlist tracks
        const playlistData = await client.getPlaylist(playlistId);
        const tracks = playlistData.body.tracks.items.map(item => item.track).filter(t => t && t.id);

        if (tracks.length === 0) {
            return res.status(400).json({ message: 'Playlist is empty' });
        }

        console.log(`Analyzing ${tracks.length} tracks`);

        // Get audio features for all tracks (batch in groups of 100)
        const trackIds = tracks.map(t => t.id).filter(Boolean);
        let audioFeatures = [];

        try {
            for (let i = 0; i < trackIds.length; i += 100) {
                const batch = trackIds.slice(i, i + 100);
                const audioFeaturesData = await client.getAudioFeaturesForTracks(batch);
                if (audioFeaturesData.body && audioFeaturesData.body.audio_features) {
                    audioFeatures.push(...audioFeaturesData.body.audio_features.filter(Boolean));
                }
            }
            console.log(`Fetched audio features for ${audioFeatures.length} tracks`);
        } catch (audioErr) {
            console.error('Could not fetch audio features (this is optional):', audioErr.message);
            console.error('Full error:', JSON.stringify(audioErr, null, 2));
            console.error('Stack:', audioErr.stack);
            // Continue without audio features - we'll use defaults
        }

        // Get artist details for genre information (batch in groups of 50)
        const artistIds = [...new Set(tracks.flatMap(t => t.artists.map(a => a.id)))];
        let artists = [];

        try {
            for (let i = 0; i < artistIds.length; i += 50) {
                const batch = artistIds.slice(i, i + 50);
                const artistsData = await client.getArtists(batch);
                if (artistsData.body && artistsData.body.artists) {
                    artists.push(...artistsData.body.artists);
                }
            }
            console.log(`Fetched data for ${artists.length} artists`);
        } catch (artistErr) {
            console.error('Could not fetch artist data (this is optional):', artistErr.message);
            // Continue without artist data
        }

        // Calculate analytics
        const analytics = calculatePlaylistAnalytics(tracks, audioFeatures, artists);

        console.log('Analytics complete');

        res.json({
            playlistName: playlistData.body.name,
            playlistDescription: playlistData.body.description,
            totalTracks: tracks.length,
            analytics
        });

    } catch (err) {
        console.error('Playlist analytics error:', err);
        res.status(500).json({
            message: 'Failed to analyze playlist',
            error: err.message
        });
    }
};

function calculatePlaylistAnalytics(tracks, audioFeatures, artists) {
    // Check if we have audio features
    const hasAudioFeatures = audioFeatures && audioFeatures.length > 0;

    // Average audio features (only calculate if available)
    let avgFeatures = null;
    let moodProfile = null;

    if (hasAudioFeatures) {
        avgFeatures = {
            tempo: average(audioFeatures.map(f => f.tempo)),
            valence: average(audioFeatures.map(f => f.valence)),
            energy: average(audioFeatures.map(f => f.energy)),
            danceability: average(audioFeatures.map(f => f.danceability)),
            acousticness: average(audioFeatures.map(f => f.acousticness)),
            instrumentalness: average(audioFeatures.map(f => f.instrumentalness)),
            loudness: average(audioFeatures.map(f => f.loudness)),
            speechiness: average(audioFeatures.map(f => f.speechiness))
        };
        // Mood profile (only if we have audio features)
        moodProfile = determineMoodProfile(avgFeatures);
    }

    // Genre analysis - count per track (each track contributes its artist's genres)
    const genreCounts = {};
    tracks.forEach(track => {
        // Find the artist for this track
        const trackArtistIds = track.artists.map(a => a.id);
        const trackArtists = artists.filter(artist => trackArtistIds.includes(artist.id));

        // Add all genres from this track's artists
        trackArtists.forEach(artist => {
            artist.genres.forEach(genre => {
                genreCounts[genre] = (genreCounts[genre] || 0) + 1;
            });
        });
    });

    const topGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([genre, count]) => ({ genre, count }));

    // Temporal analysis
    const releaseDates = tracks.map(t => new Date(t.album.release_date)).filter(d => !isNaN(d));
    const avgAge = releaseDates.length > 0 ? calculateAverageAge(releaseDates) : '0';
    const oldestTrack = tracks.reduce((oldest, track) => {
        const trackDate = new Date(track.album.release_date);
        const oldestDate = new Date(oldest.album.release_date);
        return trackDate < oldestDate ? track : oldest;
    });
    const newestTrack = tracks.reduce((newest, track) => {
        const trackDate = new Date(track.album.release_date);
        const newestDate = new Date(newest.album.release_date);
        return trackDate > newestDate ? track : newest;
    });

    // Decade distribution
    const decadeDistribution = {};
    releaseDates.forEach(date => {
        const decade = Math.floor(date.getFullYear() / 10) * 10;
        decadeDistribution[`${decade}s`] = (decadeDistribution[`${decade}s`] || 0) + 1;
    });

    // Artist diversity
    const artistCounts = {};
    tracks.forEach(track => {
        const artistName = track.artists[0].name;
        artistCounts[artistName] = (artistCounts[artistName] || 0) + 1;
    });
    const uniqueArtists = Object.keys(artistCounts).length;
    const mostRepeatedArtist = Object.entries(artistCounts)
        .sort((a, b) => b[1] - a[1])[0];
    const varietyScore = (uniqueArtists / tracks.length * 100).toFixed(1);

    // Album diversity
    const uniqueAlbums = new Set(tracks.map(t => t.album.id)).size;

    // Key and BPM distribution (only if we have audio features)
    let keyAndTempo = {
        mostCommonKey: 'Unknown',
        avgTempo: '0',
        bpmRanges: {
            slow: 0,
            moderate: 0,
            fast: 0,
            veryFast: 0
        }
    };

    if (hasAudioFeatures) {
        const keyCounts = {};
        audioFeatures.forEach(f => {
            const keyName = getKeyName(f.key, f.mode);
            keyCounts[keyName] = (keyCounts[keyName] || 0) + 1;
        });
        const mostCommonKey = Object.entries(keyCounts)
            .sort((a, b) => b[1] - a[1])[0];

        const bpmRanges = {
            slow: audioFeatures.filter(f => f.tempo < 90).length,
            moderate: audioFeatures.filter(f => f.tempo >= 90 && f.tempo < 120).length,
            fast: audioFeatures.filter(f => f.tempo >= 120 && f.tempo < 150).length,
            veryFast: audioFeatures.filter(f => f.tempo >= 150).length
        };

        keyAndTempo = {
            mostCommonKey: mostCommonKey ? mostCommonKey[0] : 'Unknown',
            avgTempo: avgFeatures.tempo.toFixed(1),
            bpmRanges
        };
    }

    // Sonic clusters (only if we have audio features)
    const clusters = hasAudioFeatures ? identifySonicClusters(audioFeatures, tracks) : [];

    // Outliers (only if we have audio features)
    const outliers = hasAudioFeatures ? identifyOutliers(audioFeatures, tracks, avgFeatures) : [];

    // Playlist personality
    const personality = determinePlaylistPersonality(avgFeatures, topGenres, decadeDistribution);

    // Total duration
    const totalDurationMs = tracks.reduce((sum, track) => sum + track.duration_ms, 0);
    const totalMinutes = Math.floor(totalDurationMs / 60000);

    return {
        moodProfile,
        avgFeatures,
        topGenres,
        temporal: {
            avgAge,
            oldestTrack: {
                name: oldestTrack.name,
                artist: oldestTrack.artists[0].name,
                year: new Date(oldestTrack.album.release_date).getFullYear()
            },
            newestTrack: {
                name: newestTrack.name,
                artist: newestTrack.artists[0].name,
                year: new Date(newestTrack.album.release_date).getFullYear()
            },
            decadeDistribution
        },
        diversity: {
            uniqueArtists,
            uniqueAlbums,
            mostRepeatedArtist: {
                name: mostRepeatedArtist[0],
                count: mostRepeatedArtist[1]
            },
            varietyScore
        },
        keyAndTempo,
        clusters,
        outliers,
        personality,
        totalMinutes,
        hasAudioFeatures // Flag to indicate if full analytics are available
    };
}

function average(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function calculateAverageAge(dates) {
    const now = new Date();
    const ages = dates.map(d => (now - d) / (1000 * 60 * 60 * 24 * 365));
    return average(ages).toFixed(1);
}

function getKeyName(key, mode) {
    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const keyName = keys[key] || 'Unknown';
    return `${keyName} ${mode === 1 ? 'Major' : 'Minor'}`;
}

function determineMoodProfile(features) {
    const { valence, energy, danceability, acousticness, instrumentalness } = features;

    let mood = '';

    if (valence > 0.6 && energy > 0.6) {
        mood = 'Upbeat & Energetic';
    } else if (valence > 0.6 && energy < 0.4) {
        mood = 'Happy & Chill';
    } else if (valence < 0.4 && energy > 0.6) {
        mood = 'Intense & Dark';
    } else if (valence < 0.4 && energy < 0.4) {
        mood = 'Melancholic & Calm';
    } else {
        mood = 'Balanced & Versatile';
    }

    const traits = [];
    if (danceability > 0.7) traits.push('highly danceable');
    if (acousticness > 0.6) traits.push('acoustic-focused');
    if (instrumentalness > 0.5) traits.push('instrumental-heavy');

    return {
        primary: mood,
        traits,
        scores: {
            valence: (valence * 100).toFixed(0),
            energy: (energy * 100).toFixed(0),
            danceability: (danceability * 100).toFixed(0)
        }
    };
}

function identifySonicClusters(audioFeatures, tracks) {
    // Simple clustering by tempo ranges
    const clusters = {
        slowAndMellow: [],
        moderateAndBalanced: [],
        fastAndEnergetic: []
    };

    audioFeatures.forEach((features, idx) => {
        const track = tracks[idx];
        if (features.tempo < 100 && features.energy < 0.5) {
            clusters.slowAndMellow.push(track.name);
        } else if (features.tempo >= 100 && features.tempo < 130) {
            clusters.moderateAndBalanced.push(track.name);
        } else if (features.tempo >= 130 && features.energy > 0.6) {
            clusters.fastAndEnergetic.push(track.name);
        }
    });

    return Object.entries(clusters)
        .filter(([_, tracks]) => tracks.length > 0)
        .map(([name, trackList]) => ({
            name: name.replace(/([A-Z])/g, ' $1').trim(),
            count: trackList.length,
            examples: trackList.slice(0, 3)
        }));
}

function identifyOutliers(audioFeatures, tracks, avgFeatures) {
    const outliers = [];

    audioFeatures.forEach((features, idx) => {
        const track = tracks[idx];
        const deviations = {
            tempo: Math.abs(features.tempo - avgFeatures.tempo) / avgFeatures.tempo,
            energy: Math.abs(features.energy - avgFeatures.energy),
            valence: Math.abs(features.valence - avgFeatures.valence)
        };

        // If any feature deviates significantly
        if (deviations.tempo > 0.5 || deviations.energy > 0.4 || deviations.valence > 0.4) {
            outliers.push({
                name: track.name,
                artist: track.artists[0].name,
                reason: determineOutlierReason(features, avgFeatures)
            });
        }
    });

    return outliers.slice(0, 5); // Top 5 outliers
}

function determineOutlierReason(features, avgFeatures) {
    const reasons = [];

    if (features.tempo > avgFeatures.tempo * 1.5) reasons.push('much faster tempo');
    if (features.tempo < avgFeatures.tempo * 0.5) reasons.push('much slower tempo');
    if (features.energy > avgFeatures.energy + 0.3) reasons.push('higher energy');
    if (features.energy < avgFeatures.energy - 0.3) reasons.push('lower energy');
    if (features.valence > avgFeatures.valence + 0.3) reasons.push('more positive mood');
    if (features.valence < avgFeatures.valence - 0.3) reasons.push('more melancholic');

    return reasons.join(', ') || 'different vibe';
}

function determinePlaylistPersonality(features, topGenres, decades) {
    let personality = '';

    // If we have audio features, use them
    if (features) {
        const { valence, energy, danceability, acousticness } = features;

        // Determine base personality
        if (energy > 0.7 && danceability > 0.7) {
            personality = '🎉 Party Starter';
        } else if (valence < 0.3 && energy < 0.4) {
            personality = '🌧️ Rainy Day Companion';
        } else if (acousticness > 0.6 && energy < 0.5) {
            personality = '🎸 Acoustic Coffeehouse';
        } else if (energy > 0.7 && valence > 0.6) {
            personality = '⚡ High Energy Motivator';
        } else if (valence > 0.6 && danceability > 0.6) {
            personality = '😊 Feel-Good Vibes';
        } else {
            personality = '🎵 Versatile Mix';
        }
    } else {
        // Fallback to genre-based personality when audio features unavailable
        if (topGenres.length > 0) {
            const topGenre = topGenres[0].genre.toLowerCase();
            if (topGenre.includes('rock') || topGenre.includes('metal')) {
                personality = '🎸 Rock Collection';
            } else if (topGenre.includes('pop')) {
                personality = '🎤 Pop Hits';
            } else if (topGenre.includes('hip hop') || topGenre.includes('rap')) {
                personality = '🎤 Hip Hop Vibes';
            } else if (topGenre.includes('jazz') || topGenre.includes('blues')) {
                personality = '🎷 Jazz & Blues';
            } else if (topGenre.includes('classical')) {
                personality = '🎻 Classical Collection';
            } else if (topGenre.includes('electronic') || topGenre.includes('edm')) {
                personality = '🎧 Electronic Beats';
            } else {
                personality = '🎵 Eclectic Mix';
            }
        } else {
            personality = '🎵 Music Collection';
        }
    }

    // Add temporal context
    const mostCommonDecade = Object.entries(decades)
        .sort((a, b) => b[1] - a[1])[0];
    if (mostCommonDecade && mostCommonDecade[1] > Object.values(decades).reduce((a, b) => a + b, 0) * 0.5) {
        personality += ` with ${mostCommonDecade[0]} nostalgia`;
    }

    return personality;
}

module.exports = exports;
