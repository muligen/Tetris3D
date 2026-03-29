import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true
  },
  build: {
    // Output directory
    outDir: 'dist',
    // Generate source maps for production debugging
    sourcemap: false,
    // Minify
    minify: 'esbuild',
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Rollup options
    rollupOptions: {
      output: {
        // Manual chunks
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          'state-vendor': ['zustand']
        }
      }
    },
    // CSS code splitting
    cssCodeSplit: true,
    // Target modern browsers
    target: 'es2015'
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'three', '@react-three/fiber', '@react-three/drei', 'zustand']
  },
  // Preview server configuration
  preview: {
    port: 5175,
    host: true
  }
})
