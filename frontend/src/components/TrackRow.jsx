import React from 'react';
import { Music, Clock } from 'lucide-react';

const TrackRow = ({ track, provider, index }) => {
    const getTrackData = () => {
        if (provider === 'spotify') {
            return {
                title: track.name || track.track?.name,
                artist: track.artists?.[0]?.name || track.track?.artists?.[0]?.name || 'Unknown Artist',
                album: track.album?.name || track.track?.album?.name,
                duration: track.duration_ms || track.track?.duration_ms,
                image: track.album?.images?.[0]?.url || track.track?.album?.images?.[0]?.url
            };
        } else {
            return {
                title: track.snippet?.title,
                artist: track.snippet?.videoOwnerChannelTitle || 'YouTube',
                album: null,
                duration: null,
                image: track.snippet?.thumbnails?.default?.url
            };
        }
    };

    const formatDuration = (ms) => {
        if (!ms) return '--:--';
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const data = getTrackData();

    return (
        <div className="
            flex items-center gap-4 p-3 rounded-lg
            hover:bg-gray-100 dark:hover:bg-gray-700
            transition-colors duration-150
            group
        ">
            <div className="w-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                {index + 1}
            </div>

            {data.image && (
                <img
                    src={data.image}
                    alt={data.title}
                    className="w-12 h-12 rounded object-cover"
                />
            )}
            {!data.image && (
                <div className="w-12 h-12 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Music className="text-white" size={20} />
                </div>
            )}

            <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 dark:text-white truncate">
                    {data.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {data.artist}
                    {data.album && ` • ${data.album}`}
                </p>
            </div>

            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                <Clock size={14} />
                <span>{formatDuration(data.duration)}</span>
            </div>
        </div>
    );
};

export default TrackRow;
