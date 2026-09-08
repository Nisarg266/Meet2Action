import { create } from 'zustand';
import type { ActionItem, Decision, LiveMeeting, TranscriptMessage } from '../types';

export type LivePhase = 'idle' | 'connecting' | 'live' | 'ending' | 'ended';
export type LiveMode = 'live' | 'demo';
export type LiveConnectionState = 'connected' | 'reconnecting' | 'disconnected' | 'demo';
export type InsightTab = 'transcript' | 'actions' | 'decisions' | 'discussions';
export type AiStatus = 'listening' | 'analyzing' | 'idle' | 'error';
/** Provenance of AI detections: real Gemini vs heuristic fallback. */
export type AiSource = 'gemini' | 'fallback' | null;

export interface EnrichmentPayload {
  highlightEntities?: TranscriptMessage['highlightEntities'];
  associatedActionItemId?: string;
  associatedDecisionId?: string;
}

interface LiveMeetingState {
  phase: LivePhase;
  mode: LiveMode;
  connection: LiveConnectionState;
  meeting: LiveMeeting;
  elapsedSeconds: number;
  aiStatus: AiStatus;
  aiSource: AiSource;
  activeTab: InsightTab;
  unread: Record<InsightTab, number>;
  isMicOn: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  localName: string;
  localIdentity: string;
  /** Names currently present in the room (mock personas and/or LiveKit identities). */
  roster: string[];

  startMeeting: (opts: { roomName: string; title: string; identity: string; name: string }) => void;
  setPhase: (phase: LivePhase) => void;
  setMode: (mode: LiveMode) => void;
  setConnection: (connection: LiveConnectionState) => void;
  tick: () => void;
  setElapsed: (seconds: number) => void;
  setAiStatus: (status: AiStatus) => void;
  setAiSource: (source: AiSource) => void;
  setActiveTab: (tab: InsightTab) => void;
  setMic: (on: boolean) => void;
  setCamera: (on: boolean) => void;
  setScreenSharing: (on: boolean) => void;
  setRoster: (names: string[]) => void;

  addTranscriptMessage: (message: TranscriptMessage) => void;
  enrichTranscriptMessage: (messageId: string, payload: EnrichmentPayload) => void;
  addParticipant: (name: string) => void;

  upsertActionItem: (item: ActionItem) => void;
  upsertDecision: (decision: Decision) => void;
  confirmLiveAction: (id: string) => void;
  dismissLiveAction: (id: string) => void;
  editLiveAction: (id: string, updates: Partial<ActionItem>) => void;
  confirmLiveDecision: (id: string) => void;
  dismissLiveDecision: (id: string) => void;

  resetLiveMeeting: () => void;
}

const emptyMeeting: LiveMeeting = {
  id: '',
  roomName: '',
  title: 'Live Meeting',
  startedAt: new Date().toISOString(),
  participants: [],
  transcript: [],
  actionItems: [],
  decisions: [],
};

const noUnread: Record<InsightTab, number> = {
  transcript: 0,
  actions: 0,
  decisions: 0,
  discussions: 0,
};

export const useLiveMeetingStore = create<LiveMeetingState>((set) => ({
  phase: 'idle',
  mode: 'demo',
  connection: 'disconnected',
  meeting: emptyMeeting,
  elapsedSeconds: 0,
  aiStatus: 'listening',
  aiSource: null,
  activeTab: 'transcript',
  unread: noUnread,
  isMicOn: true,
  isCameraOn: true,
  isScreenSharing: false,
  localName: 'Alex Mercer',
  localIdentity: '',
  roster: [],

  startMeeting: ({ roomName, title, identity, name }) =>
    set({
      phase: 'connecting',
      meeting: {
        id: `live-${Date.now().toString(36)}`,
        roomName,
        title,
        startedAt: new Date().toISOString(),
        participants: [name],
        transcript: [],
        actionItems: [],
        decisions: [],
      },
      elapsedSeconds: 0,
      aiStatus: 'listening',
      aiSource: null,
      activeTab: 'transcript',
      unread: noUnread,
      isMicOn: true,
      isCameraOn: true,
      isScreenSharing: false,
      localName: name,
      localIdentity: identity,
      roster: [name],
    }),

  setPhase: (phase) => set({ phase }),
  setMode: (mode) => set({ mode }),
  setConnection: (connection) => set({ connection }),
  setElapsed: (elapsedSeconds) => set({ elapsedSeconds }),
  setAiStatus: (aiStatus) => set({ aiStatus }),
  setAiSource: (aiSource) => set({ aiSource }),

  tick: () => set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 })),

  setActiveTab: (activeTab) =>
    set((s) => ({ activeTab, unread: { ...s.unread, [activeTab]: 0 } })),

  setMic: (isMicOn) => set({ isMicOn }),
  setCamera: (isCameraOn) => set({ isCameraOn }),
  setScreenSharing: (isScreenSharing) => set({ isScreenSharing }),
  setRoster: (roster) => set({ roster }),

  addTranscriptMessage: (message) =>
    set((s) => ({
      meeting: { ...s.meeting, transcript: [...s.meeting.transcript, message] },
      unread:
        s.activeTab === 'transcript'
          ? s.unread
          : { ...s.unread, transcript: s.unread.transcript + 1 },
    })),

  enrichTranscriptMessage: (messageId, payload) =>
    set((s) => ({
      meeting: {
        ...s.meeting,
        transcript: s.meeting.transcript.map((m) =>
          m.id === messageId
            ? {
                ...m,
                highlightEntities: payload.highlightEntities || m.highlightEntities,
                associatedActionItemId: payload.associatedActionItemId ?? m.associatedActionItemId,
                associatedDecisionId: payload.associatedDecisionId ?? m.associatedDecisionId,
              }
            : m
        ),
      },
    })),

  addParticipant: (name) =>
    set((s) =>
      s.meeting.participants.includes(name)
        ? s
        : { meeting: { ...s.meeting, participants: [...s.meeting.participants, name] } }
    ),

  upsertActionItem: (item) =>
    set((s) => {
      const exists = s.meeting.actionItems.some((a) => a.id === item.id);
      return {
        meeting: {
          ...s.meeting,
          actionItems: exists
            ? s.meeting.actionItems.map((a) => (a.id === item.id ? item : a))
            : [...s.meeting.actionItems, item],
        },
        unread:
          s.activeTab === 'actions' ? s.unread : { ...s.unread, actions: s.unread.actions + 1 },
      };
    }),

  upsertDecision: (decision) =>
    set((s) => {
      const exists = s.meeting.decisions.some((d) => d.id === decision.id);
      const isDiscussion = decision.status === 'open';
      return {
        meeting: {
          ...s.meeting,
          decisions: exists
            ? s.meeting.decisions.map((d) => (d.id === decision.id ? decision : d))
            : [...s.meeting.decisions, decision],
        },
        unread: isDiscussion
          ? s.activeTab === 'discussions'
            ? s.unread
            : { ...s.unread, discussions: s.unread.discussions + 1 }
          : s.activeTab === 'decisions'
            ? s.unread
            : { ...s.unread, decisions: s.unread.decisions + 1 },
      };
    }),

  confirmLiveAction: (id) =>
    set((s) => ({
      meeting: {
        ...s.meeting,
        actionItems: s.meeting.actionItems.map((a) =>
          a.id === id ? { ...a, isConfirmed: true, confidence: Math.max(a.confidence, 96) } : a
        ),
      },
    })),

  dismissLiveAction: (id) =>
    set((s) => ({
      meeting: {
        ...s.meeting,
        actionItems: s.meeting.actionItems.filter((a) => a.id !== id),
        transcript: s.meeting.transcript.map((m) =>
          m.associatedActionItemId === id ? { ...m, associatedActionItemId: undefined } : m
        ),
      },
    })),

  editLiveAction: (id, updates) =>
    set((s) => ({
      meeting: {
        ...s.meeting,
        actionItems: s.meeting.actionItems.map((a) =>
          a.id === id ? { ...a, ...updates, isConfirmed: true } : a
        ),
      },
    })),

  confirmLiveDecision: (id) =>
    set((s) => ({
      meeting: {
        ...s.meeting,
        decisions: s.meeting.decisions.map((d) =>
          d.id === id
            ? {
                ...d,
                status: 'confirmed' as const,
                category: 'Consensus' as const,
                confidence: Math.max(d.confidence, 95),
                quorumStatus: '100% Consensus',
              }
            : d
        ),
      },
    })),

  dismissLiveDecision: (id) =>
    set((s) => ({
      meeting: {
        ...s.meeting,
        decisions: s.meeting.decisions.filter((d) => d.id !== id),
        transcript: s.meeting.transcript.map((m) =>
          m.associatedDecisionId === id ? { ...m, associatedDecisionId: undefined } : m
        ),
      },
    })),

  resetLiveMeeting: () =>
    set({
      phase: 'idle',
      mode: 'demo',
      connection: 'disconnected',
      meeting: { ...emptyMeeting, startedAt: new Date().toISOString() },
      elapsedSeconds: 0,
      aiStatus: 'listening',
      aiSource: null,
      activeTab: 'transcript',
      unread: noUnread,
      roster: [],
    }),
}));

/** Formats seconds as HH:MM:SS (e.g. 00:24:18). */
export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => v.toString().padStart(2, '0')).join(':');
}
