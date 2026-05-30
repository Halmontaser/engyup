import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'logo.png'],
        manifest: {
          name: 'EngyUp - English Learning',
          short_name: 'EngyUp',
          description: 'Interactive English learning platform',
          theme_color: '#4f46e5',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: '/logo.png',
              sizes: '192x192',
              type: 'image/png',
            },
          ],
        },
        workbox: {
          // Precache the app shell
          globPatterns: ['**/*.{js,css,html,svg,woff2}'],
          globIgnores: ['**/media/**', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.webp', '**/*.mp3', '**/*.wav', '**/*.ogg', '**/*.m4a'],
          // Runtime caching for unit media assets
          runtimeCaching: [
            {
              // Cache unit JSON data
              urlPattern: /^\/media\/.*\/activities\.json$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'unit-data',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                },
              },
            },
            {
              // Cache unit audio files
              urlPattern: /^\/media\/.*\/audio\/.*\.(mp3|wav|ogg|m4a)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'unit-audio',
                expiration: {
                  maxEntries: 500,
                  maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                },
              },
            },
            {
              // Cache unit image files
              urlPattern: /^\/media\/.*\/images\/.*\.(png|jpg|jpeg|webp|svg)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'unit-images',
                expiration: {
                  maxEntries: 500,
                  maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                },
              },
            },
            {
              // CDN assets (Cloudflare R2)
              urlPattern: /^https:\/\/.*\.r2\.dev\/.*/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'cdn-assets',
                expiration: {
                  maxEntries: 500,
                  maxAgeSeconds: 30 * 24 * 60 * 60,
                },
              },
            },
          ],
        },
      }),
    ],

    // Define global constants for environment variables
    define: {
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'process.env.VITE_APP_URL': JSON.stringify(env.VITE_APP_URL || 'http://localhost:5173'),
      'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV || 'development'),
      'process.env.NEXT_PUBLIC_ADMIN_PASSWORD': JSON.stringify(env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin'),
    },

    // Path aliases
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    // Development server configuration
    server: {
      port: 5173,
      host: true, // Allow network access for mobile testing
      strictPort: false, // Use next available port if 5173 is busy
      hmr: {
        overlay: true, // Show error overlay in browser
      },
      // Proxy API requests to avoid CORS issues
      proxy: env.VITE_API_URL
        ? {
            '/api': {
              target: env.VITE_API_URL,
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/api/, ''),
            },
          }
        : undefined,
    },

    // Preview server configuration
    preview: {
      port: 4173,
      host: true,
      strictPort: false,
    },

    // Build optimization
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      copyPublicDir: false, // Skip copying public/ to dist/ (media symlinks cause issues)
      rollupOptions: {
        output: {
          manualChunks: {
            // Separate vendor chunks for better caching
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'supabase-vendor': ['@supabase/supabase-js'],
            'ui-vendor': ['lucide-react', 'motion', 'canvas-confetti'],
          },
        },
      },
      chunkSizeWarningLimit: 1000, // Increase limit to 1MB
      ...(mode === 'production' ? {
        cssCodeSplitting: true,
        sourcemap: false,
      } : {}),
    },

    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js'],
    },
  };
});
