import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The console runs on its own: no backend and no SDK engine are needed.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5181,
    strictPort: true,
  },
});
