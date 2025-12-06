import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProgressCard from '../components/ProgressCard';
import { CheckCircle, Loader2, ArrowLeft, ExternalLink } from 'lucide-react';
import axios from 'axios';
import config from '../config';

const ConversionStatusPage = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();

    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [polling, setPolling] = useState(true);

    useEffect(() => {
        if (polling) {
            const interval = setInterval(() => {
                fetchStatus();
            }, 2000); // Poll every 2 seconds

            return () => clearInterval(interval);
        }
    }, [polling, jobId]);

    const fetchStatus = async () => {
        try {
            const response = await axios.get(
                `${config.apiUrl}/api/convert/status/${jobId}`,
                { withCredentials: true }
            );

            setStatus(response.data);
            setLoading(false);

            // Stop polling if completed or failed
            if (response.data.status === 'completed' || response.data.status === 'failed') {
                setPolling(false);
            }
        } catch (error) {
            console.error('Failed to fetch status:', error);
            setLoading(false);
            setPolling(false);
        }
    };

    const getProgress = () => {
        if (!status || !status.tracks) return 0;
        const total = status.tracks.length;
        const completed = status.tracks.filter(
            t => t.status === 'added' || t.status === 'failed' || t.status === 'not_found'
        ).length;
        return total > 0 ? (completed / total) * 100 : 0;
    };

    const getStats = () => {
        if (!status || !status.tracks) return { total: 0, matched: 0, failed: 0, pending: 0 };

        return {
            total: status.tracks.length,
            matched: status.tracks.filter(t => t.status === 'added' || t.status === 'matched').length,
            failed: status.tracks.filter(t => t.status === 'failed' || t.status === 'not_found').length,
            pending: status.tracks.filter(t => t.status === 'searching' || t.status === 'processing' || t.status === 'pending').length
        };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="animate-spin text-purple-600 mx-auto mb-4" size={48} />
                    <p className="text-gray-600 dark:text-gray-400">Loading conversion status...</p>
                </div>
            </div>
        );
    }

    const progress = getProgress();
    const stats = getStats();
    const isComplete = status?.status === 'completed';
    const isFailed = status?.status === 'failed';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-2"
                    >
                        <ArrowLeft size={20} />
                        <span>Back to Dashboard</span>
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Conversion Progress
                    </h1>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Status Card */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {isComplete ? 'Conversion Complete!' : isFailed ? 'Conversion Failed' : 'Converting Playlist...'}
                        </h2>
                        {isComplete && (
                            <CheckCircle className="text-green-500" size={32} />
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <span>Progress</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{stats.matched}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Matched</div>
                        </div>
                        <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
                        </div>
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
                        </div>
                    </div>

                    {/* Playlist Link */}
                    {isComplete && status.newPlaylistUrl && (
                        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                                ✨ Your playlist has been created successfully!
                            </p>
                            <a
                                href={status.newPlaylistUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 hover:underline font-medium"
                            >
                                <span>Open Playlist</span>
                                <ExternalLink size={16} />
                            </a>
                        </div>
                    )}
                </div>

                {/* Track Progress List */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Track Details
                    </h3>

                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                        {status?.tracks?.map((track, index) => (
                            <ProgressCard
                                key={index}
                                track={track}
                                status={track.status}
                            />
                        ))}
                    </div>
                </div>

                {/* Action Button */}
                {isComplete && (
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                        >
                            Convert Another Playlist
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConversionStatusPage;
