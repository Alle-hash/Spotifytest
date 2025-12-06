import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Music2, ListMusic } from 'lucide-react';

const PlaylistCard = ({ playlist, provider }) => {
    const navigate = useNavigate();

    const getCoverImage = () => {
        if (provider === 'spotify') {
            return playlist.images?.[0]?.url || '/placeholder-playlist.png';
        } else {
            return playlist.snippet?.thumbnails?.medium?.url || '/placeholder-playlist.png';
        }
    };

    const getPlaylistName = () => {
        return provider === 'spotify' ? playlist.name : playlist.snippet?.title;
    };

    const getTrackCount = () => {
        if (provider === 'spotify') {
            return playlist.tracks?.total || 0;
        } else {
            return playlist.contentDetails?.itemCount || 0;
        }
    };

    return (
        <div
            onClick={() => navigate(`/playlist/${provider}/${playlist.id}`)}
            className="
                bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden
                cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-xl
                border border-gray-200 dark:border-gray-700
            "
        >
            <div className="aspect-square relative bg-gradient-to-br from-purple-500 to-pink-500">
                <img
                    src={getCoverImage()}
                    alt={getPlaylistName()}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                    }}
                />
                <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                    {provider === 'spotify' ? (
                        <Music2 className="text-green-400" size={16} />
                    ) : (
                        <ListMusic className="text-red-400" size={16} />
                    )}
                </div>
            </div>

            <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate mb-1">
                    {getPlaylistName()}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getTrackCount()} tracks
                </p>
            </div>
        </div>
    );
};

export default PlaylistCard;
