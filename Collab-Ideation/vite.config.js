import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      host: true,
      historyApiFallback: true,
      proxy: {
        '/api': {
          target: mode === 'development' 
            ? 'http://localhost:5000' 
            : 'https://g11-project1-ai.onrender.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  }
})
