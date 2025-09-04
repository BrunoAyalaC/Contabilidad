import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
      ,server: {
        proxy: {
          // Proxy OCR API calls during dev to avoid CORS issues when backend isn't configured
          '/api/Ocr': {
            target: 'http://127.0.0.1:5004',
            changeOrigin: true,
            secure: false,
            rewrite: (p) => p.replace(/^\/api\/Ocr/, '/api/Ocr')
          }
              ,
              // Proxy Import calls to the backend so `/api/Import/...` resolves during dev
              '/api/Import': {
                target: 'http://127.0.0.1:5004',
                changeOrigin: true,
                secure: false,
                rewrite: (p) => p.replace(/^\/api\/Import/, '/api/Import')
              }
              ,
              // Proxy accounting endpoints to the Accounting service (PCGE accounts, register, etc.)
              '/api/Accounting': {
                target: 'http://127.0.0.1:5002',
                changeOrigin: true,
                secure: false,
                rewrite: (p) => p.replace(/^\/api\/Accounting/, '/api/Accounting')
              }
        }
      }
    };
});
