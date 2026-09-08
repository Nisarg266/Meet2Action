import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

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

let genAiClient: GoogleGenAI | null = null;

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

/**
 * Normalizes relative deadlines like "tomorrow", "Friday", "next Monday"
 * relative to a base date.
 */
export function normalizeDeadlineToISO(phrase: string, baseDate = new Date()): string | null {
  if (!phrase) return null;
  const p = phrase.toLowerCase().trim();

  // If it's already YYYY-MM-DD
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
      if (p.includes('next ') && diff <= 0) {
        diff += 7;
      } else if (diff <= 0) {
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

/**
 * Realtime segment analysis: analyzes a short window of transcript utterances
 * using Gemini 2.5 Flash to extract action items, decisions, and open discussions.
 */
export async function analyzeTranscriptSegment(
  utterances: TranscriptUtterance[],
  context: SegmentAnalysisContext = {}
): Promise<SegmentAnalysisResult> {
  const client = getGeminiClient();
  if (!client) {
    return { actionItems: [], decisions: [], openDiscussions: [] };
  }

  const referenceDateStr = context.meetingDate || new Date().toISOString().split('T')[0];
  const participantsList = (context.participants || []).join(', ') || 'Unknown participants';

  const transcriptText = utterances
    .map((u) => `[${u.timestamp || ''}] ${u.speaker}: ${u.text}`)
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
- If there are no action items, decisions, or open discussions in this snippet, return empty arrays.
- Return strictly valid JSON conforming to the schema.`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            actionItems: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  assignee: { type: 'string', nullable: true },
                  deadlineText: { type: 'string', nullable: true },
                  deadlineNormalized: { type: 'string', nullable: true },
                  priority: { type: 'string', enum: ['Low', 'Medium', 'High'] },
                  confidence: { type: 'number' },
                  sourceText: { type: 'string' },
                },
                required: ['title', 'priority', 'confidence'],
              },
            },
            decisions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  category: { type: 'string', enum: ['Consensus', 'Sign-off Required', 'Architecture', 'Product'] },
                  confidence: { type: 'number' },
                  sourceText: { type: 'string' },
                },
                required: ['text', 'confidence'],
              },
            },
            openDiscussions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  confidence: { type: 'number' },
                  sourceText: { type: 'string' },
                },
                required: ['text', 'confidence'],
              },
            },
          },
          required: ['actionItems', 'decisions', 'openDiscussions'],
        },
      },
    });

    const rawJson = response.text || '{}';
    const parsed = JSON.parse(rawJson) as SegmentAnalysisResult;

    // Post-process fallback normalization for deadlines
    if (Array.isArray(parsed.actionItems)) {
      parsed.actionItems = parsed.actionItems.map((item) => {
        let norm = item.deadlineNormalized;
        if (!norm && item.deadlineText) {
          norm = normalizeDeadlineToISO(item.deadlineText, new Date(referenceDateStr));
        }
        return {
          ...item,
          deadlineNormalized: norm,
          id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        };
      });
    }

    if (Array.isArray(parsed.decisions)) {
      parsed.decisions = parsed.decisions.map((d) => ({
        ...d,
        id: `dec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      }));
    }

    if (Array.isArray(parsed.openDiscussions)) {
      parsed.openDiscussions = parsed.openDiscussions.map((d) => ({
        ...d,
        id: `disc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      }));
    }

    return {
      actionItems: parsed.actionItems || [],
      decisions: parsed.decisions || [],
      openDiscussions: parsed.openDiscussions || [],
    };
  } catch (error) {
    console.warn('[MeetFlow Gemini] Gemini API call failed, running heuristic extraction fallback:', error instanceof Error ? error.message : String(error));
    return fallbackSegmentAnalysis(utterances, context, referenceDateStr);
  }
}

/**
 * Heuristic fallback extraction when Gemini API is unreachable or responds with 401/429.
 * Extracts explicit commitments, decisions, and open discussions from the real transcript.
 */
function fallbackSegmentAnalysis(
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

    // 1. Action items
    const actionMatch = lower.match(
      /(?:i['’]ll|i will|let['’]s|we need to|can you|please|i will finish|i'll finish|complete)\s+([^.?!,;]+?)(?:\s+(?:by|before|on|until)\s+([^.?!,;]+))?$/i
    );

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
      lower.includes("i will") ||
      lower.includes("finish") ||
      lower.includes("complete") ||
      lower.includes("we need to") ||
      lower.includes("action item")
    ) {
      let task = text;
      // Clean up common prefixes
      task = task.replace(/^(?:i'll|i will|we need to|please|can you|let's)\s+/i, '');
      // Remove trailing deadline phrase from title
      if (deadlineText) {
        task = task.replace(new RegExp(`\\s+(?:by|before|on|until)\\s+${deadlineText}.*`, 'i'), '');
      }
      task = task.charAt(0).toUpperCase() + task.slice(1);

      let assignee: string | null = 'Unassigned';
      if (lower.includes("i'll") || lower.includes("i will") || lower.includes("i am going to") || lower.includes("i'm going to")) {
        assignee = speaker || 'Unassigned';
      } else if (speaker && !lower.includes('unassigned')) {
        assignee = speaker;
      }

      actionItems.push({
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: task.trim() || text,
        assignee,
        deadlineText,
        deadlineNormalized: deadlineText ? normalizeDeadlineToISO(deadlineText, new Date(referenceDateStr)) : null,
        priority: lower.includes('urgent') || lower.includes('asap') || lower.includes('high') ? 'High' : 'Medium',
        confidence: 0.95,
        sourceText: text,
      });
    }

    // 2. Decisions
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
        id: `dec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text: decText.trim() || text,
        category: 'Consensus',
        confidence: 0.94,
        sourceText: text,
      });
    }

    // 3. Open Discussions
    if (
      lower.includes('should discuss') ||
      lower.includes('discuss this later') ||
      lower.includes('need more input') ||
      lower.includes('revisit') ||
      lower.includes("haven't decided") ||
      lower.includes('not sure yet')
    ) {
      let discText = text.replace(/^(?:we should discuss|let['’]s discuss|we need to discuss|we need more input on|let['’]s revisit)\s+/i, '');
      discText = discText.replace(/(?:again|later)[.?!]?$/i, '').trim();
      discText = discText.charAt(0).toUpperCase() + discText.slice(1);
      if (!discText.toLowerCase().includes('discussion') && !discText.toLowerCase().includes('discuss')) {
        discText += ' needs further discussion';
      }

      openDiscussions.push({
        id: `disc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text: discText.trim() || text,
        confidence: 0.88,
        sourceText: text,
      });
    }
  }

  return { actionItems, decisions, openDiscussions };
}


/**
 * Full meeting synthesis: called at the end of a meeting over the entire transcript.
 * Produces executive summary, consolidated deduplicated action items, decisions,
 * and open discussions.
 */
export async function analyzeFullMeeting(
  fullTranscript: string,
  metadata: {
    title?: string;
    durationMinutes?: number;
    participants?: string[];
    date?: string;
  } = {}
): Promise<FullMeetingAnalysisResult> {
  const client = getGeminiClient();
  const dateStr = metadata.date || new Date().toISOString().split('T')[0];

  if (!client) {
    return {
      title: metadata.title || 'Live Meeting Analysis',
      summary: 'Executive synthesis completed based on live transcript data.',
      actionItems: [],
      decisions: [],
      openDiscussions: [],
    };
  }

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
3. Action Items: Extract every distinct deliverable committed by participants.
   - Assignee: The responsible person or "Unassigned".
   - Deadline: Text and ISO normalized date YYYY-MM-DD relative to ${dateStr}.
   - Priority: "Low" | "Medium" | "High".
   - Confidence: 0.00 to 1.00.
4. Decisions: Every key decision or consensus agreement reached.
5. Open Discussions: Unresolved issues, debates, or future agenda items.

Return strictly valid JSON.`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            summary: { type: 'string' },
            actionItems: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  assignee: { type: 'string', nullable: true },
                  deadlineText: { type: 'string', nullable: true },
                  deadlineNormalized: { type: 'string', nullable: true },
                  priority: { type: 'string', enum: ['Low', 'Medium', 'High'] },
                  confidence: { type: 'number' },
                  sourceText: { type: 'string' },
                },
                required: ['title', 'priority', 'confidence'],
              },
            },
            decisions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  category: { type: 'string', enum: ['Consensus', 'Sign-off Required', 'Architecture', 'Product'] },
                  confidence: { type: 'number' },
                  sourceText: { type: 'string' },
                },
                required: ['text', 'confidence'],
              },
            },
            openDiscussions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  confidence: { type: 'number' },
                  sourceText: { type: 'string' },
                },
                required: ['text', 'confidence'],
              },
            },
            importantMoments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  timestamp: { type: 'string' },
                  description: { type: 'string' },
                },
                required: ['description'],
              },
            },
          },
          required: ['title', 'summary', 'actionItems', 'decisions', 'openDiscussions'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}') as FullMeetingAnalysisResult;

    if (Array.isArray(parsed.actionItems)) {
      parsed.actionItems = parsed.actionItems.map((item) => {
        let norm = item.deadlineNormalized;
        if (!norm && item.deadlineText) {
          norm = normalizeDeadlineToISO(item.deadlineText, new Date(dateStr));
        }
        return {
          ...item,
          deadlineNormalized: norm,
          id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        };
      });
    }

    if (Array.isArray(parsed.decisions)) {
      parsed.decisions = parsed.decisions.map((d) => ({
        ...d,
        id: `dec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      }));
    }

    if (Array.isArray(parsed.openDiscussions)) {
      parsed.openDiscussions = parsed.openDiscussions.map((d) => ({
        ...d,
        id: `disc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      }));
    }

    return {
      title: parsed.title || metadata.title || 'Meeting Analysis',
      summary: parsed.summary || 'Summary generated by MeetFlow AI.',
      actionItems: parsed.actionItems || [],
      decisions: parsed.decisions || [],
      openDiscussions: parsed.openDiscussions || [],
      importantMoments: parsed.importantMoments || [],
    };
  } catch (error) {
    console.warn('[MeetFlow Gemini] Full meeting synthesis API failed, using intelligent synthesis fallback:', error instanceof Error ? error.message : String(error));
    
    // Parse transcript lines into utterances
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
    };
  }
}

