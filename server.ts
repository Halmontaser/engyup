import express from 'express';
import { getMediaForActivity } from './src/lib/mediaIndex.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5173;
const isDev = process.env.NODE_ENV !== 'production';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
  ];

  // In development, allow all origins for testing
  if (isDev) {
    res.header('Access-Control-Allow-Origin', '*');
  } else if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Request logging middleware (development only)
if (isDev) {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    if (Object.keys(req.body).length > 0) {
      console.log('Body:', JSON.stringify(req.body, null, 2));
    }
    next();
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
});

// Media API - Get media for a specific activity
app.get('/api/media/:activityId', (req, res) => {
  try {
    const { activityId } = req.params;

    if (isDev) {
      console.log(`Fetching media for activity: ${activityId}`);
    }

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
    res.status(500).json({
      error: 'Failed to fetch media',
      message: error instanceof Error ? error.message : 'Unknown error',
      audio: [],
      images: [],
    });
  }
});

// In development, serve the Vite dev server
if (isDev) {
  console.log('Starting in development mode...');

  // Create Vite server in middleware mode
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });

  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  vite.httpServer?.on('listening', () => {
    console.log(`Vite dev server is ready`);
  });
} else {
  // In production, serve static files from dist
  app.use(express.static(path.join(__dirname, 'dist')));

  // SPA fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Server error:', err);

  if (isDev) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
      stack: err.stack,
    });
  } else {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Something went wrong. Please try again later.',
    });
  }
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n=================================');
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Local URL: http://localhost:${PORT}`);
  console.log(`Network URL: http://0.0.0.0:${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/media/:activityId`);
  console.log('=================================\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
