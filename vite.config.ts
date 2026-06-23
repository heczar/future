import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâ€”file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks: {
            // Core React runtime
            'vendor-react': ['react', 'react-dom', 'react-markdown'],
            // Animation library
            'vendor-motion': ['motion'],
            // Firebase SDK (largest external dep)
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            // Canvas editor
            'vendor-fabric': ['fabric'],
            // Google AI
            'vendor-genai': ['@google/genai'],
            // Icons
            'vendor-icons': ['lucide-react'],
          },
        },
      },
    },
  };
});
