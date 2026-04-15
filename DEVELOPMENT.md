# Development Environment Setup Guide

## Overview

This is a Vite + React + TypeScript project with Supabase authentication and Google OAuth support.

## Prerequisites

- Node.js 18+
- npm or yarn
- A Supabase project (free tier works fine)

## Quick Start

### 1. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Application Configuration
VITE_APP_URL=http://localhost:5173

# Google OAuth (optional)
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Development Settings
NODE_ENV=development
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

The server will start at:
- **Local URL**: http://localhost:5173
- **Network URL**: http://0.0.0.0:5173 (for mobile testing)

## Google OAuth Setup

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth 2.0 client ID
3. **Application type**: Web application
4. **Authorized redirect URIs**:
   - Development: `http://localhost:5173`
   - Production: `https://yourdomain.com`
5. Copy the Client ID to your `.env.local`

### 2. Supabase Google Provider Setup

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/_/auth/providers)
2. Enable **Google** provider
3. Add your Google Client ID
4. Add redirect URL:
   - Development: `http://localhost:5173`
   - Production: `https://yourdomain.com`
5. Click **Save**

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Express + Vite |
| `npm run dev:vite` | Start Vite dev server only (no API) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run preview:server` | Preview with Express server |
| `npm run lint` | Check TypeScript errors |
| `npm run clean` | Remove build artifacts |

## Project Structure

```
engyup/
├── src/
│   ├── components/     # React components
│   ├── context/        # React contexts (Auth, etc.)
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities and configurations
│   ├── pages/          # Page components
│   └── services/       # API services
├── public/             # Static assets
├── server.ts          # Express server for API routes
└── vite.config.ts      # Vite configuration
```

## API Endpoints

### Health Check
```
GET /api/health
```

Returns server status and configuration.

### Media API
```
GET /api/media/:activityId
```

Returns optimized media metadata for an activity.

Response format:
```json
{
  "audio": [
    {
      "filename": "example.mp3",
      "text": "Text content",
      "audioType": "word",
      "url": "/media/audio/example.mp3",
      "optimizedUrl": "/media/audio/example.opus"
    }
  ],
  "images": [
    {
      "filename": "example.jpg",
      "prompt": "Description",
      "url": "/media/images/example.jpg",
      "optimizedUrl": "/media/images/example.webp",
      "thumbnailUrl": "/media/images/example-thumb.webp"
    }
  ]
}
```

## Media Optimization

The system automatically optimizes media based on browser capabilities:

- **Images**: Prefers AVIF, falls back to WebP, then original format
- **Audio**: Prefers Opus, falls back to AAC, then MP3
- **Lazy Loading**: Images load only when in viewport
- **Caching**: 1-hour cache for media metadata

## Authentication

### Google OAuth
- User clicks "Continue with Google"
- Redirects to Google sign-in page
- User authenticates and authorizes
- Redirects back to app with session

### Email/Password
- Users can sign up/in with email and password
- Passwords are minimum 6 characters
- Session persists in localStorage

### Admin Authentication
- Set `VITE_ADMIN_PASSWORD` in `.env.local` for admin access
- Admin password is stored in localStorage for session persistence

## Development Tips

### Hot Module Replacement (HMR)
- Vite provides instant HMR for most changes
- Server restarts on `vite.config.ts` changes

### Debugging
- Browser DevTools: Open Components and Network tabs
- Server logs: All requests are logged in terminal
- Supabase logs: Check Supabase Dashboard > Logs

### Testing on Mobile
1. Start dev server: `npm run dev`
2. Get your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. Access from mobile: `http://YOUR_IP:5173`

### Environment-Specific Code

```typescript
// Check environment
if (import.meta.env.NODE_ENV === 'development') {
  // Development-only code
}

// Access environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const appUrl = import.meta.env.VITE_APP_URL;
```

## Troubleshooting

### Port Already in Use
If port 5173 is busy:
```bash
# Kill process using port 5173
lsof -ti:5173 | xargs kill -9

# Or use a different port
PORT=3000 npm run dev
```

### Google OAuth Fails
1. Check redirect URIs match exactly (including http/https)
2. Verify Google Client ID is correct in Supabase
3. Check browser console for specific error messages
4. Try in incognito window to test fresh state

### Supabase Connection Issues
1. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
2. Check Supabase project is not paused
3. Verify API URL format: `https://project-ref.supabase.co`
4. Check browser console for network errors

### Build Errors
```bash
# Clean and rebuild
npm run clean
npm run build

# Check TypeScript errors
npm run lint
```

### Environment Variables Not Loading
1. Ensure `.env.local` is in project root
2. Variables must start with `VITE_` for client access
3. Restart dev server after changing `.env.local`
4. Check for typos in variable names

## Production Deployment

### Build
```bash
npm run build
```

### Environment Variables for Production
```bash
# .env.production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=https://yourdomain.com
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
NODE_ENV=production
```

### Deploy to Vercel/Netlify
1. Push to GitHub
2. Import project in Vercel/Netlify
3. Add environment variables in dashboard
4. Deploy

## Useful Links

- [Vite Documentation](https://vitejs.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev/)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)

## Support

For issues or questions:
1. Check this guide
2. Review browser console logs
3. Check server terminal logs
4. Verify Supabase project settings
