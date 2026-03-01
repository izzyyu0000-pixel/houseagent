import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      strict: false
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'firebase/auth', 'firebase/firestore']
  }
})
