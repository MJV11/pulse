import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Serve index.html for all 404s so React Router handles client-side routes on refresh
    historyApiFallback: true,
  },
})
