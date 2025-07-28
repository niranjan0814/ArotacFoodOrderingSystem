import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    port: 5173, // Using port 5173 as requested
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        ws: true, // Enable WebSocket proxying for API-related requests
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true, // Enable WebSocket proxying
        headers: {
          'Access-Control-Allow-Origin': 'http://localhost:5173', // Match the port 5173
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      },
    },
    optimizeDeps: {
      include: ['mapbox-gl']
    },
    resolve: {
      alias: {},
    },
  },
  colors: {
    'dark-purple': '#081A51',
    'light-white': 'rgba(255,255,255,0.18)'
  }
})