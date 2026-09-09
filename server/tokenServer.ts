import express, { type Request, type Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { AccessToken, AgentDispatchClient, RoomServiceClient, WebhookReceiver } from 'livekit-server-sdk';
import dotenv from 'dotenv';
import {
  RecordingError,
  handleEgressWebhookEvent,
  refreshRecordingFromEgress,
  recordingConfigSummary,
  resolveRecordingEnv,
  startRoomRecording,
  stopRoomRecording,
} from './egressService.js';
import { getRecording, listRecordings, toPublicRecording } from './recordingStore.js';
import { sttWorkerManager } from './sttWorkerManager.js';
import {
  analyzeTranscriptSegment,
  analyzeFullMeeting,
  isGeminiConfigured,
  GEMINI_MODEL,
  transcribeAudio,
  type TranscriptUtterance,
  type SegmentAnalysisContext,
} from './geminiService.js';
import {
  saveScheduledMeeting,
  getScheduledMeeting,
  listScheduledMeetings,
  updateScheduledMeeting,
  cancelScheduledMeeting,
} from './scheduleStore.js';
import { getActiveServerReminders, checkAndTriggerReminders } from './reminderScheduler.js';

/**
 * MeetFlow AI — LiveKit token endpoint.
 *
 * NEVER expose LIVEKIT_API_SECRET (or the API key) to the React frontend.
 * The browser asks this endpoint for a short-lived, scoped participant token
 * and receives only `{ serverUrl, participantToken }`.
 *
 * Env vars (loaded from .env / process environment):
 *   LIVEKIT_URL        e.g. wss://your-project.livekit.cloud
 *   LIVEKIT_API_KEY    project key
 *   LIVEKIT_API_SECRET project secret (server-side only)
 *
 * When LiveKit is not configured the endpoint responds with `mode: "demo"`
 * so the Live Meeting UI can fall back to Mock Mode without crashing.
 */

dotenv.config();

export interface LiveKitEnv {
  url: string;
  apiKey: string;
  apiSecret: string;
}

interface TokenRequestBody {
  room?: unknown;
  roomName?: unknown;
  identity?: unknown;
  participantIdentity?: unknown;
  name?: unknown;
  participantName?: unknown;
}

const ROOM_PATTERN = /^[a-zA-Z0-9_-]{3,64}$/;
const TOKEN_TTL_SECONDS = 60 * 60 * 4; // 4 hours

export function resolveLiveKitEnv(source: NodeJS.ProcessEnv = process.env): LiveKitEnv {
  return {
    url: (source.LIVEKIT_URL || '').trim(),
    apiKey: (source.LIVEKIT_API_KEY || '').trim(),
    apiSecret: (source.LIVEKIT_API_SECRET || '').trim(),
  };
}

export function isLiveKitEnvConfigured(env: LiveKitEnv): boolean {
  return Boolean(env.url && env.apiKey && env.apiSecret);
}

function sanitize(value: unknown, fallback: string, maxLength = 64): string {
  if (typeof value !== 'string') return fallback;
  const clean = value.replace(/[^a-zA-Z0-9_: .-]/g, '').trim();
  return (clean || fallback).slice(0, maxLength);
}

function randomId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Creates the /livekit/* API app. A full express instance (not a bare Router)
 * so req/res are properly augmented when mounted as middleware inside the
 * Vite dev server as well as standalone.
 */
export function createLiveKitRouter(env: LiveKitEnv): express.Express {
  const app = express();

  // Raw body capture for the LiveKit webhook route (signature validation needs
  // the exact bytes) — must be mounted BEFORE the global JSON parser.
  app.use('/livekit/recording/webhook', express.raw({ type: '*/*', limit: '2mb' }));
  app.use(express.json({ limit: '10mb' }));

  const activeRoomDispatches = new Map<string, { dispatchId: string; timestamp: number }>();

  const dispatchSttAgent = async (roomName: string) => {
    if (!isLiveKitEnvConfigured(env)) return null;

    // 1. In-memory deduplication (2 hour TTL)
    const existing = activeRoomDispatches.get(roomName);
    if (existing && Date.now() - existing.timestamp < 2 * 60 * 60 * 1000) {
      console.log(`[MeetFlow STT] Agent dispatch already active for room "${roomName}" (Dispatch ID: ${existing.dispatchId})`);
      return { id: existing.dispatchId };
    }

    const host = env.url.replace('wss://', 'https://');
    try {
      // 2. Check if agent participant is already in room
      const roomClient = new RoomServiceClient(host, env.apiKey, env.apiSecret);
      try {
        const participants = await roomClient.listParticipants(roomName);
        const hasAgent = participants.some(
          (p) =>
            p.identity === 'meetflow-stt' ||
            p.identity.startsWith('meetflow-stt') ||
            p.identity.startsWith('agent-') ||
            Boolean((p as any).isAgent)
        );
        if (hasAgent) {
          console.log(`[MeetFlow STT] meetflow-stt already active in room "${roomName}" — skipping duplicate dispatch.`);
          return { id: 'existing-participant' };
        }
      } catch {}

      // 3. Check if dispatch already exists in LiveKit Cloud
      const agentDispatch = new AgentDispatchClient(host, env.apiKey, env.apiSecret);
      try {
        const dispatches = await agentDispatch.listDispatch(roomName);
        const active = dispatches.find((d) => d.room === roomName && d.agentName === 'meetflow-stt');
        if (active) {
          activeRoomDispatches.set(roomName, { dispatchId: active.id, timestamp: Date.now() });
          console.log(`[MeetFlow STT] Found active dispatch for room "${roomName}" (Dispatch ID: ${active.id})`);
          return active;
        }
      } catch {}

      // 4. Create single deduplicated dispatch
      const dispatch = await agentDispatch.createDispatch(roomName, 'meetflow-stt');
      activeRoomDispatches.set(roomName, { dispatchId: dispatch.id, timestamp: Date.now() });
      console.log(`[MeetFlow STT] Dispatched exactly ONE STT agent to room "${roomName}" (Dispatch ID: ${dispatch.id})`);
      return dispatch;
    } catch (err: any) {
      if (err?.message?.includes('already exists') || err?.message?.includes('already dispatched')) {
        console.log(`[MeetFlow STT] Agent already dispatched to room "${roomName}"`);
      } else {
        console.warn(`[MeetFlow STT] Agent dispatch note for room "${roomName}":`, err?.message || err);
      }
      return null;
    }
  };

  const handleTokenRequest = async (req: Request, res: Response) => {
    const body: TokenRequestBody = (req.body && typeof req.body === 'object' ? req.body : {}) as TokenRequestBody;
    const rawRoom = body.roomName ?? body.room ?? req.query.roomName ?? req.query.room;
    const room = typeof rawRoom === 'string' ? rawRoom.trim() : '';

    if (!ROOM_PATTERN.test(room)) {
      res.status(400).json({
        error: 'invalid_room',
        message: 'Room name must be 3-64 characters (letters, numbers, "-" or "_").',
      });
      return;
    }

    if (!isLiveKitEnvConfigured(env)) {
      // Mock Mode: no LiveKit server configured — the frontend renders the
      // simulated meeting experience instead of connecting.
      res.status(200).json({
        mode: 'demo' as const,
        serverUrl: '',
        participantToken: '',
        room,
        reason: 'LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET are not configured on the server.',
      });
      return;
    }

    try {
      const rawIdentity = body.participantIdentity ?? body.identity;
      const rawName = body.participantName ?? body.name;
      const identity = sanitize(rawIdentity, randomId('user'), 64);
      const displayName = sanitize(rawName, identity, 64);

      const token = new AccessToken(env.apiKey, env.apiSecret, {
        identity,
        name: displayName,
        ttl: TOKEN_TTL_SECONDS,
      });
      token.addGrant({
        room,
        roomJoin: true,
        canPublish: true,
        canPublishData: true,
        canSubscribe: true,
      });

      const participantToken = await token.toJwt();

      // Ensure STT agent is dispatched to this meeting room (deduplicated)
      void dispatchSttAgent(room);

      res.status(200).json({
        mode: 'live' as const,
        serverUrl: env.url,
        participantToken,
        room,
        identity,
      });
    } catch (error) {
      res.status(500).json({
        error: 'token_error',
        message: 'Failed to mint LiveKit participant token.',
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  };

  app.post('/livekit/token', handleTokenRequest);
  app.get('/livekit/token', handleTokenRequest);

  app.get('/livekit/status', (_req: Request, res: Response) => {
    res.status(200).json({
      mode: isLiveKitEnvConfigured(env) ? ('live' as const) : ('demo' as const),
      recording: recordingConfigSummary(resolveRecordingEnv()),
    });
  });

  // ------------------------------------------------------------------
  // LiveKit Egress room recording (server-side, MP4 → S3-compatible storage)
  // ------------------------------------------------------------------

  const handleRecordingError = (res: Response, error: unknown) => {
    if (error instanceof RecordingError) {
      res.status(error.status).json({ ok: false, error: error.code, message: error.message });
    } else {
      console.error('[MeetFlow Recording] Unexpected error:', error);
      res.status(500).json({ ok: false, error: 'recording_error', message: 'Recording operation failed.' });
    }
  };

  /** POST /api/livekit/recording/start — { roomName, meetingId, meetingTitle?, requestedBy } */
  app.post('/livekit/recording/start', async (req: Request, res: Response) => {
    try {
      const body = req.body || {};
      const roomName = typeof body.roomName === 'string' ? body.roomName.trim() : '';
      const meetingId = typeof body.meetingId === 'string' ? body.meetingId.trim() : '';
      const meetingTitle = typeof body.meetingTitle === 'string' ? body.meetingTitle.slice(0, 120) : undefined;
      const requestedBy = typeof body.requestedBy === 'string' ? body.requestedBy.trim() : '';

      if (!ROOM_PATTERN.test(roomName)) {
        res.status(400).json({
          ok: false,
          error: 'invalid_room',
          message: 'roomName must be 3-64 characters (letters, numbers, "-" or "_").',
        });
        return;
      }
      if (!meetingId) {
        res.status(400).json({ ok: false, error: 'invalid_meeting', message: 'meetingId is required.' });
        return;
      }
      if (!requestedBy) {
        res.status(400).json({ ok: false, error: 'invalid_identity', message: 'requestedBy (participant identity) is required.' });
        return;
      }

      const result = await startRoomRecording({ roomName, meetingId, meetingTitle, requestedBy });
      const view = toPublicRecording(result.recording);
      res.status(200).json({
        ok: true,
        recordingId: view.id,
        egressId: view.egressId,
        status: view.status,
        startedAt: view.startedAt,
        reused: result.reused,
      });
    } catch (error) {
      handleRecordingError(res, error);
    }
  });

  /** POST /api/livekit/recording/stop — { egressId, requestedBy } */
  app.post('/livekit/recording/stop', async (req: Request, res: Response) => {
    try {
      const body = req.body || {};
      const egressId = typeof body.egressId === 'string' ? body.egressId.trim() : '';
      const requestedBy = typeof body.requestedBy === 'string' ? body.requestedBy.trim() : '';

      if (!egressId) {
        res.status(400).json({ ok: false, error: 'invalid_egress', message: 'egressId is required.' });
        return;
      }
      if (!requestedBy) {
        res.status(400).json({ ok: false, error: 'invalid_identity', message: 'requestedBy (participant identity) is required.' });
        return;
      }

      const record = await stopRoomRecording({ egressId, requestedBy });
      const view = toPublicRecording(record);
      res.status(200).json({
        ok: true,
        recordingId: view.id,
        egressId: view.egressId,
        status: view.status,
      });
    } catch (error) {
      handleRecordingError(res, error);
    }
  });

  /** GET /api/livekit/recording/status — safe configuration probe (no secrets). */
  app.get('/livekit/recording/status', (_req: Request, res: Response) => {
    res.status(200).json(recordingConfigSummary(resolveRecordingEnv()));
  });

  /** POST /api/livekit/recording/webhook — LiveKit project webhook receiver (egress lifecycle). */
  app.post('/livekit/recording/webhook', async (req: Request, res: Response) => {
    try {
      if (!isLiveKitEnvConfigured(env)) {
        res.status(503).json({ ok: false, message: 'LiveKit not configured.' });
        return;
      }
      const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf-8') : JSON.stringify(req.body || {});
      const authHeader = (req.header('Authorize') || req.header('Authorization') || '') as string;
      const receiver = new WebhookReceiver(env.apiKey, env.apiSecret);
      const event = await receiver.receive(raw, authHeader);
      handleEgressWebhookEvent(event);
      res.status(200).json({ ok: true });
    } catch (error) {
      // Never leak signature internals — just reject.
      console.warn('[MeetFlow Recording] Webhook rejected:', error instanceof Error ? error.message : error);
      res.status(401).json({ ok: false, message: 'Invalid webhook signature.' });
    }
  });

  /** GET /api/livekit/recording/:recordingId — lifecycle status (lazy reconciliation). */
  app.get('/livekit/recording/:recordingId', async (req: Request, res: Response) => {
    try {
      const record = getRecording(req.params.recordingId);
      if (!record) {
        res.status(404).json({ ok: false, error: 'recording_not_found', message: 'Recording not found.' });
        return;
      }

      // Lazy reconciliation: for non-terminal states poll LiveKit once so the
      // status reflects reality even without webhooks or an active watcher.
      if (record.status !== 'ready' && record.status !== 'failed') {
        try {
          await refreshRecordingFromEgress(record.id);
        } catch {
          // transient — return last known state
        }
      }

      const fresh = getRecording(record.id) || record;
      res.status(200).json(toPublicRecording(fresh));
    } catch (error) {
      handleRecordingError(res, error);
    }
  });

  /** GET /api/recordings — list all recordings (metadata only). */
  app.get('/recordings', (_req: Request, res: Response) => {
    res.status(200).json({ ok: true, recordings: listRecordings().map(toPublicRecording) });
  });

  /** GET /api/recordings/:id — single recording metadata. */
  app.get('/recordings/:id', (req: Request, res: Response) => {
    const record = getRecording(req.params.id);
    if (!record) {
      res.status(404).json({ ok: false, error: 'recording_not_found', message: 'Recording not found.' });
      return;
    }
    res.status(200).json(toPublicRecording(record));
  });

  // ------------------------------------------------------------------
  // Meeting Scheduling & Reminder APIs
  // ------------------------------------------------------------------
  app.get('/schedule', (_req: Request, res: Response) => {
    res.status(200).json({ ok: true, meetings: listScheduledMeetings() });
  });

  app.get('/schedule/reminders/active', (_req: Request, res: Response) => {
    res.status(200).json({ ok: true, reminders: getActiveServerReminders() });
  });

  app.get('/schedule/:id', (req: Request, res: Response) => {
    const meeting = getScheduledMeeting(req.params.id);
    if (!meeting) {
      res.status(404).json({ ok: false, error: 'not_found', message: 'Scheduled meeting not found.' });
      return;
    }
    res.status(200).json({ ok: true, meeting });
  });

  app.post('/schedule', (req: Request, res: Response) => {
    try {
      const body = req.body || {};
      if (!body.title || !body.scheduledStart) {
        res.status(400).json({ ok: false, error: 'invalid_data', message: 'Title and scheduledStart are required.' });
        return;
      }
      const saved = saveScheduledMeeting(body);
      checkAndTriggerReminders();
      res.status(201).json({ ok: true, meeting: saved });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: 'save_error', message: err?.message || 'Failed to schedule meeting.' });
    }
  });

  app.put('/schedule/:id', (req: Request, res: Response) => {
    try {
      const updated = updateScheduledMeeting(req.params.id, req.body || {});
      if (!updated) {
        res.status(404).json({ ok: false, error: 'not_found', message: 'Scheduled meeting not found.' });
        return;
      }
      checkAndTriggerReminders();
      res.status(200).json({ ok: true, meeting: updated });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: 'update_error', message: err?.message || 'Failed to update meeting.' });
    }
  });

  app.delete('/schedule/:id', (req: Request, res: Response) => {
    try {
      const cancelled = cancelScheduledMeeting(req.params.id);
      if (!cancelled) {
        res.status(404).json({ ok: false, error: 'not_found', message: 'Scheduled meeting not found.' });
        return;
      }
      res.status(200).json({ ok: true, meeting: cancelled });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: 'cancel_error', message: err?.message || 'Failed to cancel meeting.' });
    }
  });

  app.get('/stt/status', async (_req: Request, res: Response) => {
    res.status(200).json(await sttWorkerManager.getStatus());
  });

  app.post('/livekit/dispatch-agent', async (req: Request, res: Response) => {
    const body = req.body || {};
    const rawRoom = body.roomName ?? body.room;
    const room = typeof rawRoom === 'string' ? rawRoom.trim() : '';

    if (!room) {
      res.status(400).json({ error: 'missing_room', message: 'Room name required.' });
      return;
    }

    const dispatch = await dispatchSttAgent(room);
    res.status(200).json({
      ok: true,
      room,
      agentName: 'meetflow-stt',
      dispatched: Boolean(dispatch),
    });
  });

  app.post('/livekit/transcribe', async (req: Request, res: Response) => {
    try {
      const body = req.body || {};
      const audioData = typeof body.audio === 'string' ? body.audio : '';
      const mimeType = typeof body.mimeType === 'string' ? body.mimeType : 'audio/webm';
      const speaker = typeof body.speaker === 'string' ? body.speaker : 'Unknown Participant';

      if (!audioData) {
        res.status(400).json({ error: 'invalid_audio', message: 'Missing base64 audio payload.' });
        return;
      }

      const text = await transcribeAudio(audioData, mimeType);
      res.status(200).json({
        text,
        speaker,
        timestamp: new Date().toISOString(),
        sttEngine: 'livekit-gemini-stt',
      });
    } catch (error) {
      console.error('[MeetFlow STT] Transcribe error:', error);
      res.status(500).json({ error: 'stt_error', message: 'Failed to transcribe audio.' });
    }
  });

  app.get('/ai/status', (_req: Request, res: Response) => {
    // Safe status check: never exposes the API key.
    res.status(200).json({
      configured: isGeminiConfigured(),
      model: GEMINI_MODEL,
    });
  });

  app.post('/ai/analyze-segment', async (req: Request, res: Response) => {
    try {
      const body = req.body || {};
      const utterances: TranscriptUtterance[] = Array.isArray(body.utterances)
        ? body.utterances
        : body.utterance
        ? [body.utterance]
        : [];

      if (!utterances.length || !utterances.some((u) => typeof u?.text === 'string' && u.text.trim())) {
        res.status(400).json({
          error: 'invalid_input',
          message: 'Request must include "utterances" with at least one non-empty "text".',
        });
        return;
      }

      const context: SegmentAnalysisContext = body.context || {};
      const result = await analyzeTranscriptSegment(utterances, context);
      // `result.source` is "gemini" | "fallback" — the UI distinguishes real
      // Gemini results from heuristic fallback and never presents them as equal.
      res.status(200).json(result);
    } catch (error) {
      console.error('[MeetFlow] /ai/analyze-segment error:', error instanceof Error ? error.message : String(error));
      res.status(500).json({
        error: 'ai_error',
        message: 'Failed to analyze transcript segment.',
      });
    }
  });

  app.post('/ai/analyze-meeting', async (req: Request, res: Response) => {
    try {
      const body = req.body || {};
      const rawTranscript = body.transcript ?? body.fullTranscript;
      const transcript = typeof rawTranscript === 'string' ? rawTranscript : '';
      const metadata = body.metadata || {};

      if (!transcript.trim()) {
        res.status(400).json({
          error: 'invalid_input',
          message: 'Request must include a non-empty "transcript".',
        });
        return;
      }

      const result = await analyzeFullMeeting(transcript, metadata);
      res.status(200).json(result);
    } catch (error) {
      console.error('[MeetFlow] /ai/analyze-meeting error:', error instanceof Error ? error.message : String(error));
      res.status(500).json({
        error: 'ai_error',
        message: 'Failed to synthesize complete meeting.',
      });
    }
  });

  return app;
}


/** Standalone express server (npm run server) — for production on Render or containerized setups. */
export function createLiveKitServer(): express.Express {
  const app = express();
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const distPath = path.resolve(__dirname, '../dist');

  // 1. Health check endpoint (Render uses /healthz)
  app.get('/healthz', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      mode: isLiveKitEnvConfigured(resolveLiveKitEnv()) ? 'live' : 'demo',
      geminiConfigured: isGeminiConfigured(),
      timestamp: new Date().toISOString(),
    });
  });

  // 2. API Routes
  app.use('/api', createLiveKitRouter(resolveLiveKitEnv()));

  // 3. API 404 Handler - prevent unmatched /api/* from hitting SPA fallback
  app.all('/api/*', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'API route not found' });
  });

  // 4. Static assets from Vite production build
  app.use(express.static(distPath));

  // 5. React Router / SPA catch-all fallback for client-side deep links
  app.get('*', (req: Request, res: Response) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API route not found' });
    }

    const indexPath = path.join(distPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      return res.status(503).send(
        'Frontend build not found. Please run "npm run build" before starting the server.'
      );
    }

    return res.sendFile(indexPath);
  });

  return app;
}
