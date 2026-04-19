import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],

    // Define global constants for environment variables
    define: {
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'process.env.VITE_APP_URL': JSON.stringify(env.VITE_APP_URL || 'http://localhost:5173'),
      'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV || 'development'),
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
    },

    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js'],
    },

    // Vercel-specific build settings
    ...(mode === 'production' ? {
      // Production build optimizations
      build: {
        cssCodeSplitting: true,
        sourcemap: false,
      },
    } : {}),
  };
});
