import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PlaylistProvider } from './context/PlaylistContext';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PlaylistDetailPage from './pages/PlaylistDetailPage';
import ConversionStatusPage from './pages/ConversionStatusPage';
import SettingsPage from './pages/SettingsPage';
import AIGeneratorPage from './pages/AIGeneratorPage';
import AnalyticsPage from './pages/AnalyticsPage';
import PlaylistAnalyticsPage from './pages/PlaylistAnalyticsPage';
import CleanupPage from './pages/CleanupPage';

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <PlaylistProvider>
                    <BrowserRouter>
                        <Routes>
                            <Route path="/" element={<LoginPage />} />
                            <Route path="/dashboard" element={<DashboardPage />} />
                            <Route path="/playlist/:provider/:id" element={<PlaylistDetailPage />} />
                            <Route path="/convert/:jobId" element={<ConversionStatusPage />} />
                            <Route path="/settings" element={<SettingsPage />} />
                            <Route path="/ai-generator" element={<AIGeneratorPage />} />
                            <Route path="/analytics" element={<AnalyticsPage />} />
                            <Route path="/playlist-analytics/:playlistId" element={<PlaylistAnalyticsPage />} />
                            <Route path="/cleanup" element={<CleanupPage />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </BrowserRouter>
                </PlaylistProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
