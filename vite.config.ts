import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
  // Note: Do NOT inject secret API keys into the client bundle.
  // Access GEMINI_API_KEY only from the Electron main process or a secure backend.
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
