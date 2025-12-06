import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({
        spotify: {
            isConnected: false,
            accessToken: null,
            refreshToken: null,
            expiresIn: null,
            user: null
        },
        youtube: {
            isConnected: false,
            accessToken: null,
            refreshToken: null,
            expiresIn: null
        }
    });

    const [error, setError] = useState(null);

    // Check for existing tokens on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            // Check for login callback in URL
            const urlParams = new URLSearchParams(window.location.search);
            const loginStatus = urlParams.get('login');
            const provider = urlParams.get('provider');
            const errorParam = urlParams.get('error');

            // Handle error from OAuth callback
            if (errorParam) {
                const errorMessages = {
                    'auth_failed': 'Authentication failed. Please try again.',
                    'spotify_denied': 'You denied access to Spotify. Please authorize the app to continue.',
                    'no_code': 'No authorization code received from Spotify.',
                    'invalid_credentials': 'Invalid Spotify credentials. Please check your client secret.',
                    'redirect_uri_mismatch': 'Redirect URI mismatch. Please check your Spotify app settings.',
                    'config_error': 'OAuth configuration error. Please check your environment variables.',
                    'google_auth_failed': 'YouTube authentication failed. Please try again.'
                };

                setError(errorMessages[errorParam] || 'An unknown error occurred');

                // Clean up URL
                const newUrl = window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
                return;
            }

            // If we just logged in successfully, update state immediately
            if (loginStatus === 'success' && provider) {
                console.log(`✅ Login success detected for ${provider}`);
                setAuth(prev => ({
                    ...prev,
                    [provider]: { ...prev[provider], isConnected: true }
                }));

                // Clean up URL parameters
                const newUrl = window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);

                // Fetch user profile to confirm
                if (provider === 'spotify') {
                    await fetchSpotifyProfile();
                }
            }

            // Always check Spotify connection status
            await fetchSpotifyProfile();

            // Always check YouTube connection status
            await fetchYouTubeStatus();

        } catch (error) {
            console.error('Auth check failed:', error);
            // Don't set as error if it's just not logged in
            if (error.response?.status !== 401) {
                setError('Failed to check authentication status');
            }
        }
    };

    const fetchSpotifyProfile = async () => {
        try {
            const spotifyRes = await axios.get(`${config.apiUrl}/api/spotify/me`, {
                withCredentials: true
            });

            if (spotifyRes.data) {
                console.log('✅ Spotify profile retrieved:', spotifyRes.data.display_name || spotifyRes.data.id);
                setAuth(prev => ({
                    ...prev,
                    spotify: {
                        ...prev.spotify,
                        isConnected: true,
                        user: spotifyRes.data
                    }
                }));
                setError(null); // Clear any previous errors
            }
        } catch (err) {
            console.log('Spotify not connected:', err.response?.status);
            setAuth(prev => ({
                ...prev,
                spotify: {
                    ...prev.spotify,
                    isConnected: false,
                    user: null
                }
            }));
        }
    };

    const fetchYouTubeStatus = async () => {
        try {
            const youtubeRes = await axios.get(`${config.apiUrl}/api/youtube/status`, {
                withCredentials: true
            });

            if (youtubeRes.data.connected) {
                console.log('✅ YouTube connected');
                setAuth(prev => ({
                    ...prev,
                    youtube: {
                        ...prev.youtube,
                        isConnected: true
                    }
                }));
            }
        } catch (err) {
            console.log('YouTube not connected:', err.response?.status);
            setAuth(prev => ({
                ...prev,
                youtube: {
                    ...prev.youtube,
                    isConnected: false
                }
            }));
        }
    };

    const login = (provider) => {
        console.log(`🔐 Initiating ${provider} login...`);
        setError(null); // Clear any previous errors
        const authUrls = {
            spotify: `${config.apiUrl}/api/auth/spotify/login`,
            youtube: `${config.apiUrl}/api/auth/google/login`
        };
        window.location.href = authUrls[provider];
    };

    const logout = async (provider) => {
        try {
            // Clear cookies/session on backend
            const endpoints = {
                spotify: `${config.apiUrl}/api/auth/spotify/logout`,
                youtube: `${config.apiUrl}/api/auth/google/disconnect`
            };

            await axios.post(endpoints[provider], {}, {
                withCredentials: true
            });

            setAuth(prev => ({
                ...prev,
                [provider]: {
                    isConnected: false,
                    accessToken: null,
                    refreshToken: null,
                    expiresIn: null,
                    user: null
                }
            }));

            console.log(`✅ ${provider} logout successful`);
        } catch (error) {
            console.error(`Logout failed for ${provider}:`, error);
            setError(`Failed to logout from ${provider}`);
        }
    };

    const refreshToken = async (provider) => {
        try {
            const response = await axios.post(
                `${config.apiUrl}/api/auth/${provider}/refresh`,
                {},
                { withCredentials: true }
            );

            setAuth(prev => ({
                ...prev,
                [provider]: {
                    ...prev[provider],
                    accessToken: response.data.accessToken,
                    expiresIn: response.data.expiresIn
                }
            }));

            return response.data.accessToken;
        } catch (error) {
            console.error('Token refresh failed:', error);
            logout(provider);
            throw error;
        }
    };

    const clearError = () => {
        setError(null);
    };

    const value = {
        auth,
        error,
        login,
        logout,
        refreshToken,
        checkAuth,
        clearError
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
