import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import {
  createLiveKitRouter,
  resolveLiveKitEnv,
} from './server/tokenServer';

/**
 * Mounts the MeetFlow LiveKit token API inside the Vite dev server so
 * `npm run dev` serves both the app and /api/livekit/token.
 * Secrets stay server-side; the browser only ever receives
 * `{ serverUrl, participantToken }`.
 */
function liveKitApiPlugin(): Plugin {
  return {
    name: 'meetflow-livekit-token-api',
    configureServer(server) {
      const envFromFile = loadEnv(server.config.mode, server.config.envDir || process.cwd(), '');
      const env = resolveLiveKitEnv({ ...process.env, ...envFromFile } as NodeJS.ProcessEnv);
      server.middlewares.use('/api', createLiveKitRouter(env));
    },
  };
}

export default defineConfig(() => ({
  plugins: [react(), tailwindcss(), liveKitApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify — file watching is disabled to prevent flickering during agent edits.
    hmr: process.env.DISABLE_HMR !== 'true',
    // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
}));
