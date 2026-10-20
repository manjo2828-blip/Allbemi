import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// contracts/ (스키마·예시 데이터)를 frontend 밖에서 직접 가져온다. 예시 데이터는 한 곳(contracts/examples)만 쓴다.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@contracts': path.resolve(import.meta.dirname, '../contracts'),
    },
  },
  server: {
    port: 5180,
    strictPort: true,
    fs: { allow: ['..'] },
  },
})
