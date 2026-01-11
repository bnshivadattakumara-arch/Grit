import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Change 'your-repo-name' to your actual GitHub repository name
  base: '/', 
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});