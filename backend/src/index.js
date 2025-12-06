const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
require('dotenv').config();



const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: [
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
        'https://spotifytest-nine.vercel.app',
        process.env.FRONTEND_URL
    ].filter(Boolean), // Remove undefined values
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/spotify_app', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

app.get('/', (req, res) => {
    res.send('Spotify App Backend is running');
});

// Routes
app.use('/api', require('./routes/spotifyRoutes'));
app.use('/api', require('./routes/youtubeRoutes'));
app.use('/api', require('./routes/aiRoutes'));
app.use('/api', require('./routes/toolsRoutes'));
app.use('/api', require('./routes/conversionRoutes'));
app.use('/api/playlist', require('./routes/playlistAnalyticsRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
