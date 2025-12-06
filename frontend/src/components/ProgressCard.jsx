import React from 'react';
import { CheckCircle, XCircle, Loader2, Search } from 'lucide-react';

const ProgressCard = ({ track, status }) => {
    const getStatusIcon = () => {
        switch (status) {
            case 'matched':
            case 'added':
                return <CheckCircle className="text-green-500" size={20} />;
            case 'failed':
            case 'not_found':
                return <XCircle className="text-red-500" size={20} />;
            case 'searching':
                return <Search className="text-blue-500 animate-pulse" size={20} />;
            case 'processing':
                return <Loader2 className="text-yellow-500 animate-spin" size={20} />;
            default:
                return <div className="w-5 h-5 rounded-full bg-gray-300" />;
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'matched':
                return 'Matched';
            case 'added':
                return 'Added';
            case 'failed':
                return 'Failed';
            case 'not_found':
                return 'Not Found';
            case 'searching':
                return 'Searching...';
            case 'processing':
                return 'Processing...';
            default:
                return 'Pending';
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'matched':
            case 'added':
                return 'text-green-600 dark:text-green-400';
            case 'failed':
            case 'not_found':
                return 'text-red-600 dark:text-red-400';
            case 'searching':
            case 'processing':
                return 'text-blue-600 dark:text-blue-400';
            default:
                return 'text-gray-500 dark:text-gray-400';
        }
    };

    return (
        <div className="
            flex items-center justify-between p-3 rounded-lg
            bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
            shadow-sm
        ">
            <div className="flex-1 min-w-0 mr-4">
                <h4 className="font-medium text-gray-900 dark:text-white truncate text-sm">
                    {track.name || track.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {track.artist || track.artists?.[0]?.name || 'Unknown Artist'}
                </p>
            </div>

            <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className={`text-sm font-medium ${getStatusColor()}`}>
                    {getStatusText()}
                </span>
            </div>
        </div>
    );
};

export default ProgressCard;
