import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import checker from 'vite-plugin-checker'
import wasm from 'vite-plugin-wasm'

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    fs: {
      allow: ['.'],
    },
  },
  worker: {
    plugins: () => [wasm()],
    format: 'es',
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor',
              test: /node_modules[\\/](react|react-dom|react-icons)([\\/]|$)/,
            },
          ],
        },
      },
    },
  },
  plugins: [
    react(),
    wasm(),
    checker({
      typescript: true,
    }),
  ],
})
