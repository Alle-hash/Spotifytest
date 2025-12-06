import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePlaylist } from '../context/PlaylistContext';
import { ArrowLeft, LogOut, Trash2, Moon, Sun, Music, Youtube, CheckCircle, XCircle } from 'lucide-react';

const SettingsPage = () => {
    const navigate = useNavigate();
    const { auth, logout } = useAuth();
    const { clearCache } = usePlaylist();
    const [theme, setTheme] = useState(
        localStorage.getItem('theme') || 'light'
    );

    const handleLogout = async (provider) => {
        if (confirm(`Are you sure you want to disconnect from ${provider}?`)) {
            await logout(provider);
        }
    };

    const handleClearCache = (provider = null) => {
        if (confirm('Are you sure you want to clear cached playlists?')) {
            clearCache(provider);
            alert('Cache cleared successfully!');
        }
    };

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-2"
                    >
                        <ArrowLeft size={20} />
                        <span>Back to Dashboard</span>
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Settings
                    </h1>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Connected Accounts */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Connected Accounts
                    </h2>

                    <div className="space-y-4">
                        {/* Spotify */}
                        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Music className={auth.spotify.isConnected ? 'text-green-600' : 'text-gray-400'} size={24} />
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">Spotify</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                        {auth.spotify.isConnected ? (
                                            <>
                                                <CheckCircle size={14} className="text-green-600" />
                                                <span>Connected</span>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle size={14} className="text-red-600" />
                                                <span>Not Connected</span>
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>
                            {auth.spotify.isConnected && (
                                <button
                                    onClick={() => handleLogout('spotify')}
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <LogOut size={16} />
                                    <span>Disconnect</span>
                                </button>
                            )}
                        </div>

                        {/* YouTube */}
                        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Youtube className={auth.youtube.isConnected ? 'text-red-600' : 'text-gray-400'} size={24} />
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">YouTube Music</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                        {auth.youtube.isConnected ? (
                                            <>
                                                <CheckCircle size={14} className="text-green-600" />
                                                <span>Connected</span>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle size={14} className="text-red-600" />
                                                <span>Not Connected</span>
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>
                            {auth.youtube.isConnected && (
                                <button
                                    onClick={() => handleLogout('youtube')}
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <LogOut size={16} />
                                    <span>Disconnect</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Appearance */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Appearance
                    </h2>

                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center gap-3">
                            {theme === 'light' ? (
                                <Sun className="text-yellow-500" size={24} />
                            ) : (
                                <Moon className="text-blue-500" size={24} />
                            )}
                            <div>
                                <h3 className="font-medium text-gray-900 dark:text-white">Theme</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            Toggle
                        </button>
                    </div>
                </div>

                {/* Data Management */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Data Management
                    </h2>

                    <div className="space-y-3">
                        <button
                            onClick={() => handleClearCache('spotify')}
                            className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Trash2 className="text-gray-600 dark:text-gray-400" size={20} />
                                <div className="text-left">
                                    <h3 className="font-medium text-gray-900 dark:text-white">Clear Spotify Cache</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Remove cached Spotify playlists</p>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => handleClearCache('youtube')}
                            className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Trash2 className="text-gray-600 dark:text-gray-400" size={20} />
                                <div className="text-left">
                                    <h3 className="font-medium text-gray-900 dark:text-white">Clear YouTube Cache</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Remove cached YouTube playlists</p>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => handleClearCache()}
                            className="w-full flex items-center justify-between p-4 border-2 border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Trash2 className="text-red-600" size={20} />
                                <div className="text-left">
                                    <h3 className="font-medium text-red-600">Clear All Cache</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Remove all cached data</p>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* About */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        About
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Playlist Converter v1.0.0
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                        Convert your playlists seamlessly between Spotify and YouTube Music.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
