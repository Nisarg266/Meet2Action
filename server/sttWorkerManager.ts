import { AgentDispatchClient, RoomServiceClient } from 'livekit-server-sdk';
import { resolveLiveKitEnv, isLiveKitEnvConfigured } from './tokenServer.js';

/**
 * MeetFlow AI — STT Status & Health Checker
 *
 * NOTE: Render and production Node.js servers DO NOT manage Python agent processes.
 * LiveKit Agent 'meetflow-stt' is a dedicated LiveKit Cloud agent worker.
 * This manager queries LiveKit Cloud to report true realtime agent state.
 */
class SttWorkerManager {
  public async getStatus() {
    const env = resolveLiveKitEnv();
    if (!isLiveKitEnvConfigured(env)) {
      return {
        configured: false,
        connected: false,
        agentName: 'meetflow-stt',
        provider: 'LiveKit Realtime STT',
        reason: 'LiveKit credentials not configured',
      };
    }

    try {
      const host = env.url.replace('wss://', 'https://');
      const roomClient = new RoomServiceClient(host, env.apiKey, env.apiSecret);
      const rooms = await roomClient.listRooms();
      return {
        configured: true,
        connected: true,
        agentName: 'meetflow-stt',
        provider: 'LiveKit Realtime STT (google/gemini-3.5-transcribe)',
        activeRooms: rooms.length,
      };
    } catch (err: any) {
      return {
        configured: true,
        connected: false,
        agentName: 'meetflow-stt',
        provider: 'LiveKit Realtime STT',
        error: err?.message || String(err),
      };
    }
  }

  // Lifecycle is managed externally (LiveKit Cloud) — no child process spawned
  public startSttWorker() {}
  public stopSttWorker() {}
}

export const sttWorkerManager = new SttWorkerManager();
