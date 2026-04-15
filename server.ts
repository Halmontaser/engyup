import express from 'express';
import { getMediaForActivity } from './src/lib/mediaIndex.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5173;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// CORS middleware for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Media API - Get media for a specific activity
app.get('/api/media/:activityId', (req, res) => {
  try {
    const { activityId } = req.params;

    // Get media metadata from the index
    const media = getMediaForActivity(activityId);

    // Check client's preferred formats from Accept header
    const accept = req.headers.accept || '';
    const supportsWebP = accept.includes('image/webp');
    const supportsAvif = accept.includes('image/avif');
    const supportsOpus = accept.includes('audio/opus');

    // Add optimization hints
    const response = {
      audio: media.audio.map((a) => ({
        ...a,
        optimizedUrl: supportsOpus ? a.url.replace(/\.(mp3|m4a|wav)$/i, '.opus') : a.url,
      })),
      images: media.images.map((img) => ({
        ...img,
        optimizedUrl: supportsAvif
          ? img.url.replace(/\.(png|jpg|jpeg)$/i, '.avif')
          : supportsWebP
            ? img.url.replace(/\.(png|jpg|jpeg)$/i, '.webp')
            : img.url,
        thumbnailUrl: img.url.replace(/\.(png|jpg|jpeg)$/i, '-thumb.webp'),
      })),
    };

    // Cache for 1 hour (media changes rarely)
    res.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    res.json(response);
  } catch (error) {
    console.error(`Error fetching media for activity ${req.params.activityId}:`, error);
    res.status(500).json({ error: 'Failed to fetch media', audio: [], images: [] });
  }
});

// Serve Vite dist in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/media/:activityId`);
});
