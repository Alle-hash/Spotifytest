import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();
    return (
        <div>
            <h1>Spotify Manager</h1>
            <p>Analyze, Cleanup, Boost, and Export your playlists.</p>
            <div style={{ marginTop: '20px' }}>
                <button onClick={() => navigate('/login')} style={{ marginRight: '10px' }}>Login</button>
                <button onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
            </div>
        </div>
    );
};

export default Home;
