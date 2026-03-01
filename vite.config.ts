import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'
import checker from 'vite-plugin-checker'

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  build: {
    minify: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-icons'],
        }
      }
    }
  },
  plugins: [
    react(),
    tsconfigPaths({ parseNative: true }),
    checker({
      typescript: true,
    }),
  ],
  worker: {
    plugins: () => [tsconfigPaths({ parseNative: true })]
  },
})
