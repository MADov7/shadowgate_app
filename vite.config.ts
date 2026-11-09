/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Same '@/…' path alias as the Next.js tsconfig (used by lib/* and its unit tests).
    alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
    dedupe: ['react', 'react-dom', 'three'],
  },
  // Vite now only serves the ad renderer (ad.html → npm run ad:dev) and runs the unit tests; the site uses Next.js.
  server: { host: true, allowedHosts: true },
  preview: { host: true, allowedHosts: true },
  // Pre-bundle every runtime dependency up front so the dev server never re-optimizes mid-session
  // (a mid-session re-optimization can load two React copies → "Invalid hook call").
  optimizeDeps: {
    entries: ['ad.html'],
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
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'lib/**/*.test.ts'],
    setupFiles: ['src/test/setup-catalog.ts'],
  },
});
