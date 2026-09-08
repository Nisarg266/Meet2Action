import { createLiveKitServer, isLiveKitEnvConfigured, resolveLiveKitEnv } from './tokenServer';

const PORT = Number(process.env.PORT || 8787);

const server = createLiveKitServer();

server.listen(PORT, () => {
  const mode = isLiveKitEnvConfigured(resolveLiveKitEnv()) ? 'live' : 'demo';
  console.log(`[meetflow] LiveKit token server listening on http://localhost:${PORT} (mode: ${mode})`);
  console.log('[meetflow] POST /api/livekit/token { room, identity, name }');
});
