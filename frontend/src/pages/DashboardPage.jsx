import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePlaylist } from '../context/PlaylistContext';
import { useNavigate } from 'react-router-dom';
import PlaylistCard from '../components/PlaylistCard';
import { Music, Youtube, RefreshCw, Settings, Moon, Sun, Sparkles, BarChart3, Trash2, ArrowRight, Loader2 } from 'lucide-react';

const DashboardPage = () => {
    const { auth, login } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { playlists, loading, fetchPlaylists } = usePlaylist();
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch playlists for connected platforms
        if (auth.spotify.isConnected) {
            fetchPlaylists('spotify');
        }
        if (auth.youtube.isConnected) {
            fetchPlaylists('youtube');
        }
    }, [auth]);

    // Combine all playlists
    const allPlaylists = [
        ...(playlists.spotify || []).map(p => ({ ...p, provider: 'spotify' })),
        ...(playlists.youtube || []).map(p => ({ ...p, provider: 'youtube' }))
    ];

    const features = [
        {
            id: 'converter',
            title: 'Playlist Converter',
            description: 'Convert playlists between Spotify and YouTube Music seamlessly',
            icon: ArrowRight,
            color: 'from-purple-600 to-pink-600',
            iconColor: 'text-purple-600',
            path: '/dashboard',
            action: () => {
                document.getElementById('conversion-section')?.scrollIntoView({ behavior: 'smooth' });
            }
        },
        {
            id: 'ai-generator',
            title: 'AI Playlist Generator',
            description: 'Create personalized playlists using AI based on your taste or vibe',
            icon: Sparkles,
            color: 'from-purple-600 to-indigo-600',
            iconColor: 'text-purple-600',
            path: '/ai-generator'
        },
        {
            id: 'analytics',
            title: 'Playlist Analytics',
            description: 'Get deep insights into your playlists with detailed statistics',
            icon: BarChart3,
            color: 'from-blue-600 to-cyan-600',
            iconColor: 'text-blue-600',
            path: '/analytics'
        },
        {
            id: 'cleanup',
            title: 'Playlist Cleanup',
            description: 'Remove duplicates and optimize your playlists automatically',
            icon: Trash2,
            color: 'from-orange-600 to-red-600',
            iconColor: 'text-orange-600',
            path: '/cleanup'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Dashboard
                        </h1>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                aria-label="Toggle theme"
                            >
                                {theme === 'dark' ? (
                                    <Sun className="text-yellow-500" size={24} />
                                ) : (
                                    <Moon className="text-gray-600" size={24} />
                                )}
                            </button>
                            <button
                                onClick={() => navigate('/settings')}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Settings className="text-gray-600 dark:text-gray-400" size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Connection Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div
                        onClick={() => !auth.spotify.isConnected && login('spotify')}
                        className={`p-4 rounded-lg border-2 ${auth.spotify.isConnected
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                : 'border-gray-300 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <Music className={auth.spotify.isConnected ? 'text-green-600' : 'text-gray-400'} size={24} />
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Spotify</h3>
                                <p className={`text-sm ${auth.spotify.isConnected ? 'text-green-600' : 'text-gray-500'}`}>
                                    {auth.spotify.isConnected ? 'Connected' : 'Not Connected - Click to Connect'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div
                        onClick={() => !auth.youtube.isConnected && login('youtube')}
                        className={`p-4 rounded-lg border-2 ${auth.youtube.isConnected
                                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                : 'border-gray-300 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <Youtube className={auth.youtube.isConnected ? 'text-red-600' : 'text-gray-400'} size={24} />
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">YouTube Music</h3>
                                <p className={`text-sm ${auth.youtube.isConnected ? 'text-red-600' : 'text-gray-500'}`}>
                                    {auth.youtube.isConnected ? 'Connected' : 'Not Connected - Click to Connect'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Features
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {features.map((feature) => {
                            const Icon = feature.icon;
                            return (
                                <button
                                    key={feature.id}
                                    onClick={() => feature.action ? feature.action() : navigate(feature.path)}
                                    className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 text-left overflow-hidden"
                                >
                                    {/* Gradient background on hover */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                                    <div className="relative">
                                        <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${feature.color} mb-4`}>
                                            <Icon className="text-white" size={24} />
                                        </div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                            {feature.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                            {feature.description}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Playlists Section */}
                <div id="conversion-section" className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Your Playlists
                        </h2>
                        <button
                            onClick={() => {
                                if (auth.spotify.isConnected) fetchPlaylists('spotify');
                                if (auth.youtube.isConnected) fetchPlaylists('youtube');
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            <RefreshCw size={16} />
                            <span>Refresh</span>
                        </button>
                    </div>

                    {loading.spotify || loading.youtube ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="animate-spin text-gray-400" size={32} />
                        </div>
                    ) : allPlaylists.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                            <Music className="mx-auto mb-4 text-gray-400" size={48} />
                            <p className="text-gray-600 dark:text-gray-400">
                                No playlists found. Connect your accounts to see playlists.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {allPlaylists.map((playlist) => (
                                <PlaylistCard
                                    key={`${playlist.provider}-${playlist.id}`}
                                    playlist={playlist}
                                    provider={playlist.provider}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
