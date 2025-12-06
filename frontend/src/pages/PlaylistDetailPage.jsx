import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlaylist } from '../context/PlaylistContext';
import TrackRow from '../components/TrackRow';
import { ArrowLeft, Loader2, Download, Music } from 'lucide-react';
import axios from 'axios';
import config from '../config';

const PlaylistDetailPage = () => {
    const { provider, id } = useParams();
    const navigate = useNavigate();
    const { getPlaylist, getPlaylistTracks } = usePlaylist();

    const [playlist, setPlaylist] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [converting, setConverting] = useState(false);

    useEffect(() => {
        loadPlaylistData();
    }, [provider, id]);

    const loadPlaylistData = async () => {
        try {
            setLoading(true);
            const playlistData = await getPlaylist(provider, id);
            const tracksData = await getPlaylistTracks(provider, id);

            setPlaylist(playlistData);
            setTracks(tracksData.items || tracksData);
        } catch (error) {
            console.error('Failed to load playlist:', error);
            alert('Failed to load playlist details');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickConvert = async () => {
        const targetProvider = provider === 'spotify' ? 'youtube' : 'spotify';

        setConverting(true);
        try {
            const response = await axios.post(`${config.apiUrl}/api/convert/start`, {
                playlistId: id,
                fromProvider: provider,
                toProvider: targetProvider
            }, { withCredentials: true });

            navigate(`/convert/${response.data.jobId}`);
        } catch (error) {
            console.error('Conversion failed:', error);
            alert('Failed to start conversion');
        } finally {
            setConverting(false);
        }
    };

    const getPlaylistInfo = () => {
        if (provider === 'spotify') {
            return {
                name: playlist?.name,
                description: playlist?.description,
                image: playlist?.images?.[0]?.url,
                trackCount: playlist?.tracks?.total || tracks.length,
                owner: playlist?.owner?.display_name
            };
        } else {
            return {
                name: playlist?.snippet?.title,
                description: playlist?.snippet?.description,
                image: playlist?.snippet?.thumbnails?.medium?.url,
                trackCount: playlist?.contentDetails?.itemCount || tracks.length,
                owner: playlist?.snippet?.channelTitle
            };
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <Loader2 className="animate-spin text-purple-600" size={48} />
            </div>
        );
    }

    const info = getPlaylistInfo();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-gradient-to-b from-purple-600 to-purple-800 text-white pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span>Back to Dashboard</span>
                    </button>

                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
                        {info.image ? (
                            <img
                                src={info.image}
                                alt={info.name}
                                className="w-48 h-48 rounded-lg shadow-2xl"
                            />
                        ) : (
                            <div className="w-48 h-48 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl">
                                <Music size={64} className="text-white/50" />
                            </div>
                        )}

                        <div className="flex-1">
                            <p className="text-sm font-semibold uppercase mb-2">Playlist</p>
                            <h1 className="text-4xl md:text-5xl font-bold mb-4">{info.name}</h1>
                            {info.description && (
                                <p className="text-white/80 mb-3 line-clamp-2">{info.description}</p>
                            )}
                            <div className="flex items-center gap-2 text-sm">
                                <span className="font-semibold">{info.owner}</span>
                                <span>•</span>
                                <span>{info.trackCount} tracks</span>
                                <span>•</span>
                                <span className="capitalize">{provider}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button
                        onClick={handleQuickConvert}
                        disabled={converting}
                        className="
                            flex items-center gap-2 px-6 py-2.5 
                            bg-gradient-to-r from-purple-600 to-pink-600 
                            text-white font-semibold rounded-lg
                            hover:from-purple-700 hover:to-pink-700
                            disabled:opacity-50 disabled:cursor-not-allowed
                            transition-all duration-200
                        "
                    >
                        {converting ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                <span>Converting...</span>
                            </>
                        ) : (
                            <>
                                <Download size={18} />
                                <span>Convert to {provider === 'spotify' ? 'YouTube' : 'Spotify'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Track List */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Tracks
                    </h2>

                    {tracks.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <Music size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No tracks in this playlist</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {tracks.map((track, index) => (
                                <TrackRow
                                    key={track.id || index}
                                    track={track}
                                    provider={provider}
                                    index={index}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlaylistDetailPage;
