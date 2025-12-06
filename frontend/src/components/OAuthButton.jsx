import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Music, Youtube } from 'lucide-react';

const OAuthButton = ({ provider, className = '' }) => {
    const { login, auth } = useAuth();

    const config = {
        spotify: {
            icon: Music,
            label: 'Login with Spotify',
            bgColor: 'bg-green-600 hover:bg-green-700',
            isConnected: auth.spotify.isConnected
        },
        youtube: {
            icon: Youtube,
            label: 'Login with YouTube',
            bgColor: 'bg-red-600 hover:bg-red-700',
            isConnected: auth.youtube.isConnected
        }
    };

    const { icon: Icon, label, bgColor, isConnected } = config[provider];

    return (
        <button
            onClick={() => login(provider)}
            disabled={isConnected}
            className={`
                flex items-center justify-center gap-3 
                px-6 py-3 rounded-lg text-white font-semibold
                transition-all duration-200 transform hover:scale-105
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                ${bgColor}
                ${className}
            `}
        >
            <Icon size={24} />
            <span>{isConnected ? `Connected to ${provider}` : label}</span>
        </button>
    );
};

export default OAuthButton;
