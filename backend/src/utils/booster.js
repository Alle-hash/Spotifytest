exports.findSeedTracks = (tracks, count = 5) => {
    // Sort by popularity and pick top N
    return tracks
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, count)
        .map(t => t.id);
};

exports.computeVibe = (audioFeatures) => {
    // Average energy, valence, danceability
    const total = audioFeatures.length;
    if (total === 0) return { energy: 0, valence: 0, danceability: 0 };

    const sum = audioFeatures.reduce((acc, curr) => ({
        energy: acc.energy + curr.energy,
        valence: acc.valence + curr.valence,
        danceability: acc.danceability + curr.danceability
    }), { energy: 0, valence: 0, danceability: 0 });

    return {
        energy: sum.energy / total,
        valence: sum.valence / total,
        danceability: sum.danceability / total
    };
};

// validateAIOutput would likely take a list of song names and search spotify to resolve them to IDs
// This requires API access. I'll mock it or expect a callback.
exports.validateAIOutput = async (songNames, searchFunction) => {
    const validTracks = [];
    for (const name of songNames) {
        try {
            const result = await searchFunction(name);
            if (result) validTracks.push(result);
        } catch (e) {
            console.error(`Could not validate ${name}`);
        }
    }
    return validTracks;
};
