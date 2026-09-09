import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createLiveKitServer, isLiveKitEnvConfigured, resolveLiveKitEnv } from './tokenServer.js';
import { isGeminiConfigured, GEMINI_MODEL } from './geminiService.js';
import { sttWorkerManager } from './sttWorkerManager.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

// Render sets process.env.PORT (defaults to 10000)
const PORT = Number(process.env.PORT || 10000);
const HOST = '0.0.0.0';

// Check dist/index.html existence at startup
const indexPath = path.join(distPath, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('\n================================================================');
  console.error('[MeetFlow AI] CRITICAL WARNING: dist/index.html does not exist!');
  console.error('[MeetFlow AI] The React frontend has not been built yet.');
  console.error('[MeetFlow AI] On Render, make sure your Build Command is set to:');
  console.error('[MeetFlow AI]   npm install && npm run build');
  console.error('================================================================\n');
} else {
  console.log(`[MeetFlow AI] Verified production frontend build in ${distPath}`);
}

const server = createLiveKitServer();

server.listen(PORT, HOST, () => {
  const mode = isLiveKitEnvConfigured(resolveLiveKitEnv()) ? 'live' : 'demo';
  if (mode === 'live') {
    sttWorkerManager.startSttWorker();
  }

  // Safe status logging — the API key is NEVER printed.
  console.log(`\n================================================================`);
  console.log(`[MeetFlow AI] Production server running at: http://${HOST}:${PORT}`);
  console.log(`[MeetFlow AI] Health check:                 http://${HOST}:${PORT}/healthz`);
  console.log(`[MeetFlow AI] Serving React SPA from:       ${distPath}`);
  console.log(`[MeetFlow AI] LiveKit mode:                 ${mode}`);
  console.log(`[MeetFlow AI] Gemini configured:            ${isGeminiConfigured()}`);
  console.log(`[MeetFlow AI] Gemini model:                 ${GEMINI_MODEL}`);
  console.log(`[MeetFlow AI] STT status:                   http://${HOST}:${PORT}/api/stt/status`);
  console.log(`[MeetFlow AI] AI status:                    http://${HOST}:${PORT}/api/ai/status`);
  console.log(`[MeetFlow AI] API status:                   http://${HOST}:${PORT}/api/livekit/status`);
  console.log(`================================================================\n`);
});

const cleanup = () => {
  sttWorkerManager.stopSttWorker();
  process.exit(0);
};
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
