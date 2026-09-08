export type PriorityLevel = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';
export type DecisionStatus = 'confirmed' | 'pending' | 'open';
export type MeetingStatus = 'analyzed' | 'processing' | 'live' | 'scheduled';

export interface DetectedEntities {
  assignee?: string;
  task?: string;
  deadline?: string;
  tags?: string[];
}

export interface ActionItem {
  id: string;
  meetingId: string;
  meetingTitle?: string;
  task: string;
  assignee: string | null;
  assigneeRole?: string;
  assigneeAvatar?: string;
  deadline: string | null;
  originalDeadlinePhrase?: string;
  priority: PriorityLevel;
  confidence: number; // 0 - 100
  status: TaskStatus;
  sourceTimestamp?: string;
  sourceText?: string;
  detectedEntities?: DetectedEntities;
  isConfirmed?: boolean;
  createdAt?: string;
}

export interface Decision {
  id: string;
  meetingId: string;
  meetingTitle?: string;
  text: string;
  status: DecisionStatus; // 'confirmed' | 'pending' | 'open'
  category?: 'Consensus' | 'Sign-off Required' | 'Unresolved Debate' | 'Architecture' | 'Product';
  confidence: number; // 0 - 100
  timestamp?: string;
  sourceText?: string;
  citationSpeaker?: string;
  details?: string;
  quorumStatus?: string;
  votesInFavor?: string[];
  votesInReview?: string[];
  targetDate?: string;
  owner?: string;
  aiSuggestion?: string;
  signaturesCount?: string;
  triggeredIntegration?: string;
  createdAt?: string;
}

export interface TranscriptMessage {
  id: string;
  timestamp: string;
  seconds?: number;
  speaker: string;
  speakerRole?: string;
  avatar?: string;
  color?: string;
  text: string;
  highlightEntities?: {
    text: string;
    type: 'assignee' | 'task' | 'deadline' | 'decision';
  }[];
  associatedActionItemId?: string;
  associatedDecisionId?: string;
}

export interface MeetingParticipant {
  name: string;
  role: string;
  avatar?: string;
  talkTime?: string;
  isHost?: boolean;
  email?: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  duration: number; // minutes
  durationFormatted?: string;
  participants: string[];
  participantDetails?: MeetingParticipant[];
  transcript: string;
  transcriptMessages?: TranscriptMessage[];
  actionItems: ActionItem[];
  decisions: Decision[];
  summary: string;
  status: MeetingStatus;
  platform?: 'Google Meet' | 'Zoom' | 'MS Teams' | 'In-Person' | 'LiveKit';
  meetingUrl?: string;
  isRecording?: boolean;
  recordingDuration?: string;
}

/**
 * Working record for an in-progress LiveKit meeting.
 * Persisted into the regular Meeting model when the session ends.
 */
export interface LiveMeeting {
  id: string;
  roomName: string;
  title: string;
  startedAt: string; // ISO timestamp
  endedAt?: string;
  participants: string[];
  transcript: TranscriptMessage[];
  actionItems: ActionItem[];
  decisions: Decision[];
  /** Convenience view of decisions with status 'open' (unresolved debates). */
  openDiscussions?: Decision[];
  /** 'live' = connected to a real LiveKit room, 'demo' = simulated mock mode. */
  mode?: 'live' | 'demo';
}

export interface FilterOptions {
  search: string;
  assignee: string;
  priority: string;
  status: string;
  confidenceMin: number;
  meetingId: string;
}
