import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Sparkles, Music, Loader2, Plus, X, Check, RefreshCw, List } from 'lucide-react';
import axios from 'axios';
import config from '../config';

const AIGeneratorPage = () => {
    const navigate = useNavigate();
    const { auth } = useAuth();
    const [mode, setMode] = useState('songs');
    const [seedSongs, setSeedSongs] = useState(['']);
    const [songCount, setSongCount] = useState(10);
    const [vibe, setVibe] = useState({ mood: '', energy: '', tempo: '' });
    const [recommendations, setRecommendations] = useState([]);
    const [selectedTracks, setSelectedTracks] = useState([]);
    const [sessionId, setSessionId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [showSelected, setShowSelected] = useState(false);

    useEffect(() => {
        if (auth.spotify.isConnected) {
            createSession();
        }
    }, [auth]);



    const createSession = async () => {
        try {
            const response = await axios.get(`${config.apiUrl}/api/ai/session`, {
                withCredentials: true
            });
            setSessionId(response.data.sessionId);
            setSelectedTracks(response.data.selectedSongs || []);
        } catch (error) {
            console.error('Failed to create session:', error);
        }
    };

    const addSeedSong = () => {
        setSeedSongs([...seedSongs, '']);
    };

    const removeSeedSong = (index) => {
        setSeedSongs(seedSongs.filter((_, i) => i !== index));
    };

    const updateSeedSong = (index, value) => {
        const newSongs = [...seedSongs];
        newSongs[index] = value;
        setSeedSongs(newSongs);
    };

    const handleAddToSelected = async (track) => {
        if (selectedTracks.length >= 20) {
            alert('Rate reached, try later. Maximum 20 songs allowed.');
            return;
        }

        try {
            const response = await axios.post(
                `${config.apiUrl}/api/ai/add-selected`,
                { sessionId, tracks: [track] },
                { withCredentials: true }
            );

            setSelectedTracks(response.data.selectedSongs);
        } catch (error) {
            if (error.response?.status === 429) {
                alert('Rate reached, try later');
            } else {
                console.error('Failed to add track:', error);
            }
        }
    };

    const handleGenerateFromSongs = async () => {
        const validSongs = seedSongs.filter(s => s.trim());
        if (validSongs.length === 0) {
            alert('Please add at least one song');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(
                `${config.apiUrl}/api/ai/generate`,
                {
                    songs: validSongs,
                    count: songCount,
                    sessionId
                },
                { withCredentials: true }
            );
            setRecommendations(response.data.recommendations);
            setSessionId(response.data.sessionId);
        } catch (error) {
            console.error('AI generation failed:', error);
            alert(error.response?.data?.message || 'Failed to generate recommendations');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateFromVibe = async () => {
        if (!vibe.mood || !vibe.energy || !vibe.tempo) {
            alert('Please fill in all vibe fields');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(
                `${config.apiUrl}/api/ai/vibe`,
                {
                    ...vibe,
                    count: songCount,
                    sessionId
                },
                { withCredentials: true }
            );
            setRecommendations(response.data.recommendations);
            setSessionId(response.data.sessionId);
        } catch (error) {
            console.error('AI vibe generation failed:', error);
            alert(error.response?.data?.message || 'Failed to generate recommendations');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateNext = async () => {
        if (selectedTracks.length === 0) {
            alert('Please add at least one track to generate next batch');
            return;
        }

        setLoading(true);
        try {
            // Combine original seed songs with selected tracks
            const validSeedSongs = seedSongs.filter(s => s.trim());
            const selectedSongNames = selectedTracks.map(t => `${t.name} - ${t.artist}`);
            const combinedSongs = [...validSeedSongs, ...selectedSongNames];

            console.log('Generating next batch with combined songs:', combinedSongs);

            const response = await axios.post(
                `${config.apiUrl}/api/ai/generate`,
                {
                    songs: combinedSongs,
                    count: songCount,
                    sessionId
                },
                { withCredentials: true }
            );
            setRecommendations(response.data.recommendations);
        } catch (error) {
            console.error('Next generation failed:', error);
            alert(error.response?.data?.message || 'Failed to generate next batch');
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePlaylist = async () => {
        if (selectedTracks.length === 0) {
            alert('Please add at least one track to the playlist');
            return;
        }

        const playlistName = prompt('Enter playlist name:');
        if (!playlistName) return;

        setCreating(true);
        try {
            const response = await axios.post(
                `${config.apiUrl}/api/ai/create-playlist`,
                { name: playlistName, sessionId },
                { withCredentials: true }
            );

            alert(`Playlist "${playlistName}" created successfully!`);
            window.open(response.data.playlistUrl, '_blank');
            setSelectedTracks([]);
            setRecommendations([]);
        } catch (error) {
            console.error('Create playlist failed:', error);
            alert('Failed to create playlist. Please try again.');
        } finally {
            setCreating(false);
        }
    };

    if (!auth.spotify.isConnected) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <div className="text-center">
                    <Music className="mx-auto mb-4 text-gray-400" size={64} />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Spotify Required
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Please connect your Spotify account to use AI features
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
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Sparkles className="text-purple-600" size={32} />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    AI Playlist Generator
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Advanced vibe-based recommendations
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowSelected(!showSelected)}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                            <List size={20} />
                            <span>Selected ({selectedTracks.length}/20)</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Selected Songs Panel */}
                {showSelected && selectedTracks.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Selected Songs ({selectedTracks.length}/20)
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleGenerateNext}
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    <RefreshCw size={18} />
                                    <span>Generate Next Batch</span>
                                </button>
                                <button
                                    onClick={handleCreatePlaylist}
                                    disabled={creating}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Music size={18} />
                                    <span>Create Playlist</span>
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {selectedTracks.map((track, index) => (
                                <div key={track.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-500 dark:text-gray-400">{index + 1}</span>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{track.name}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{track.artist}</p>
                                        </div>
                                    </div>
                                    {track.similarity && (
                                        <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                                            {track.similarity}% match
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Mode Selection */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Generation Mode
                    </h2>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <button
                            onClick={() => setMode('songs')}
                            className={`p-4 rounded-lg border-2 transition-all ${mode === 'songs'
                                ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                                : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
                                }`}
                        >
                            <Music className={mode === 'songs' ? 'text-purple-600' : 'text-gray-400'} size={24} />
                            <h3 className="font-semibold text-gray-900 dark:text-white mt-2">From Songs</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Vibe-based analysis
                            </p>
                        </button>
                        <button
                            onClick={() => setMode('vibe')}
                            className={`p-4 rounded-lg border-2 transition-all ${mode === 'vibe'
                                ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                                : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
                                }`}
                        >
                            <Sparkles className={mode === 'vibe' ? 'text-purple-600' : 'text-gray-400'} size={24} />
                            <h3 className="font-semibold text-gray-900 dark:text-white mt-2">From Vibe</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Mood and energy
                            </p>
                        </button>
                    </div>



                    {/* Song Count Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Number of songs: {songCount}
                        </label>
                        <input
                            type="range"
                            min="5"
                            max="50"
                            value={songCount}
                            onChange={(e) => setSongCount(parseInt(e.target.value))}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span>5</span>
                            <span>50</span>
                        </div>
                    </div>
                </div>

                {/* Input Form */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                    {mode === 'songs' ? (
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Seed Songs
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                AI will analyze combined vibe: tempo, mood, BPM, instrumentation. Artist bias applied on first 2 requests.
                            </p>
                            <div className="space-y-3">
                                {seedSongs.map((song, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={song}
                                            onChange={(e) => updateSeedSong(index, e.target.value)}
                                            placeholder="Song Name - Artist"
                                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                        {seedSongs.length > 1 && (
                                            <button
                                                onClick={() => removeSeedSong(index)}
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                            >
                                                <X size={20} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={addSeedSong}
                                className="mt-3 flex items-center gap-2 text-purple-600 hover:text-purple-700"
                            >
                                <Plus size={20} />
                                <span>Add Another Song</span>
                            </button>
                            <button
                                onClick={handleGenerateFromSongs}
                                disabled={loading}
                                className="mt-6 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>Analyzing vibe...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={20} />
                                        <span>Generate {songCount} Songs</span>
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Describe Your Vibe
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Mood
                                    </label>
                                    <input
                                        type="text"
                                        value={vibe.mood}
                                        onChange={(e) => setVibe({ ...vibe, mood: e.target.value })}
                                        placeholder="e.g., Happy, Melancholic, Energetic"
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Energy Level
                                    </label>
                                    <select
                                        value={vibe.energy}
                                        onChange={(e) => setVibe({ ...vibe, energy: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="">Select energy level</option>
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Tempo
                                    </label>
                                    <select
                                        value={vibe.tempo}
                                        onChange={(e) => setVibe({ ...vibe, tempo: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="">Select tempo</option>
                                        <option value="Slow">Slow</option>
                                        <option value="Moderate">Moderate</option>
                                        <option value="Fast">Fast</option>
                                    </select>
                                </div>
                            </div>
                            <button
                                onClick={handleGenerateFromVibe}
                                disabled={loading}
                                className="mt-6 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={20} />
                                        <span>Generate {songCount} Songs</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Recommendations with Spotify Embeds */}
                {recommendations.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            AI Recommendations ({recommendations.length} tracks)
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Add up to 20 songs to generate next batch based on your selections.
                        </p>
                        <div className="space-y-4">
                            {recommendations.map((track) => {
                                const isSelected = selectedTracks.find(t => t.id === track.id);
                                return (
                                    <div
                                        key={track.id}
                                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                                    >
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-900 dark:text-white">
                                                    {track.name}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {track.artists?.map(a => a.name).join(', ')}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                                                    {track.similarity}% match
                                                </span>
                                                <button
                                                    onClick={() => handleAddToSelected(track)}
                                                    disabled={isSelected || selectedTracks.length >= 20}
                                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${isSelected
                                                        ? 'bg-green-600 text-white cursor-not-allowed'
                                                        : selectedTracks.length >= 20
                                                            ? 'bg-gray-400 text-white cursor-not-allowed'
                                                            : 'bg-purple-600 text-white hover:bg-purple-700'
                                                        }`}
                                                >
                                                    {isSelected ? (
                                                        <span className="flex items-center gap-2">
                                                            <Check size={18} />
                                                            Added
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-2">
                                                            <Plus size={18} />
                                                            Add
                                                        </span>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                        <iframe
                                            style={{ borderRadius: '12px' }}
                                            src={`https://open.spotify.com/embed/track/${track.id}?utm_source=generator`}
                                            width="100%"
                                            height="152"
                                            frameBorder="0"
                                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                            loading="lazy"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIGeneratorPage;
