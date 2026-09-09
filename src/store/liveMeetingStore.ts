import { create } from 'zustand';
import type { ActionItem, Decision, LiveMeeting, MeetingRecording, TranscriptMessage } from '../types';

export type LivePhase = 'idle' | 'connecting' | 'live' | 'ending' | 'ended';
export type LiveMode = 'live' | 'demo';
export type LiveConnectionState = 'connected' | 'reconnecting' | 'disconnected' | 'demo';
export type InsightTab = 'transcript' | 'actions' | 'decisions' | 'discussions';
export type AiStatus = 'listening' | 'analyzing' | 'idle' | 'error';
/** Provenance of AI detections: real Gemini vs heuristic fallback. */
export type AiSource = 'gemini' | 'fallback' | null;

export interface InterimUtterance {
  id?: string;
  speaker: string;
  text: string;
  timestamp?: string;
  participantId?: string;
}

export type TranscriptStatus = 'connecting' | 'live' | 'reconnecting' | 'error';

export interface EnrichmentPayload {
  highlightEntities?: TranscriptMessage['highlightEntities'];
  associatedActionItemId?: string;
  associatedDecisionId?: string;
}

export interface ActiveReaction {
  id: string;
  emoji: string;
  sender: string;
  xPercent: number; // 15 to 85 percent horizontal position
  createdAt: number;
}

interface LiveMeetingState {
  phase: LivePhase;
  mode: LiveMode;
  connection: LiveConnectionState;
  transcriptStatus: TranscriptStatus;
  currentInterim: InterimUtterance | null;
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
  /** Server-side Egress recording for this session (null when not recording). */
  recording: MeetingRecording | null;
  /** Set when the user explicitly retried after a failure (guards auto-retry loops). */
  recordingRetryCount: number;
  /** Active animated emoji reactions floating over the stage. */
  reactions: ActiveReaction[];

  addReaction: (reaction: { emoji: string; sender: string; id?: string; xPercent?: number }) => void;
  removeReaction: (id: string) => void;
  clearReactions: () => void;

  startMeeting: (opts: { roomName: string; title: string; identity: string; name: string }) => void;
  setPhase: (phase: LivePhase) => void;
  setMode: (mode: LiveMode) => void;
  setConnection: (connection: LiveConnectionState) => void;
  setTranscriptStatus: (status: TranscriptStatus) => void;
  setCurrentInterim: (interim: InterimUtterance | null) => void;
  tick: () => void;
  setElapsed: (seconds: number) => void;
  setAiStatus: (status: AiStatus) => void;
  setAiSource: (source: AiSource) => void;
  setActiveTab: (tab: InsightTab) => void;
  setMic: (on: boolean) => void;
  setCamera: (on: boolean) => void;
  setScreenSharing: (on: boolean) => void;
  setRoster: (names: string[]) => void;
  setRecording: (recording: MeetingRecording | null) => void;
  clearRecording: () => void;
  bumpRecordingRetry: () => void;

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

function cleanKey(str: string): string {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

export const useLiveMeetingStore = create<LiveMeetingState>((set) => ({
  phase: 'idle',
  mode: 'demo',
  connection: 'disconnected',
  transcriptStatus: 'live',
  currentInterim: null,
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
  recording: null,
  recordingRetryCount: 0,
  reactions: [],

  startMeeting: ({ roomName, title, identity, name }) =>
    set({
      phase: 'connecting',
      transcriptStatus: 'connecting',
      currentInterim: null,
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
      reactions: [],
      localName: name,
      localIdentity: identity,
      roster: [name],
    }),

  setPhase: (phase) => set({ phase }),
  setMode: (mode) => set({ mode }),
  setConnection: (connection) => set({ connection }),
  setTranscriptStatus: (transcriptStatus) => set({ transcriptStatus }),
  setCurrentInterim: (currentInterim) => set({ currentInterim }),
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

  setRecording: (recording) =>
    set((s) => ({
      recording,
      meeting: recording ? { ...s.meeting, recording } : s.meeting,
    })),
  clearRecording: () => set({ recording: null }),
  bumpRecordingRetry: () => set((s) => ({ recordingRetryCount: s.recordingRetryCount + 1 })),

  addReaction: ({ emoji, sender, id, xPercent }) =>
    set((s) => {
      const newReaction: ActiveReaction = {
        id: id || `rx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        emoji,
        sender,
        xPercent: typeof xPercent === 'number' ? xPercent : Math.floor(15 + Math.random() * 70),
        createdAt: Date.now(),
      };
      return {
        reactions: [...s.reactions.slice(-24), newReaction],
      };
    }),
  removeReaction: (id) =>
    set((s) => ({
      reactions: s.reactions.filter((r) => r.id !== id),
    })),
  clearReactions: () => set({ reactions: [] }),

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
      const targetKey = cleanKey(item.task);
      const existingIndex = s.meeting.actionItems.findIndex(
        (a) => a.id === item.id || (targetKey.length >= 4 && cleanKey(a.task) === targetKey)
      );

      let nextItems: ActionItem[];
      let isNew = false;

      if (existingIndex >= 0) {
        const existing = s.meeting.actionItems[existingIndex];
        const updated: ActionItem = {
          ...item,
          id: existing.id,
          isConfirmed: existing.isConfirmed || item.isConfirmed,
          confidence: Math.max(existing.confidence, item.confidence),
          assignee: item.assignee && item.assignee !== 'Unassigned' ? item.assignee : existing.assignee,
          deadline: item.deadline || existing.deadline,
        };
        nextItems = [...s.meeting.actionItems];
        nextItems[existingIndex] = updated;
      } else {
        nextItems = [...s.meeting.actionItems, item];
        isNew = true;
      }

      return {
        meeting: { ...s.meeting, actionItems: nextItems },
        unread:
          isNew && s.activeTab !== 'actions'
            ? { ...s.unread, actions: s.unread.actions + 1 }
            : s.unread,
      };
    }),

  upsertDecision: (decision) =>
    set((s) => {
      const targetKey = cleanKey(decision.text);
      const isDiscussion = decision.status === 'open';
      const existingIndex = s.meeting.decisions.findIndex(
        (d) => d.id === decision.id || (targetKey.length >= 4 && cleanKey(d.text) === targetKey)
      );

      let nextDecisions: Decision[];
      let isNew = false;

      if (existingIndex >= 0) {
        const existing = s.meeting.decisions[existingIndex];
        const updated: Decision = {
          ...decision,
          id: existing.id,
          status: existing.status === 'confirmed' ? 'confirmed' : decision.status,
          confidence: Math.max(existing.confidence, decision.confidence),
        };
        nextDecisions = [...s.meeting.decisions];
        nextDecisions[existingIndex] = updated;
      } else {
        nextDecisions = [...s.meeting.decisions, decision];
        isNew = true;
      }

      return {
        meeting: { ...s.meeting, decisions: nextDecisions },
        unread:
          isNew
            ? isDiscussion
              ? s.activeTab === 'discussions'
                ? s.unread
                : { ...s.unread, discussions: s.unread.discussions + 1 }
              : s.activeTab === 'decisions'
                ? s.unread
                : { ...s.unread, decisions: s.unread.decisions + 1 }
            : s.unread,
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
      recording: null,
      recordingRetryCount: 0,
      reactions: [],
    }),
}));

/** Formats seconds as HH:MM:SS (e.g. 00:24:18). */
export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => v.toString().padStart(2, '0')).join(':');
}
