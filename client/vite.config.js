import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Listen on all network interfaces
    port: 5173, // Default port for Vite
    fs: {
      allow: [
        // Allow serving files from client src directory
        path.resolve(__dirname, './src'),
        // Allow parent directory access if needed
        path.resolve(__dirname, '..'),
        // Add the server uploads directory to allowed paths
        path.resolve(__dirname, "../server/uploads")
      ]
    }
  },
  base: "./",
});
