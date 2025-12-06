import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Music, TrendingUp, Users, Clock, Sparkles } from 'lucide-react';
import axios from 'axios';
import config from '../config';
import '../styles/AnalyticsPage.css';

const PlaylistAnalyticsPage = () => {
    const navigate = useNavigate();
    const { playlistId } = useParams();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (playlistId) {
            fetchAnalytics();
        }
    }, [playlistId]);

    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(
                `${config.apiUrl}/api/playlist/analytics/${playlistId}`,
                { withCredentials: true }
            );
            setAnalytics(response.data);
        } catch (err) {
            console.error('Analytics fetch error:', err);
            setError(err.response?.data?.message || 'Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="analytics-page">
                <div className="loading-container">
                    <Sparkles className="loading-icon" />
                    <p>Analyzing your playlist...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="analytics-page">
                <div className="error-container">
                    <p>{error}</p>
                    <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
                </div>
            </div>
        );
    }

    if (!analytics) return null;

    const { playlistName, totalTracks, analytics: data } = analytics;

    return (
        <div className="analytics-page">
            <div className="analytics-header">
                <button className="back-button" onClick={() => navigate('/dashboard')}>
                    <ArrowLeft size={20} />
                    Back
                </button>
                <h1>{playlistName}</h1>
                <p className="subtitle">{totalTracks} tracks • {data.totalMinutes} minutes</p>
            </div>

            <div className="analytics-grid">
                {/* Playlist Personality */}
                <div className="analytics-card personality-card">
                    <h2>Playlist Personality</h2>
                    <div className="personality-label">{data.personality}</div>
                </div>

                {/* Mood Profile */}
                <div className="analytics-card">
                    <h2><Music size={20} /> Mood Profile</h2>
                    <div className="mood-primary">{data.moodProfile.primary}</div>
                    {data.moodProfile.traits.length > 0 && (
                        <div className="mood-traits">
                            {data.moodProfile.traits.map((trait, idx) => (
                                <span key={idx} className="trait-tag">{trait}</span>
                            ))}
                        </div>
                    )}
                    <div className="mood-scores">
                        <div className="score-item">
                            <span>Happiness</span>
                            <div className="score-bar">
                                <div className="score-fill" style={{ width: `${data.moodProfile.scores.valence}%` }}></div>
                            </div>
                            <span>{data.moodProfile.scores.valence}%</span>
                        </div>
                        <div className="score-item">
                            <span>Energy</span>
                            <div className="score-bar">
                                <div className="score-fill" style={{ width: `${data.moodProfile.scores.energy}%` }}></div>
                            </div>
                            <span>{data.moodProfile.scores.energy}%</span>
                        </div>
                        <div className="score-item">
                            <span>Danceability</span>
                            <div className="score-bar">
                                <div className="score-fill" style={{ width: `${data.moodProfile.scores.danceability}%` }}></div>
                            </div>
                            <span>{data.moodProfile.scores.danceability}%</span>
                        </div>
                    </div>
                </div>

                {/* Top Genres */}
                {data.topGenres.length > 0 && (
                    <div className="analytics-card">
                        <h2><TrendingUp size={20} /> Top Genres</h2>
                        <div className="genre-list">
                            {data.topGenres.map((genre, idx) => (
                                <div key={idx} className="genre-item">
                                    <span className="genre-name">{genre.genre}</span>
                                    <span className="genre-count">{genre.count} tracks</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Temporal Analysis */}
                <div className="analytics-card">
                    <h2><Clock size={20} /> Time Travel</h2>
                    <div className="temporal-stats">
                        <div className="stat">
                            <span className="stat-label">Average Age</span>
                            <span className="stat-value">{data.temporal.avgAge} years</span>
                        </div>
                        <div className="stat">
                            <span className="stat-label">Oldest Track</span>
                            <span className="stat-value">{data.temporal.oldestTrack.name}</span>
                            <span className="stat-detail">{data.temporal.oldestTrack.artist} ({data.temporal.oldestTrack.year})</span>
                        </div>
                        <div className="stat">
                            <span className="stat-label">Newest Track</span>
                            <span className="stat-value">{data.temporal.newestTrack.name}</span>
                            <span className="stat-detail">{data.temporal.newestTrack.artist} ({data.temporal.newestTrack.year})</span>
                        </div>
                    </div>
                    {Object.keys(data.temporal.decadeDistribution).length > 0 && (
                        <div className="decade-chart">
                            <h3>Decade Distribution</h3>
                            {Object.entries(data.temporal.decadeDistribution).map(([decade, count]) => (
                                <div key={decade} className="decade-bar">
                                    <span>{decade}</span>
                                    <div className="bar">
                                        <div className="bar-fill" style={{ width: `${(count / totalTracks) * 100}%` }}></div>
                                    </div>
                                    <span>{count}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Diversity */}
                <div className="analytics-card">
                    <h2><Users size={20} /> Diversity</h2>
                    <div className="diversity-stats">
                        <div className="stat">
                            <span className="stat-value">{data.diversity.uniqueArtists}</span>
                            <span className="stat-label">Unique Artists</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">{data.diversity.uniqueAlbums}</span>
                            <span className="stat-label">Unique Albums</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">{data.diversity.varietyScore}%</span>
                            <span className="stat-label">Variety Score</span>
                        </div>
                    </div>
                    <div className="most-repeated">
                        <p>Most Featured Artist: <strong>{data.diversity.mostRepeatedArtist.name}</strong> ({data.diversity.mostRepeatedArtist.count} tracks)</p>
                    </div>
                </div>

                {/* Key & Tempo */}
                {data.hasAudioFeatures && (
                    <div className="analytics-card">
                        <h2>Musical Keys & Tempo</h2>
                        <div className="key-tempo-stats">
                            <div className="stat">
                                <span className="stat-label">Most Common Key</span>
                                <span className="stat-value">{data.keyAndTempo.mostCommonKey}</span>
                            </div>
                            <div className="stat">
                                <span className="stat-label">Average BPM</span>
                                <span className="stat-value">{data.keyAndTempo.avgTempo}</span>
                            </div>
                        </div>
                        <div className="bpm-ranges">
                            <div className="bpm-item">
                                <span>Slow (&lt;90)</span>
                                <span>{data.keyAndTempo.bpmRanges.slow}</span>
                            </div>
                            <div className="bpm-item">
                                <span>Moderate (90-120)</span>
                                <span>{data.keyAndTempo.bpmRanges.moderate}</span>
                            </div>
                            <div className="bpm-item">
                                <span>Fast (120-150)</span>
                                <span>{data.keyAndTempo.bpmRanges.fast}</span>
                            </div>
                            <div className="bpm-item">
                                <span>Very Fast (150+)</span>
                                <span>{data.keyAndTempo.bpmRanges.veryFast}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sonic Clusters */}
                {data.clusters && data.clusters.length > 0 && (
                    <div className="analytics-card full-width">
                        <h2>Sonic Clusters</h2>
                        <div className="clusters-grid">
                            {data.clusters.map((cluster, idx) => (
                                <div key={idx} className="cluster-card">
                                    <h3>{cluster.name}</h3>
                                    <p className="cluster-count">{cluster.count} tracks</p>
                                    <div className="cluster-examples">
                                        {cluster.examples.map((track, i) => (
                                            <span key={i} className="example-track">{track}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Outliers */}
                {data.outliers && data.outliers.length > 0 && (
                    <div className="analytics-card full-width">
                        <h2>Outliers (Tracks That Stand Out)</h2>
                        <div className="outliers-list">
                            {data.outliers.map((outlier, idx) => (
                                <div key={idx} className="outlier-item">
                                    <div className="outlier-track">
                                        <strong>{outlier.name}</strong>
                                        <span>{outlier.artist}</span>
                                    </div>
                                    <div className="outlier-reason">{outlier.reason}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {!data.hasAudioFeatures && (
                <div className="warning-banner">
                    ⚠️ Some advanced analytics (sonic clusters, outliers, detailed tempo analysis) are unavailable because Spotify's audio features couldn't be fetched.
                </div>
            )}
        </div>
    );
};

export default PlaylistAnalyticsPage;
