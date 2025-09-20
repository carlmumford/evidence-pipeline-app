import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Make the environment variable available in the client-side code
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
})
