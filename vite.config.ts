import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import checker from 'vite-plugin-checker'

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  resolve: {
    tsconfigPaths: true,
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
    checker({
      typescript: true,
    }),
  ],
})
