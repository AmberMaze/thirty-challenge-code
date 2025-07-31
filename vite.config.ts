import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import bundlesize from 'vite-plugin-bundlesize';

export default defineConfig({
  plugins: [
    react(),
    bundlesize({
      limits: [
        // check every generated JS entry ≤ 200 kB gzip-compressed
        { name: '**/*.js', limit: '200 kB' },
      ],
    }),
  ],
  base: '/',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: 'hidden',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['framer-motion'],
        },
      },
    },
    // optional: also raise Vite’s own warning bar from 500 kB to 200 kB
    chunkSizeWarningLimit: 200, // kB  :
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      '@supabase/supabase-js',
      '@daily-co/daily-js',
      'flag-icons',
    ],
  },
});
