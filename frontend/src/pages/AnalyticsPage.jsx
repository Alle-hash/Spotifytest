import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePlaylist } from '../context/PlaylistContext';
import { ArrowLeft, BarChart3, Loader2, Music, TrendingUp, Users, Clock, Sparkles, Calendar } from 'lucide-react';
import axios from 'axios';
import config from '../config';

const AnalyticsPage = () => {
    const navigate = useNavigate();
    const { auth } = useAuth();
    const { playlists } = usePlaylist();
    const [selectedPlaylist, setSelectedPlaylist] = useState('');
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleAnalyze = async () => {
        if (!selectedPlaylist) {
            alert('Please select a playlist');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(
                `${config.apiUrl}/api/playlist/analytics/${selectedPlaylist}`,
                { withCredentials: true }
            );
            setAnalytics(response.data);
        } catch (err) {
            console.error('Analytics fetch error:', err);
            setError(err.response?.data?.message || 'Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    if (!auth.spotify.isConnected) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <div className="text-center">
                    <BarChart3 className="mx-auto mb-4 text-gray-400" size={64} />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Spotify Required
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Please connect your Spotify account to use analytics
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
                    >
                        <ArrowLeft size={20} />
                        <span>Back to Dashboard</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <BarChart3 className="text-blue-600" size={32} />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Playlist Analytics
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Deep insights into your music collection
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Playlist Selection */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Select Playlist to Analyze
                    </h2>
                    <div className="flex gap-4">
                        <select
                            value={selectedPlaylist}
                            onChange={(e) => setSelectedPlaylist(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">Choose a playlist...</option>
                            {playlists.spotify?.map((playlist) => (
                                <option key={playlist.id} value={playlist.id}>
                                    {playlist.name}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleAnalyze}
                            disabled={!selectedPlaylist || loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    <span>Analyzing...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={20} />
                                    <span>Analyze</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                        <p className="text-red-800 dark:text-red-200">{error}</p>
                    </div>
                )}

                {analytics && (
                    <>
                        {/* Playlist Header */}
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-md p-8 mb-6 text-white text-center">
                            <h2 className="text-3xl font-bold mb-2">{analytics.analytics.personality}</h2>
                            <p className="text-lg opacity-90">
                                {analytics.playlistName} • {analytics.totalTracks} tracks • {analytics.analytics.totalMinutes} minutes
                            </p>
                        </div>

                        {/* Mood Profile */}
                        {analytics.analytics.moodProfile ? (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Music size={20} />
                                    Mood Profile
                                </h2>
                                <div className="mb-4">
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                        {analytics.analytics.moodProfile.primary}
                                    </h3>
                                    {analytics.analytics.moodProfile.traits.length > 0 && (
                                        <div className="flex gap-2 flex-wrap">
                                            {analytics.analytics.moodProfile.traits.map((trait, idx) => (
                                                <span key={idx} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                                                    {trait}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Happiness</span>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{analytics.analytics.moodProfile.scores.valence}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full" style={{ width: `${analytics.analytics.moodProfile.scores.valence}%` }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Energy</span>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{analytics.analytics.moodProfile.scores.energy}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div className="bg-gradient-to-r from-orange-400 to-red-600 h-2 rounded-full" style={{ width: `${analytics.analytics.moodProfile.scores.energy}%` }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Danceability</span>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{analytics.analytics.moodProfile.scores.danceability}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div className="bg-gradient-to-r from-blue-400 to-purple-600 h-2 rounded-full" style={{ width: `${analytics.analytics.moodProfile.scores.danceability}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
                                <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2 flex items-center gap-2">
                                    <Music size={20} />
                                    Mood Profile Unavailable
                                </h2>
                                <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                                    Audio features couldn't be fetched from Spotify. Mood analysis requires detailed audio data.
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Top Genres */}
                            {analytics.analytics.topGenres.length > 0 && (
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <TrendingUp size={20} />
                                        Top Genres
                                    </h2>
                                    <div className="space-y-2">
                                        {analytics.analytics.topGenres.map((genre, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                                                <span className="text-gray-900 dark:text-white capitalize">{genre.genre}</span>
                                                <span className="text-gray-600 dark:text-gray-400 text-sm">{genre.count} tracks</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Diversity */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Users size={20} />
                                    Diversity
                                </h2>
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{analytics.analytics.diversity.uniqueArtists}</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Artists</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{analytics.analytics.diversity.uniqueAlbums}</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Albums</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-green-600 dark:text-green-400">{analytics.analytics.diversity.varietyScore}%</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Variety</div>
                                    </div>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded text-center">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        Most Featured: <strong>{analytics.analytics.diversity.mostRepeatedArtist.name}</strong> ({analytics.analytics.diversity.mostRepeatedArtist.count} tracks)
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Temporal Analysis */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Clock size={20} />
                                Time Travel
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Average Age</div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.analytics.temporal.avgAge} years</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Oldest Track</div>
                                    <div className="text-lg font-semibold text-gray-900 dark:text-white">{analytics.analytics.temporal.oldestTrack.name}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">{analytics.analytics.temporal.oldestTrack.artist} ({analytics.analytics.temporal.oldestTrack.year})</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Newest Track</div>
                                    <div className="text-lg font-semibold text-gray-900 dark:text-white">{analytics.analytics.temporal.newestTrack.name}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">{analytics.analytics.temporal.newestTrack.artist} ({analytics.analytics.temporal.newestTrack.year})</div>
                                </div>
                            </div>
                            {Object.keys(analytics.analytics.temporal.decadeDistribution).length > 0 && (
                                <div>
                                    <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <Calendar size={18} />
                                        Decade Distribution
                                    </h3>
                                    <div className="space-y-2">
                                        {Object.entries(analytics.analytics.temporal.decadeDistribution).map(([decade, count]) => (
                                            <div key={decade} className="flex items-center gap-3">
                                                <span className="text-gray-600 dark:text-gray-400 w-16 text-sm">{decade}</span>
                                                <div className="flex-1">
                                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(count / analytics.totalTracks) * 100}%` }}></div>
                                                    </div>
                                                </div>
                                                <span className="text-gray-600 dark:text-gray-400 text-sm w-8 text-right">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sonic Clusters & Outliers */}
                        {(analytics.analytics.clusters?.length > 0 || analytics.analytics.outliers?.length > 0) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {analytics.analytics.clusters?.length > 0 && (
                                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sonic Clusters</h2>
                                        <div className="space-y-3">
                                            {analytics.analytics.clusters.map((cluster, idx) => (
                                                <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
                                                    <div className="font-semibold text-gray-900 dark:text-white mb-1">{cluster.name}</div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{cluster.count} tracks</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-500">
                                                        {cluster.examples.join(', ')}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {analytics.analytics.outliers?.length > 0 && (
                                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Outliers</h2>
                                        <div className="space-y-3">
                                            {analytics.analytics.outliers.map((outlier, idx) => (
                                                <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
                                                    <div className="font-semibold text-gray-900 dark:text-white">{outlier.name}</div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">{outlier.artist}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-500 italic mt-1">{outlier.reason}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {!analytics.analytics.hasAudioFeatures && (
                            <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                                    ⚠️ Some advanced analytics (sonic clusters, outliers, detailed tempo analysis) are unavailable because Spotify's audio features couldn't be fetched.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AnalyticsPage;
