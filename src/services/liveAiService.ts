import type { ActionItem, Decision, TranscriptMessage } from '../types';

/**
 * MeetFlow live AI extraction layer.
 *
 * Pipeline position (see architecture):
 *   LiveKit WebRTC -> STT -> live transcript -> THIS SERVICE -> Action Items / Decisions / Discussions
 *
 * Currently powered by deterministic high-precision heuristics so the whole
 * Live Meeting demo works before Gemini/STT are wired. The public function
 * `analyzeSegment` is the single swap point for a server-side Gemini call
 * (`/api/analyze`) — UI code never changes.
 */

export interface LivePersona {
  name: string;
  role: string;
  avatar: string;
  color: string;
}

export const LIVE_PERSONAS: LivePersona[] = [
  {
    name: 'Alex Mercer',
    role: 'Product Lead',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    color: '#0284C7',
  },
  {
    name: 'Rahul Patel',
    role: 'Product Designer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    color: '#8B5CF6',
  },
  {
    name: 'Amit Shah',
    role: 'Backend Lead',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    color: '#10B981',
  },
  {
    name: 'Priya Mehta',
    role: 'Marketing Lead',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    color: '#EC4899',
  },
  {
    name: 'Jay Patel',
    role: 'Infra Lead',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80',
    color: '#F59E0B',
  },
  {
    name: 'Neha Shah',
    role: 'Frontend Lead',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
    color: '#06B6D4',
  },
];

export function getPersona(name: string): LivePersona {
  const lower = name.toLowerCase();
  return (
    LIVE_PERSONAS.find((p) => p.name.toLowerCase() === lower) ||
    LIVE_PERSONAS.find((p) => lower.includes(p.name.split(' ')[0].toLowerCase())) || {
      name,
      role: 'Teammate',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      color: '#64748B',
    }
  );
}

export interface LiveSegmentAnalysis {
  messageId: string;
  highlightEntities: TranscriptMessage['highlightEntities'];
  actionItem?: ActionItem;
  decision?: Decision;
  openDiscussion?: Decision;
}

const COMMITMENT_PATTERN =
  /\b(i'?ll|i\s+will|we'?ll|we\s+will|i\s+can|i'?m\s+going\s+to|i\s+am\s+going\s+to)\b/i;

const DECISION_PATTERN =
  /\b(we'?ve\s+decided|we\s+have\s+decided|we\s+decided|the\s+decision\s+is|it'?s\s+decided|we\s+all\s+agreed|we\s+agreed\s+to|let'?s\s+go\s+with|we'?re\s+launching|we\s+will\s+launch|approved)\b/i;

const UNCERTAIN_PATTERN =
  /\b(should\s+(we\s+)?(probably\s+)?discuss|needs?\s+further\s+discussion|need(s)?\s+to\s+be\s+discussed|open\s+question|not\s+sure\s+about|still\s+debatable|circle\s+back|revisit)\b/i;

const TASK_VERBS = [
  'finish', 'complete', 'prepare', 'implement', 'send', 'review', 'fix', 'build',
  'ship', 'run', 'draft', 'update', 'integrate', 'test', 'schedule', 'share',
  'create', 'finalize', 'deliver', 'validate', 'migrate', 'configure',
];

const DEADLINE_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /\bby\s+end\s+of\s+this\s+week\b/i, label: 'eow' },
  { pattern: /\bby\s+(next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, label: 'weekday' },
  { pattern: /\bbefore\s+(next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, label: 'weekday' },
  { pattern: /\b(next\s+monday|next\s+tuesday|next\s+wednesday|next\s+thursday|next\s+friday|next\s+saturday|next\s+sunday)\b/i, label: 'weekday' },
  { pattern: /\bend\s+of\s+(the\s+)?week\b/i, label: 'eow' },
  { pattern: /\bby\s+next\s+week\b/i, label: 'nextweek' },
  { pattern: /\b(this\s+week|by\s+tomorrow|tomorrow|eod|end\s+of\s+day)\b/i, label: 'other' },
];

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function hashString(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Next calendar occurrence of a weekday (at least tomorrow, at most +7 days). */
function nextDateForWeekday(weekday: number): Date {
  const date = new Date();
  const diff = ((weekday - date.getDay() + 7) % 7) || 7;
  date.setDate(date.getDate() + diff);
  return date;
}

function formatDeadlineDate(phrase: string): string | null {
  const lower = phrase.toLowerCase();
  const weekdayMatch = lower.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
  if (weekdayMatch) {
    const weekday = WEEKDAYS.indexOf(weekdayMatch[1].toLowerCase());
    const date = nextDateForWeekday(weekday);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  if (lower.includes('end of the week') || lower.includes('end of week') || lower.includes('end of this week')) {
    const date = nextDateForWeekday(5);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  if (lower.includes('next week')) {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  if (lower.includes('tomorrow')) {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return null;
}

function extractDeadline(text: string): { phrase: string; date: string | null } | null {
  for (const { pattern } of DEADLINE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const phrase = match[0].replace(/\s+/g, ' ').trim();
      return { phrase, date: formatDeadlineDate(phrase) };
    }
  }
  return null;
}

function extractTask(text: string): string | null {
  const lower = text.toLowerCase();
  for (const verb of TASK_VERBS) {
    const idx = lower.indexOf(verb);
    if (idx !== -1) {
      let task = text.slice(idx + verb.length).trim();
      // Cut the task at a deadline phrase or sentence end.
      const deadline = extractDeadline(task);
      if (deadline) {
        const cutIdx = task.toLowerCase().indexOf(deadline.phrase.toLowerCase());
        if (cutIdx > 0) task = task.slice(0, cutIdx).trim();
      }
      task = task.replace(/^(the|my|our|a|an|on|all)\s+/i, '').replace(/[.,!?;:]+$/, '').trim();
      if (task.length < 4) return null;
      return task.charAt(0).toUpperCase() + task.slice(1);
    }
  }
  return null;
}

function cleanQuote(text: string): string {
  return text.replace(/^["']|["']$/g, '').replace(/\s+/g, ' ').trim();
}

function titleCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

let actionSequence = 0;
let decisionSequence = 0;

/**
 * Analyzes one live transcript segment and (asynchronously) returns detected
 * entities, action items, decisions and open discussions.
 * Latency simulates a remote Gemini round-trip so the UI updates async,
 * exactly like the production pipeline.
 */
export async function analyzeSegment(
  message: TranscriptMessage,
  context: { meetingId: string; meetingTitle: string }
): Promise<LiveSegmentAnalysis> {
  // Simulated AI round-trip (swap this body for a fetch to /api/analyze).
  await new Promise((resolve) => setTimeout(resolve, 1100 + (hashString(message.text) % 1400)));

  const text = cleanQuote(message.text);
  const persona = getPersona(message.speaker);
  const highlightEntities: TranscriptMessage['highlightEntities'] = [];

  // --- Open discussion (checked first: uncertainty must never become a decision)
  if (UNCERTAIN_PATTERN.test(text)) {
    const confidence = 72 + (hashString(text) % 13); // 72-84: below auto-confirm threshold
    const discussion: Decision = {
      id: `live-dec-${++decisionSequence}`,
      meetingId: context.meetingId,
      meetingTitle: context.meetingTitle,
      text: titleCase(text),
      status: 'open',
      category: 'Unresolved Debate',
      confidence,
      timestamp: message.timestamp,
      sourceText: `${message.speaker}: "${text}"`,
      citationSpeaker: message.speaker,
      details: 'MeetFlow AI flagged this as an unresolved discussion — not classified as a confirmed decision.',
      aiSuggestion: 'Schedule a dedicated follow-up sync with the stakeholders involved.',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    highlightEntities.push({ text: text.slice(0, Math.min(48, text.length)), type: 'decision' });
    return { messageId: message.id, highlightEntities, openDiscussion: discussion };
  }

  // --- Confirmed decision
  if (DECISION_PATTERN.test(text)) {
    const confidence = 90 + (hashString(text) % 7); // 90-96
    let decisionText = text;
    const stripMatch = text.match(
      /(?:we'?ve\s+decided|we\s+have\s+decided|we\s+decided|the\s+decision\s+is|it'?s\s+decided|we\s+all\s+agreed|we\s+agreed\s+to|let'?s\s+go\s+with|we'?re\s+launching|we\s+will\s+launch|approved)\s+(?:to\s+)?(.*)$/i
    );
    if (stripMatch) decisionText = stripMatch[1];

    const deadline = extractDeadline(decisionText);
    const decision: Decision = {
      id: `live-dec-${++decisionSequence}`,
      meetingId: context.meetingId,
      meetingTitle: context.meetingTitle,
      text: titleCase(cleanQuote(decisionText).replace(/[.,!?;:]+$/, '.')),
      status: 'confirmed',
      category: 'Consensus',
      confidence,
      timestamp: message.timestamp,
      sourceText: `${message.speaker}: "${text}"`,
      citationSpeaker: message.speaker,
      details: 'Decisive language detected across the group — classified as a confirmed decision.',
      quorumStatus: 'Pending sign-off',
      targetDate: deadline?.date || undefined,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    highlightEntities.push({ text: decisionText.slice(0, Math.min(48, decisionText.length)), type: 'decision' });
    return { messageId: message.id, highlightEntities, decision };
  }

  // --- Action item (personal commitment + task + optional deadline)
  if (COMMITMENT_PATTERN.test(text)) {
    const task = extractTask(text);
    if (task) {
      const deadline = extractDeadline(text);
      const confidence = 88 + (hashString(text) % 10); // 88-97
      const highPriority = /redesign|api|payment|launch|critical|security|production/i.test(text);
      const actionItem: ActionItem = {
        id: `live-act-${++actionSequence}`,
        meetingId: context.meetingId,
        meetingTitle: context.meetingTitle,
        task,
        assignee: persona.name,
        assigneeRole: persona.role,
        assigneeAvatar: persona.avatar,
        deadline: deadline?.date || null,
        originalDeadlinePhrase: deadline?.phrase || null,
        priority: highPriority ? 'High' : 'Medium',
        confidence,
        status: 'todo',
        sourceTimestamp: message.timestamp,
        sourceText: `${message.speaker}: "${text}"`,
        detectedEntities: {
          assignee: persona.name,
          task: task.charAt(0).toLowerCase() + task.slice(1),
          deadline: deadline ? `${deadline.phrase}${deadline.date ? ` (${deadline.date})` : ''}` : undefined,
        },
        isConfirmed: false,
        createdAt: new Date().toISOString().slice(0, 10),
      };

      highlightEntities.push({ text: persona.name, type: 'assignee' });
      highlightEntities.push({
        text: task.charAt(0).toLowerCase() + task.slice(1),
        type: 'task',
      });
      if (deadline) highlightEntities.push({ text: deadline.phrase, type: 'deadline' });

      return { messageId: message.id, highlightEntities, actionItem };
    }
  }

  return { messageId: message.id, highlightEntities };
}
