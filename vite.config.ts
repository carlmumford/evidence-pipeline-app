import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // As per Gemini API guidelines, the API key must be sourced from process.env.API_KEY.
  // This injects the value from the VITE_API_KEY environment variable at build time.
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.VITE_API_KEY),
  },
})
