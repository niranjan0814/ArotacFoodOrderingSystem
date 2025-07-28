import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174, // Set to port 5174 as requested
    strictPort: true,
    host:true,
    proxy: {
      '/api': {
        target: 'http://192.168.8.156:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket for socket.io
        headers: {
          'Access-Control-Allow-Origin': 'http://localhost:5174', // Match HTTP port 5174
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      },
    },
  },
  optimizeDeps: {
    include: ['mapbox-gl'], // Keep for Mapbox
  },
  resolve: {
    alias: {}, // Keep empty as in original
  },
});