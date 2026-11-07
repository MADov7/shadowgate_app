/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'three'],
  },
  // Hosted previews (e.g. Replit's *.replit.dev domains) must be allowed to reach the dev/preview server.
  server: { host: true, allowedHosts: true },
  preview: { host: true, allowedHosts: true },
  // Pre-bundle every runtime dependency up front so the dev server never re-optimizes mid-session
  // (a mid-session re-optimization can load two React copies → "Invalid hook call").
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      '@react-three/postprocessing',
      'postprocessing',
      'gsap',
      'gsap/ScrollTrigger',
      'lenis',
      'zustand',
      'zustand/middleware',
      'lucide-react',
    ],
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei', '@react-three/postprocessing', 'postprocessing'],
          motion: ['gsap', 'lenis'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
