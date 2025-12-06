exports.removeDuplicates = (tracks) => {
    const seen = new Set();
    return tracks.filter(track => {
        const id = track.id; // Spotify ID
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
    });
};

exports.filterByPopularity = (tracks, minPopularity) => {
    return tracks.filter(track => track.popularity >= minPopularity);
};

exports.filterByYear = (tracks, minYear) => {
    return tracks.filter(track => {
        const releaseDate = track.album.release_date;
        const year = parseInt(releaseDate.split('-')[0]);
        return year >= minYear;
    });
};

exports.filterByAudioFeatureRange = (tracksWithFeatures, feature, min, max) => {
    // tracksWithFeatures must be objects with { track, features } or merged
    // Assuming merged objects for simplicity of this util usage explanation
    return tracksWithFeatures.filter(item => {
        const val = item[feature];
        return val >= min && val <= max;
    });
};
