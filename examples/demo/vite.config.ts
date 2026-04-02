import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['firebase', 'react', 'react-dom'],
    alias: {
      'firebase': path.resolve(__dirname, 'node_modules/firebase'),
    },
  },
});
