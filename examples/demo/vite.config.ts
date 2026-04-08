import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['firebase', 'react', 'react-dom'],
    alias: [
      {
        find: 'firebase',
        replacement: path.resolve(__dirname, 'node_modules/firebase'),
      },
      // CSS sub-path — resolved from the built dist so Tailwind is pre-compiled
      {
        find: /^@saigontechnology\/react-firebase-chat\/styles$/,
        replacement: path.resolve(__dirname, '../../dist/styles.css'),
      },
      // JS/TS entry — resolved from source so edits are reflected instantly
      // without needing to rebuild the library or re-run npm install.
      {
        find: /^@saigontechnology\/react-firebase-chat$/,
        replacement: path.resolve(__dirname, '../../src/index.ts'),
      },
    ],
  },
});
