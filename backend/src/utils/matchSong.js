const cleanString = (str) => {
    // Remove text in brackets/parentheses and trim
    return str.replace(/[\(\[\{].*?[\)\]\}]/g, '').toLowerCase().trim();
};

const calculateLevenshteinDistance = (a, b) => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
                );
            }
        }
    }
    return matrix[b.length][a.length];
};

const matchSong = (spotifyTrack, youtubeResults) => {
    let bestMatch = null;
    let highestScore = -1;

    const sTitle = spotifyTrack.name;
    const sArtist = spotifyTrack.artists[0].name;
    const sDuration = spotifyTrack.duration_ms;

    for (const video of youtubeResults) {
        let score = 0;
        const vTitle = video.snippet.title;
        const vChannel = video.snippet.channelTitle;
        // Duration logic requires detailed video info, often not in search results without extra call
        // We will skip strict duration check for simplicity unless provided

        const sTitleClean = cleanString(sTitle);
        const vTitleClean = cleanString(vTitle);
        const sArtistClean = cleanString(sArtist);

        // title match
        if (vTitleClean.includes(sTitleClean)) score += 40;

        // artist match in title or channel
        if (vTitleClean.includes(sArtistClean) || vChannel.toLowerCase().includes(sArtistClean)) score += 30;

        // Levenshtein for fuzzy match
        const dist = calculateLevenshteinDistance(sTitleClean, vTitleClean);
        const maxLen = Math.max(sTitleClean.length, vTitleClean.length);
        const similarity = 1 - (dist / maxLen);
        if (similarity > 0.8) score += 20;

        // Topic channel boost
        if (vChannel.includes('- Topic')) score += 10;

        if (score > highestScore) {
            highestScore = score;
            bestMatch = video;
        }
    }

    return {
        matched: highestScore > 50, // Threshold
        video: bestMatch,
        score: highestScore
    };
};

module.exports = matchSong;
