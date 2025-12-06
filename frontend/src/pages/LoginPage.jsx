import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import OAuthButton from '../components/OAuthButton';
import { Music, Youtube, ArrowRight, AlertCircle, X } from 'lucide-react';

const LoginPage = () => {
    const { auth, error, clearError } = useAuth();
    const navigate = useNavigate();

    // Redirect to dashboard if already connected
    React.useEffect(() => {
        if (auth.spotify.isConnected || auth.youtube.isConnected) {
            navigate('/dashboard');
        }
    }, [auth, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center items-center gap-3 mb-4">
                        <Music className="text-white" size={48} />
                        <ArrowRight className="text-white animate-pulse" size={32} />
                        <Youtube className="text-white" size={48} />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2">
                        Playlist Converter
                    </h1>
                    <p className="text-white/90 text-lg">
                        Convert playlists between Spotify and YouTube Music
                    </p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
                        <div className="flex-1">
                            <p className="text-red-800 dark:text-red-200 text-sm font-medium">
                                {error}
                            </p>
                        </div>
                        <button
                            onClick={clearError}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}

                {/* Login Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
                        Connect Your Accounts
                    </h2>

                    <div className="flex flex-col items-center space-y-4">
                        <OAuthButton provider="spotify" />
                        <OAuthButton provider="youtube" />
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            💡 <strong>Tip:</strong> Connect at least one platform to start converting your playlists!
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center text-white/80 text-sm">
                    <p>Secure OAuth authentication • Your data stays private</p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
