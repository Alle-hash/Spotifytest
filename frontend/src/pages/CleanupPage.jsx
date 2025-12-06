import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePlaylist } from '../context/PlaylistContext';
import { ArrowLeft, Trash2, Loader2, CheckCircle, Eye } from 'lucide-react';
import axios from 'axios';
import config from '../config';

const CleanupPage = () => {
    const navigate = useNavigate();
    const { auth } = useAuth();
    const { playlists } = usePlaylist();
    const [selectedPlaylist, setSelectedPlaylist] = useState('');
    const [rules, setRules] = useState({
        removeDuplicates: false,
        minPopularity: '',
        minYear: ''
    });
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [cleaning, setCleaning] = useState(false);
    const [result, setResult] = useState(null);

    const handlePreview = async () => {
        if (!selectedPlaylist) {
            alert('Please select a playlist');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(
                `${config.apiUrl}/api/tools/preview`,
                {
                    playlistId: selectedPlaylist,
                    rules: {
                        removeDuplicates: rules.removeDuplicates,
                        minPopularity: rules.minPopularity ? parseInt(rules.minPopularity) : null,
                        minYear: rules.minYear ? parseInt(rules.minYear) : null
                    }
                },
                { withCredentials: true }
            );
            setPreview(response.data);
        } catch (error) {
            console.error('Preview failed:', error);
            alert('Failed to preview changes. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClean = async () => {
        if (!selectedPlaylist) {
            alert('Please select a playlist');
            return;
        }

        if (!confirm('This will create a new cleaned playlist. Continue?')) {
            return;
        }

        setCleaning(true);
        try {
            const response = await axios.post(
                `${config.apiUrl}/api/tools/cleanup`,
                {
                    playlistId: selectedPlaylist,
                    rules: {
                        removeDuplicates: rules.removeDuplicates,
                        minPopularity: rules.minPopularity ? parseInt(rules.minPopularity) : null,
                        minYear: rules.minYear ? parseInt(rules.minYear) : null
                    }
                },
                { withCredentials: true }
            );
            setResult(response.data);
        } catch (error) {
            console.error('Cleanup failed:', error);
            alert('Failed to clean playlist. Please try again.');
        } finally {
            setCleaning(false);
        }
    };

    if (!auth.spotify.isConnected) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <div className="text-center">
                    <Trash2 className="mx-auto mb-4 text-gray-400" size={64} />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Spotify Required
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Please connect your Spotify account to use cleanup tools
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
                        <Trash2 className="text-orange-600" size={32} />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Playlist Cleanup
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Remove duplicates and filter your playlists
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Playlist Selection */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Select Playlist
                    </h2>
                    <select
                        value={selectedPlaylist}
                        onChange={(e) => setSelectedPlaylist(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="">Choose a playlist...</option>
                        {playlists.spotify?.map((playlist) => (
                            <option key={playlist.id} value={playlist.id}>
                                {playlist.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Cleanup Rules */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Cleanup Rules
                    </h2>
                    <div className="space-y-4">
                        <label className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={rules.removeDuplicates}
                                onChange={(e) => setRules({ ...rules, removeDuplicates: e.target.checked })}
                                className="w-5 h-5 text-purple-600 rounded"
                            />
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Remove Duplicates</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Remove duplicate tracks from the playlist
                                </p>
                            </div>
                        </label>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Minimum Popularity (0-100)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={rules.minPopularity}
                                onChange={(e) => setRules({ ...rules, minPopularity: e.target.value })}
                                placeholder="Leave empty to skip"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Remove tracks below this popularity score
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Minimum Release Year
                            </label>
                            <input
                                type="number"
                                min="1900"
                                max={new Date().getFullYear()}
                                value={rules.minYear}
                                onChange={(e) => setRules({ ...rules, minYear: e.target.value })}
                                placeholder="Leave empty to skip"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Remove tracks released before this year
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={handlePreview}
                            disabled={!selectedPlaylist || loading}
                            className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    <span>Previewing...</span>
                                </>
                            ) : (
                                <>
                                    <Eye size={20} />
                                    <span>Preview Changes</span>
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleClean}
                            disabled={!selectedPlaylist || cleaning}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {cleaning ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    <span>Cleaning...</span>
                                </>
                            ) : (
                                <>
                                    <Trash2 size={20} />
                                    <span>Clean Playlist</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Preview Results */}
                {preview && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Preview Results
                        </h2>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <p className="text-2xl font-bold text-blue-600">{preview.originalCount}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Original Tracks</p>
                            </div>
                            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <p className="text-2xl font-bold text-green-600">{preview.resultCount}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">After Cleanup</p>
                            </div>
                            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <p className="text-2xl font-bold text-red-600">{preview.removedCount}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Will Be Removed</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success Result */}
                {result && (
                    <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <CheckCircle className="text-green-600" size={32} />
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Playlist Cleaned Successfully!
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    A new cleaned playlist has been created
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            View in Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CleanupPage;
