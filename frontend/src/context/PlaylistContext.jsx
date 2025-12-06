import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';
import config from '../config';

const PlaylistContext = createContext();

export const usePlaylist = () => {
    const context = useContext(PlaylistContext);
    if (!context) {
        throw new Error('usePlaylist must be used within PlaylistProvider');
    }
    return context;
};

export const PlaylistProvider = ({ children }) => {
    const [playlists, setPlaylists] = useState({
        spotify: [],
        youtube: []
    });

    const [loading, setLoading] = useState({
        spotify: false,
        youtube: false
    });

    const fetchPlaylists = async (provider) => {
        setLoading(prev => ({ ...prev, [provider]: true }));
        try {
            const endpoint = provider === 'spotify'
                ? `${config.apiUrl}/api/spotify/playlists`
                : `${config.apiUrl}/api/youtube/playlists`;

            const response = await axios.get(endpoint, { withCredentials: true });

            setPlaylists(prev => ({
                ...prev,
                [provider]: response.data.items || response.data
            }));

            return response.data.items || response.data;
        } catch (error) {
            console.error(`Failed to fetch ${provider} playlists:`, error);
            throw error;
        } finally {
            setLoading(prev => ({ ...prev, [provider]: false }));
        }
    };

    const getPlaylist = async (provider, id) => {
        try {
            // Check if playlist is in cache
            const cached = playlists[provider]?.find(p => p.id === id);
            if (cached) return cached;

            // Otherwise fetch from API
            const endpoint = provider === 'spotify'
                ? `${config.apiUrl}/api/spotify/playlist/${id}`
                : `${config.apiUrl}/api/youtube/playlist/${id}`;

            const response = await axios.get(endpoint, { withCredentials: true });
            return response.data;
        } catch (error) {
            console.error(`Failed to fetch playlist ${id}:`, error);
            throw error;
        }
    };

    const getPlaylistTracks = async (provider, id) => {
        try {
            const endpoint = provider === 'spotify'
                ? `${config.apiUrl}/api/spotify/playlist/${id}/tracks`
                : `${config.apiUrl}/api/youtube/playlist/${id}/items`;

            const response = await axios.get(endpoint, { withCredentials: true });
            return response.data;
        } catch (error) {
            console.error(`Failed to fetch tracks for playlist ${id}:`, error);
            throw error;
        }
    };

    const clearCache = (provider = null) => {
        if (provider) {
            setPlaylists(prev => ({ ...prev, [provider]: [] }));
        } else {
            setPlaylists({ spotify: [], youtube: [] });
        }
    };

    const value = {
        playlists,
        loading,
        fetchPlaylists,
        getPlaylist,
        getPlaylistTracks,
        clearCache
    };

    return (
        <PlaylistContext.Provider value={value}>
            {children}
        </PlaylistContext.Provider>
    );
};
