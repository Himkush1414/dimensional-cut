import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // three.js + r3f/drei pull the bundle past the default 500kB warning;
    // expected for a WebGL-heavy single page, not a regression to chase.
    chunkSizeWarningLimit: 1400,
  },
})
