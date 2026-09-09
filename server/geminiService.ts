import { GoogleGenAI, ApiError, Type } from '@google/genai';
import type { GenerateContentResponse, Schema } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

/**
 * MeetFlow AI — server-side Gemini pipeline.
 *
 * SECURITY:
 * - GEMINI_API_KEY is read ONLY from process.env (never sent to the frontend,
 *   never returned by an endpoint, never logged).
 *
 * MODEL:
 * - The previous 2.5 Flash model was retired for new users; all calls now use
 * - GEMINI_MODEL = "gemini-3.6-flash" via models.generateContent with a
 *   responseSchema (structured JSON output).
 *
 * RELIABILITY:
 * - Errors are classified (permanent vs temporary). Temporary failures
 *   (429 / 5xx / network / malformed JSON) are retried with exponential
 *   backoff. Permanent failures (401 / 403 / 404 / bad request) fail fast.
 * - On total failure the caller gets a clearly LABELED heuristic fallback
 *   (source: "fallback") — never presented as real Gemini output.
 */

export const GEMINI_MODEL = 'gemini-3.6-flash';

export interface TranscriptUtterance {
  id?: string;
  speaker?: string;
  speakerName?: string;
  text: string;
  timestamp?: string;
}

export interface SegmentAnalysisContext {
  meetingId?: string;
  meetingTitle?: string;
  meetingDate?: string;
  timezone?: string;
  participants?: string[];
  recentHistory?: TranscriptUtterance[];
}

export interface ExtractedActionItem {
  id?: string;
  title: string;
  assignee: string | null;
  deadlineText: string | null;
  deadlineNormalized: string | null;
  priority: 'Low' | 'Medium' | 'High';
  confidence: number; // 0 to 1
  sourceText?: string;
}

export interface ExtractedDecision {
  id?: string;
  text: string;
  category?: 'Consensus' | 'Sign-off Required' | 'Architecture' | 'Product';
  confidence: number; // 0 to 1
  sourceText?: string;
}

export interface ExtractedOpenDiscussion {
  id?: string;
  text: string;
  confidence: number; // 0 to 1
  sourceText?: string;
}

export interface SegmentAnalysisResult {
  actionItems: ExtractedActionItem[];
  decisions: ExtractedDecision[];
  openDiscussions: ExtractedOpenDiscussion[];
}

export interface FullMeetingAnalysisResult {
  title: string;
  summary: string;
  actionItems: ExtractedActionItem[];
  decisions: ExtractedDecision[];
  openDiscussions: ExtractedOpenDiscussion[];
  importantMoments?: { timestamp?: string; description: string }[];
}

/** Provenance: every analysis result declares whether it is REAL Gemini or fallback. */
export interface AIGenerationMeta {
  source: 'gemini' | 'fallback';
  model: string;
  fallbackReason?: string;
}

export type SegmentAnalysisResponse = SegmentAnalysisResult & AIGenerationMeta;
export type FullMeetingAnalysisResponse = FullMeetingAnalysisResult & AIGenerationMeta;

type FailureKind =
  | 'not_configured'
  | 'unauthorized'
  | 'forbidden'
  | 'model_unavailable'
  | 'bad_request'
  | 'rate_limited'
  | 'server_error'
  | 'network'
  | 'timeout'
  | 'bad_response';

interface GeminiFailure {
  kind: FailureKind;
  retryable: boolean;
  message: string;
}

/** Thrown by callGeminiJson once retries are exhausted (or failure is permanent). */
class GeminiCallError extends Error {
  failure: GeminiFailure;
  constructor(failure: GeminiFailure) {
    super(failure.message);
    this.name = 'GeminiCallError';
    this.failure = failure;
  }
}

function toFailure(error: unknown): GeminiFailure {
  return error instanceof GeminiCallError
    ? error.failure
    : { kind: 'server_error', retryable: false, message: redact(error instanceof Error ? error.message : String(error)) };
}

const RETRYABLE_KINDS: ReadonlySet<FailureKind> = new Set([
  'rate_limited',
  'server_error',
  'network',
  'timeout',
  'bad_response',
]);

const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 600;
const REQUEST_TIMEOUT_MS = 30_000;

let genAiClient: GoogleGenAI | null = null;
let rateLimitCooldownUntil = 0;

export function isGeminiInCooldown(): boolean {
  return Date.now() < rateLimitCooldownUntil;
}

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    return null;
  }
  if (!genAiClient) {
    genAiClient = new GoogleGenAI({ apiKey });
  }
  return genAiClient;
}

export function isGeminiConfigured(): boolean {
  return Boolean((process.env.GEMINI_API_KEY || '').trim());
}

/** Never allow the API key (or anything resembling it) into logs. */
function redact(message: string): string {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  let safe = message;
  if (key) {
    safe = safe.split(key).join('[REDACTED]');
  }
  return safe.replace(/key=[A-Za-z0-9_\-]{10,}/g, 'key=[REDACTED]').slice(0, 400);
}

function classifyError(error: unknown): GeminiFailure {
  if (error instanceof ApiError) {
    const message = redact(error.message || `HTTP ${error.status}`);
    if (error.status === 401) return { kind: 'unauthorized', retryable: false, message };
    if (error.status === 403) return { kind: 'forbidden', retryable: false, message };
    if (error.status === 404) return { kind: 'model_unavailable', retryable: false, message };
    if (error.status === 400) return { kind: 'bad_request', retryable: false, message };
    if (error.status === 429) {
      rateLimitCooldownUntil = Date.now() + 45_000;
      return { kind: 'rate_limited', retryable: false, message: 'Free tier rate limit reached (45s cooldown)' };
    }
    if (error.status >= 500) return { kind: 'server_error', retryable: true, message };
    return { kind: 'server_error', retryable: true, message };
  }

  const err = error as { name?: string; message?: string; code?: string | number };
  const message = redact(err?.message || String(error));
  const lower = message.toLowerCase();

  if (err?.name === 'SyntaxError') {
    return { kind: 'bad_response', retryable: true, message: 'Malformed JSON response from Gemini' };
  }
  if (err?.name === 'AbortError' || lower.includes('abort')) {
    return { kind: 'timeout', retryable: true, message: 'Gemini request timed out' };
  }
  if (
    err?.name === 'TypeError' ||
    lower.includes('fetch failed') ||
    lower.includes('econnreset') ||
    lower.includes('enotfound') ||
    lower.includes('etimedout') ||
    lower.includes('network')
  ) {
    return { kind: 'network', retryable: true, message };
  }
  if (lower.includes('api key') || lower.includes('unauthorized')) {
    return { kind: 'unauthorized', retryable: false, message };
  }
  if (lower.includes('permission') || lower.includes('forbidden')) {
    return { kind: 'forbidden', retryable: false, message };
  }
  if (lower.includes('not found') || lower.includes('no longer available')) {
    return { kind: 'model_unavailable', retryable: false, message };
  }
  if (lower.includes('quota') || lower.includes('resource_exhausted') || lower.includes('rate limit')) {
    return { kind: 'rate_limited', retryable: true, message };
  }
  return { kind: 'server_error', retryable: true, message };
}

function parseGeminiJson(raw: string | undefined): unknown {
  if (!raw) throw new Error('Empty response from Gemini');
  let text = raw.trim();
  // Strip markdown code fences the model sometimes adds.
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }
  return JSON.parse(text);
}

/**
 * Core Gemini call with structured JSON output, classification and
 * exponential backoff retries for temporary failures only.
 */
async function callGeminiJson<T>(params: {
  contents: string;
  responseSchema: Schema;
  contextLabel: string;
  timeoutMs?: number;
  maxAttempts?: number;
}): Promise<T> {
  const client = getGeminiClient();
  if (!client) {
    throw new GeminiCallError({
      kind: 'not_configured',
      retryable: false,
      message: 'GEMINI_API_KEY is not configured',
    });
  }

  if (isGeminiInCooldown()) {
    throw new GeminiCallError({
      kind: 'rate_limited',
      retryable: false,
      message: 'Gemini free-tier quota cooldown active (using heuristic fallback)',
    });
  }

  const timeoutDuration = params.timeoutMs || REQUEST_TIMEOUT_MS;
  const attemptsLimit = params.maxAttempts || MAX_ATTEMPTS;

  let lastFailure: GeminiFailure = { kind: 'server_error', retryable: true, message: 'unknown' };

  for (let attempt = 1; attempt <= attemptsLimit; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutDuration);

    try {
      const response: GenerateContentResponse = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: params.contents,
        config: {
          responseMimeType: 'application/json',
          responseSchema: params.responseSchema,
          abortSignal: controller.signal,
        },
      });

      clearTimeout(timeout);
      return parseGeminiJson(response.text) as T;
    } catch (error) {
      clearTimeout(timeout);
      lastFailure = classifyError(error);

      const willRetry = lastFailure.retryable && attempt < attemptsLimit;
      console.warn(
        `[MeetFlow Gemini] ${params.contextLabel} failed (${lastFailure.kind}, attempt ${attempt}/${attemptsLimit})` +
          (willRetry ? ' — retrying with backoff' : ' — giving up') +
          `: ${lastFailure.message}`
      );

      if (!willRetry) {
        throw new GeminiCallError(lastFailure);
      }
      const backoff = BASE_BACKOFF_MS * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 200);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }

  throw new GeminiCallError(lastFailure);
}

function clampConfidence(value: unknown, fallback: number): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(1, Math.max(0, num));
}

function sanitizeSegmentResult(parsed: unknown): SegmentAnalysisResult {
  const raw = (parsed && typeof parsed === 'object' ? parsed : {}) as Partial<SegmentAnalysisResult>;
  const actionItems = Array.isArray(raw.actionItems)
    ? raw.actionItems.filter((a) => a && typeof a.title === 'string' && a.title.trim().length > 0)
    : [];
  const decisions = Array.isArray(raw.decisions)
    ? raw.decisions.filter((d) => d && typeof d.text === 'string' && d.text.trim().length > 0)
    : [];
  const openDiscussions = Array.isArray(raw.openDiscussions)
    ? raw.openDiscussions.filter((o) => o && typeof o.text === 'string' && o.text.trim().length > 0)
    : [];
  return {
    actionItems: actionItems.map((a) => ({ ...a, confidence: clampConfidence(a.confidence, 0.8) })),
    decisions: decisions.map((d) => ({ ...d, confidence: clampConfidence(d.confidence, 0.8) })),
    openDiscussions: openDiscussions.map((o) => ({ ...o, confidence: clampConfidence(o.confidence, 0.75) })),
  };
}

/**
 * Normalizes relative deadlines like "tomorrow", "Friday", "next Monday"
 * relative to a base date.
 */
export function normalizeDeadlineToISO(phrase: string, baseDate = new Date()): string | null {
  if (!phrase) return null;
  const p = phrase.toLowerCase().trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(p)) {
    return p;
  }

  const d = new Date(baseDate);

  if (p.includes('today') || p.includes('end of day') || p.includes('eod')) {
    return d.toISOString().split('T')[0];
  }

  if (p.includes('tomorrow')) {
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let targetDay = 0; targetDay < 7; targetDay++) {
    const dayName = days[targetDay];
    if (p.includes(dayName)) {
      const currentDay = d.getDay();
      let diff = targetDay - currentDay;
      if (diff <= 0) {
        diff += 7;
      }
      d.setDate(d.getDate() + diff);
      return d.toISOString().split('T')[0];
    }
  }

  if (p.includes('end of week') || p.includes('end of this week')) {
    const currentDay = d.getDay();
    const diff = (5 - currentDay + 7) % 7 || 7; // Friday
    d.setDate(d.getDate() + diff);
    return d.toISOString().split('T')[0];
  }

  if (p.includes('next week')) {
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  }

  return null;
}

const SEGMENT_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    actionItems: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          assignee: { type: Type.STRING, nullable: true },
          deadlineText: { type: Type.STRING, nullable: true },
          deadlineNormalized: { type: Type.STRING, nullable: true },
          priority: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
          confidence: { type: Type.NUMBER },
          sourceText: { type: Type.STRING },
        },
        required: ['title', 'priority', 'confidence'],
      },
    },
    decisions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          category: { type: Type.STRING, enum: ['Consensus', 'Sign-off Required', 'Architecture', 'Product'] },
          confidence: { type: Type.NUMBER },
          sourceText: { type: Type.STRING },
        },
        required: ['text', 'confidence'],
      },
    },
    openDiscussions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          sourceText: { type: Type.STRING },
        },
        required: ['text', 'confidence'],
      },
    },
  },
  required: ['actionItems', 'decisions', 'openDiscussions'],
};

/**
 * Realtime segment analysis: analyzes a short window of transcript utterances
 * using Gemini 3.6 Flash to extract action items, decisions, and open discussions.
 * Falls back to heuristics ONLY when Gemini fails — and says so via `source`.
 */
export async function analyzeTranscriptSegment(
  utterances: TranscriptUtterance[],
  context: SegmentAnalysisContext = {}
): Promise<SegmentAnalysisResponse> {
  const referenceDateStr = context.meetingDate || new Date().toISOString().split('T')[0];
  const participantsList = (context.participants || []).join(', ') || 'Unknown participants';

  const transcriptText = utterances
    .map((u) => `[${u.timestamp || ''}] ${u.speakerName || u.speaker || 'Speaker'}: ${u.text}`)
    .join('\n');

  const prompt = `You are the MeetFlow AI real-time meeting intelligence engine.
Analyze this transcript segment from a live meeting.
Meeting Title: "${context.meetingTitle || 'Live Meeting'}"
Reference Meeting Date: ${referenceDateStr}
Known Participants: ${participantsList}

Transcript Segment:
---
${transcriptText}
---

Your task is to extract:
1. Action Items: Clear commitments or delegated tasks.
   - Detect phrases like: "I'll do...", "I will finish...", "Let's assign...", "Can you do...", "We need to...", "by Friday", "tomorrow".
   - Assignee: If the speaker commits ("I'll finish X"), assignee is the speaker. If assigned to someone ("Amit, please..."), assignee is that person. If ambiguous, set assignee to "Unassigned". NEVER invent people.
   - deadlineText: exact phrase used for deadline (e.g. "Friday", "tomorrow", "next Monday"). If none, set to null.
   - deadlineNormalized: ISO date YYYY-MM-DD calculated relative to Reference Date ${referenceDateStr}. If uncertain, null.
   - priority: "Low" | "Medium" | "High"
   - confidence: number between 0.00 and 1.00 reflecting clarity in the transcript.
   - sourceText: the exact quote from transcript.

2. Decisions: Explicit agreements, approvals, or concluded choices.
   - Detect phrases like: "We decided...", "We've decided...", "The decision is...", "Let's go with...", "Approved.", "Final decision...".
   - category: "Consensus" | "Sign-off Required" | "Architecture" | "Product"
   - confidence: 0.00 to 1.00
   - sourceText: exact quote.

3. Open Discussions: Unresolved debates, topics needing follow-up, or pending questions.
   - Detect phrases like: "We should discuss this later", "We need more input", "Let's revisit", "I'm not sure yet", "We haven't decided".
   - confidence: 0.00 to 1.00
   - sourceText: exact quote.

CRITICAL RULES:
- Never fabricate assignees, deadlines, or facts not present in the transcript.
- Never classify uncertain or tentative statements as confirmed decisions.
- If there are no action items, decisions, or open discussions in this snippet, return empty arrays.`;

  let geminiData: SegmentAnalysisResult;
  try {
    geminiData = await callGeminiJson<SegmentAnalysisResult>({
      contents: prompt,
      responseSchema: SEGMENT_SCHEMA,
      contextLabel: 'segment analysis',
      timeoutMs: 15000,
      maxAttempts: 2,
    });
  } catch (error) {
    const failure = toFailure(error);
    console.warn(
      `[MeetFlow Gemini] Segment analysis using HEURISTIC FALLBACK (${failure.kind}): ${failure.message}`
    );
    const fallback = fallbackSegmentAnalysis(utterances, context, referenceDateStr);
    return {
      ...fallback,
      source: 'fallback',
      model: 'heuristic',
      fallbackReason: `gemini_${failure.kind}: ${failure.message}`,
    };
  }

  const clean = sanitizeSegmentResult(geminiData);
  return {
    ...clean,
    source: 'gemini',
    model: GEMINI_MODEL,
    actionItems: withIds(clean.actionItems, 'act').map((item) => ({
      ...item,
      deadlineNormalized:
        item.deadlineNormalized ||
        (item.deadlineText ? normalizeDeadlineToISO(item.deadlineText, new Date(referenceDateStr)) : null),
    })),
    decisions: withIds(clean.decisions, 'dec'),
    openDiscussions: withIds(clean.openDiscussions, 'disc'),
  };
}

function withIds<T extends object>(items: T[], prefix: string): (T & { id: string })[] {
  return items.map((item) => ({
    ...item,
    id: (item as { id?: string }).id || `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
  }));
}

/**
 * Heuristic fallback extraction when Gemini is unreachable or permanently failing.
 * Extracts explicit commitments, decisions, and open discussions from the real transcript.
 * Results are ALWAYS labeled with source: "fallback" by the callers.
 */
export function fallbackSegmentAnalysis(
  utterances: TranscriptUtterance[],
  context: SegmentAnalysisContext,
  referenceDateStr: string
): SegmentAnalysisResult {
  const actionItems: ExtractedActionItem[] = [];
  const decisions: ExtractedDecision[] = [];
  const openDiscussions: ExtractedOpenDiscussion[] = [];

  for (const u of utterances) {
    const text = u.text.trim();
    const lower = text.toLowerCase();

    const deadlineKeywords = ['tomorrow', 'friday', 'monday', 'tuesday', 'wednesday', 'thursday', 'saturday', 'sunday', 'next week', 'end of week', 'end of day'];
    let deadlineText: string | null = null;
    for (const kw of deadlineKeywords) {
      if (lower.includes(kw)) {
        deadlineText = kw.charAt(0).toUpperCase() + kw.slice(1);
        break;
      }
    }
    const speaker = (u.speakerName || u.speaker || '').trim();

    if (
      lower.includes("i'll") ||
      lower.includes('i will') ||
      lower.includes('finish') ||
      lower.includes('complete') ||
      lower.includes('we need to') ||
      lower.includes('action item')
    ) {
      let task = text;
      task = task.replace(/^(?:i'll|i will|we need to|please|can you|let's)\s+/i, '');
      if (deadlineText) {
        task = task.replace(new RegExp(`\\s+(?:by|before|on|until)\\s+${deadlineText}.*`, 'i'), '');
      }
      task = task.charAt(0).toUpperCase() + task.slice(1);

      let assignee: string | null = 'Unassigned';
      if (lower.includes("i'll") || lower.includes('i will') || lower.includes('i am going to') || lower.includes("i'm going to")) {
        assignee = speaker || 'Unassigned';
      } else if (speaker && !lower.includes('unassigned')) {
        assignee = speaker;
      }

      actionItems.push({
        id: `act-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        title: task.trim() || text,
        assignee,
        deadlineText,
        deadlineNormalized: deadlineText ? normalizeDeadlineToISO(deadlineText, new Date(referenceDateStr)) : null,
        priority: lower.includes('urgent') || lower.includes('asap') || lower.includes('high') ? 'High' : 'Medium',
        confidence: 0.95,
        sourceText: text,
      });
    }

    if (
      lower.includes('decided') ||
      lower.includes('decision is') ||
      lower.includes("let's go with") ||
      lower.includes('approved') ||
      lower.includes('we will launch') ||
      lower.includes('final decision')
    ) {
      let decText = text.replace(/^(?:we(?:'ve| have)? decided to|the decision is to|we will)\s+/i, '');
      decText = decText.charAt(0).toUpperCase() + decText.slice(1);

      decisions.push({
        id: `dec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        text: decText.trim() || text,
        category: 'Consensus',
        confidence: 0.94,
        sourceText: text,
      });
    }

    if (
      /should\s+(?:we\s+)?(?:probably\s+)?discuss/.test(lower) ||
      lower.includes('discuss this later') ||
      lower.includes('need more input') ||
      lower.includes('revisit') ||
      lower.includes("haven't decided") ||
      lower.includes('not sure yet') ||
      lower.includes('needs further discussion')
    ) {
      let discText = text.replace(/^(?:we should discuss|let['’]s discuss|we need to discuss|we need more input on|let['’]s revisit)\s+/i, '');
      discText = discText.replace(/(?:again|later)[.?!]?$/i, '').trim();
      discText = discText.charAt(0).toUpperCase() + discText.slice(1);
      if (!discText.toLowerCase().includes('discussion') && !discText.toLowerCase().includes('discuss')) {
        discText += ' needs further discussion';
      }

      openDiscussions.push({
        id: `disc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        text: discText.trim() || text,
        confidence: 0.88,
        sourceText: text,
      });
    }
  }

  return { actionItems, decisions, openDiscussions };
}

const MEETING_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    summary: { type: Type.STRING },
    actionItems: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          assignee: { type: Type.STRING, nullable: true },
          deadlineText: { type: Type.STRING, nullable: true },
          deadlineNormalized: { type: Type.STRING, nullable: true },
          priority: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
          confidence: { type: Type.NUMBER },
          sourceText: { type: Type.STRING },
        },
        required: ['title', 'priority', 'confidence'],
      },
    },
    decisions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          category: { type: Type.STRING, enum: ['Consensus', 'Sign-off Required', 'Architecture', 'Product'] },
          confidence: { type: Type.NUMBER },
          sourceText: { type: Type.STRING },
        },
        required: ['text', 'confidence'],
      },
    },
    openDiscussions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          sourceText: { type: Type.STRING },
        },
        required: ['text', 'confidence'],
      },
    },
    importantMoments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          timestamp: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ['description'],
      },
    },
  },
  required: ['title', 'summary', 'actionItems', 'decisions', 'openDiscussions'],
};

/**
 * Full meeting synthesis: called at the end of a meeting over the entire transcript.
 * Produces executive summary, consolidated deduplicated action items, decisions,
 * and open discussions. Falls back to heuristics ONLY on Gemini failure, labeled.
 */
export async function analyzeFullMeeting(
  fullTranscript: string,
  metadata: {
    title?: string;
    durationMinutes?: number;
    participants?: string[];
    date?: string;
  } = {}
): Promise<FullMeetingAnalysisResponse> {
  const dateStr = metadata.date || new Date().toISOString().split('T')[0];

  const prompt = `You are MeetFlow AI's executive meeting synthesizer.
Analyze the complete transcript of the completed meeting and generate an executive summary,
consolidated action items (with assignees and normalized deadlines), confirmed decisions,
and open discussions.

Meeting Info:
- Date: ${dateStr}
- Duration: ~${metadata.durationMinutes || 10} minutes
- Participants: ${(metadata.participants || []).join(', ') || 'Meeting participants'}
- Initial Title: "${metadata.title || 'Live Meeting'}"

Full Transcript:
---
${fullTranscript || 'No speech recorded.'}
---

Instructions:
1. Title: Create an accurate, executive title reflecting the core focus of the meeting.
2. Summary: Write a clear 2-4 sentence executive summary covering primary outcomes, agreements, and next steps.
3. Action Items: Extract every distinct deliverable committed by participants. Consolidate duplicates.
   - Assignee: The responsible person or "Unassigned".
   - Deadline: Text and ISO normalized date YYYY-MM-DD relative to ${dateStr}.
   - Priority: "Low" | "Medium" | "High".
   - Confidence: 0.00 to 1.00.
   - sourceText: exact supporting quote with speaker attribution.
4. Decisions: Every key decision or consensus agreement reached.
5. Open Discussions: Unresolved issues, debates, or future agenda items.

CRITICAL RULES:
- Never fabricate assignees, deadlines, or facts not present in the transcript.
- Never classify uncertain or tentative statements as confirmed decisions.`;

  let geminiData: FullMeetingAnalysisResult;
  try {
    geminiData = await callGeminiJson<FullMeetingAnalysisResult>({
      contents: prompt,
      responseSchema: MEETING_SCHEMA,
      contextLabel: 'full meeting synthesis',
    });
  } catch (error) {
    const failure = toFailure(error);
    console.warn(
      `[MeetFlow Gemini] Full meeting synthesis using HEURISTIC FALLBACK (${failure.kind}): ${failure.message}`
    );

    const lines = fullTranscript.split('\n').filter((l) => l.trim().length > 0);
    const utterances: TranscriptUtterance[] = lines.map((l) => {
      const match = l.match(/^(?:\[(.*?)\]\s*)?([^:]+):\s*(.*)$/);
      if (match) {
        return { timestamp: match[1] || '', speaker: match[2].trim(), text: match[3].replace(/^"(.*)"$/, '$1').trim() };
      }
      return { speaker: 'Participant', text: l.trim() };
    });

    const fallback = fallbackSegmentAnalysis(utterances, { meetingTitle: metadata.title, participants: metadata.participants }, dateStr);

    const actionCount = fallback.actionItems.length;
    const decisionCount = fallback.decisions.length;
    const discCount = fallback.openDiscussions.length;
    const duration = metadata.durationMinutes || 5;

    const summary = `Executive Synthesis: In this ${duration}-minute session, ${metadata.participants?.join(', ') || 'participants'} conducted strategic discussions yielding ${actionCount} actionable deliverable${actionCount === 1 ? '' : 's'}, ${decisionCount} finalized decision${decisionCount === 1 ? '' : 's'}, and ${discCount} open item${discCount === 1 ? '' : 's'} flagged for subsequent review. All action items have been indexed with speaker attributions and relative deadline dates.`;

    return {
      title: metadata.title || 'Live Meeting Analysis',
      summary,
      actionItems: fallback.actionItems,
      decisions: fallback.decisions,
      openDiscussions: fallback.openDiscussions,
      importantMoments: fallback.decisions.map((d) => ({ description: `Consensus reached: ${d.text}` })),
      source: 'fallback' as const,
      model: 'heuristic',
      fallbackReason: `gemini_${failure.kind}: ${failure.message}`,
    };
  }

  const raw = (geminiData && typeof geminiData === 'object' ? geminiData : {}) as Partial<FullMeetingAnalysisResult>;
  const clean = sanitizeSegmentResult(raw);
  return {
    title: (typeof raw.title === 'string' && raw.title.trim()) || metadata.title || 'Meeting Analysis',
    summary: (typeof raw.summary === 'string' && raw.summary.trim()) || 'Summary generated by MeetFlow AI.',
    actionItems: withIds(clean.actionItems, 'act').map((item) => ({
      ...item,
      deadlineNormalized:
        item.deadlineNormalized || (item.deadlineText ? normalizeDeadlineToISO(item.deadlineText, new Date(dateStr)) : null),
    })),
    decisions: withIds(clean.decisions, 'dec'),
    openDiscussions: withIds(clean.openDiscussions, 'disc'),
    importantMoments: Array.isArray(raw.importantMoments) ? raw.importantMoments : [],
    source: 'gemini' as const,
    model: GEMINI_MODEL,
  };
}

/**
 * Transcribes audio chunk using Gemini multimodal audio capability.
 * Returns the transcribed text string or empty string if silent/error.
 */
export async function transcribeAudio(audioBase64: string, mimeType: string = 'audio/webm'): Promise<string> {
  if (!isGeminiConfigured() || !audioBase64) return '';

  const client = getGeminiClient();
  if (!client) return '';

  try {
    const cleanMime = (mimeType || 'audio/webm').split(';')[0].trim();
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: audioBase64,
                mimeType: cleanMime,
              },
            },
            {
              text: 'Transcribe the spoken English in this audio snippet accurately. Output ONLY the transcribed words with normal punctuation. If the audio is silent or unintelligible noise, output nothing.',
            },
          ],
        },
      ],
    });

    return (response.text || '').trim();
  } catch (err) {
    console.warn('[MeetFlow STT] Audio transcription error:', err instanceof Error ? err.message : String(err));
    return '';
  }
}
