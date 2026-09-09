export type PriorityLevel = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';
export type DecisionStatus = 'confirmed' | 'pending' | 'open';
export type MeetingStatus = 'analyzed' | 'processing' | 'live' | 'scheduled';

export type ScheduledMeetingStatus = 'scheduled' | 'starting' | 'live' | 'completed' | 'cancelled';

export interface ScheduledMeeting {
  id: string;
  title: string;
  roomId: string;
  meetingUrl: string;
  scheduledStart: string; // ISO 8601 UTC
  scheduledEnd: string;   // ISO 8601 UTC
  durationMinutes: number;
  timezone: string;       // e.g. "Asia/Kolkata"
  hostId: string;
  hostName: string;
  participants: string[];
  status: ScheduledMeetingStatus;
  reminderMinutes: number; // 0, 5, 10, 15, 30, 60
  createdAt: string;
  updatedAt: string;
  description?: string;
  remindedAt?: string;
}

/**
 * Real meeting recording metadata backed by LiveKit Egress (server-side room
 * composite recording → MP4 → S3-compatible object storage).
 * `recording: null` when a meeting has no recording.
 */
export interface MeetingRecording {
  id: string;
  egressId: string;
  meetingId?: string;
  meetingTitle?: string;
  roomName?: string;
  status: 'starting' | 'recording' | 'processing' | 'ready' | 'failed';
  fileUrl?: string;
  thumbnailUrl?: string;
  duration?: number; // seconds
  fileSize?: number; // bytes
  startedAt?: string; // ISO
  endedAt?: string; // ISO
  storageProvider?: string;
  error?: string;
}

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
  /** LiveKit room this meeting ran in (real meetings). */
  roomId?: string;
  roomName?: string;
  /** Shareable live-meeting URL (https://…/live-meeting/:roomName). */
  shareUrl?: string;
  /**
   * Real LiveKit Egress recording attached to this meeting.
   * `null`/undefined when the meeting was never recorded.
   * (Legacy `isRecording` boolean kept only for old mock data compatibility.)
   */
  recording?: MeetingRecording | null;
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
  /** Server-side Egress recording attached to this live session, if any. */
  recording?: MeetingRecording | null;
}

export interface FilterOptions {
  search: string;
  assignee: string;
  priority: string;
  status: string;
  confidenceMin: number;
  meetingId: string;
}
