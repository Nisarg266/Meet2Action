import { Meeting, ActionItem, Decision, TranscriptMessage } from '../types';

export interface ProcessingStep {
  id: number;
  label: string;
  status: 'waiting' | 'processing' | 'done';
}

export const DEFAULT_PROCESSING_STEPS: ProcessingStep[] = [
  { id: 1, label: 'Reading transcript', status: 'waiting' },
  { id: 2, label: 'Identifying speakers', status: 'waiting' },
  { id: 3, label: 'Extracting action items', status: 'waiting' },
  { id: 4, label: 'Normalizing deadlines', status: 'waiting' },
  { id: 5, label: 'Detecting decisions', status: 'waiting' },
  { id: 6, label: 'Generating summary', status: 'waiting' },
];

/**
 * Service abstraction for analyzing meeting transcripts.
 * Initially powered by high-precision mock inference that extracts entities,
 * deadlines, decisions, and structured transcripts.
 * Designed to cleanly swap to a server-side Gemini endpoint (`/api/analyze`) without touching any UI code.
 */
export async function analyzeMeeting(
  transcript: string,
  onStepProgress?: (steps: ProcessingStep[]) => void
): Promise<Meeting> {
  const steps: ProcessingStep[] = [
    { id: 1, label: 'Reading transcript', status: 'waiting' },
    { id: 2, label: 'Identifying speakers', status: 'waiting' },
    { id: 3, label: 'Extracting action items', status: 'waiting' },
    { id: 4, label: 'Normalizing deadlines', status: 'waiting' },
    { id: 5, label: 'Detecting decisions', status: 'waiting' },
    { id: 6, label: 'Generating summary', status: 'waiting' },
  ];

  const updateStep = (index: number, status: 'processing' | 'done') => {
    steps[index].status = status;
    if (onStepProgress) {
      onStepProgress([...steps]);
    }
  };

  // Step 1: Reading transcript
  updateStep(0, 'processing');
  await new Promise((r) => setTimeout(r, 450));
  updateStep(0, 'done');

  // Step 2: Identifying speakers
  updateStep(1, 'processing');
  await new Promise((r) => setTimeout(r, 450));
  updateStep(1, 'done');

  // Step 3: Extracting action items
  updateStep(2, 'processing');
  await new Promise((r) => setTimeout(r, 500));
  updateStep(2, 'done');

  // Step 4: Normalizing deadlines
  updateStep(3, 'processing');
  await new Promise((r) => setTimeout(r, 450));
  updateStep(3, 'done');

  // Step 5: Detecting decisions
  updateStep(4, 'processing');
  await new Promise((r) => setTimeout(r, 450));
  updateStep(4, 'done');

  // Step 6: Generating summary
  updateStep(5, 'processing');
  await new Promise((r) => setTimeout(r, 400));
  updateStep(5, 'done');

  const meetingId = `meet-${Date.now().toString(36)}`;
  const title = extractTitleFromTranscript(transcript);

  // Generate parsed items tailored to the content
  const actionItems = generateActionItemsFromTranscript(transcript, meetingId, title);
  const decisions = generateDecisionsFromTranscript(transcript, meetingId, title);
  const transcriptMessages = parseTranscriptMessages(transcript);
  const participants = Array.from(new Set(transcriptMessages.map((m) => m.speaker)));

  const newMeeting: Meeting = {
    id: meetingId,
    title,
    date: 'September 8, 2026',
    duration: Math.max(25, transcriptMessages.length * 4),
    durationFormatted: `${Math.max(25, transcriptMessages.length * 4)} mins`,
    status: 'analyzed',
    platform: 'Google Meet',
    meetingUrl: `meet.google.com/${meetingId.slice(0, 8)}`,
    isRecording: true,
    recordingDuration: `REC ${Math.max(20, transcriptMessages.length * 3)}:00`,
    participants: participants.length > 0 ? participants : ['Alex Mercer', 'Rahul Patel', 'Amit Shah', 'Priya Mehta'],
    transcriptMessages,
    actionItems,
    decisions,
    summary: generateSummaryFromTranscript(transcript, actionItems, decisions),
    transcript,
  };

  return newMeeting;
}

function extractTitleFromTranscript(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('sprint') || lower.includes('product strategy')) {
    return 'Q4 Product Strategy & Sprint Planning';
  }
  if (lower.includes('marketing') || lower.includes('campaign')) {
    return 'Growth & Marketing Alignment Session';
  }
  if (lower.includes('architecture') || lower.includes('infra') || lower.includes('database')) {
    return 'Cloud Infrastructure & Security Review';
  }
  if (lower.includes('design') || lower.includes('redesign')) {
    return 'Design System & Landing Page Sync';
  }
  return 'Strategic Engineering & Product Sync';
}

function parseTranscriptMessages(text: string): TranscriptMessage[] {
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  const messages: TranscriptMessage[] = [];
  let currentSpeaker = 'Alex Mercer';
  let currentTime = 10;
  let currentMin = 30;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Check if line is "Speaker:" or "Speaker (Role):"
    const speakerMatch = line.match(/^([A-Za-z\s]+)(?:\s*\(([^)]+)\))?:\s*(.*)$/);
    if (speakerMatch) {
      currentSpeaker = speakerMatch[1].trim();
      const speech = speakerMatch[3] ? speakerMatch[3].replace(/^["']|["']$/g, '').trim() : '';
      currentMin += 2;
      const timeStr = `${currentTime}:${currentMin.toString().padStart(2, '0')}`;

      messages.push({
        id: `tr-msg-${i}`,
        timestamp: timeStr,
        speaker: currentSpeaker,
        speakerRole: speakerMatch[2] || getRoleForSpeaker(currentSpeaker),
        avatar: getAvatarForSpeaker(currentSpeaker),
        text: speech || (lines[i + 1] ? lines[i + 1].replace(/^["']|["']$/g, '').trim() : line),
      });

      if (!speech && lines[i + 1]) {
        i++; // skip next line as it was the quote
      }
    } else if (line.length > 5) {
      currentMin += 1;
      messages.push({
        id: `tr-msg-${i}`,
        timestamp: `${currentTime}:${currentMin.toString().padStart(2, '0')}`,
        speaker: currentSpeaker,
        speakerRole: getRoleForSpeaker(currentSpeaker),
        avatar: getAvatarForSpeaker(currentSpeaker),
        text: line.replace(/^["']|["']$/g, '').trim(),
      });
    }
  }

  return messages.length > 0
    ? messages
    : [
        {
          id: 'tr-msg-0',
          timestamp: '10:30',
          speaker: 'Alex Mercer',
          speakerRole: 'Product Lead',
          avatar: getAvatarForSpeaker('Alex Mercer'),
          text: text,
        },
      ];
}

function getAvatarForSpeaker(name: string): string {
  if (name.includes('Rahul')) return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80';
  if (name.includes('Amit')) return 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80';
  if (name.includes('Priya')) return 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80';
  if (name.includes('Jay')) return 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80';
  if (name.includes('Neha')) return 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80';
  return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';
}

function getRoleForSpeaker(name: string): string {
  if (name.includes('Rahul')) return 'Product Designer';
  if (name.includes('Amit')) return 'Backend Lead';
  if (name.includes('Priya')) return 'Marketing Lead';
  if (name.includes('Jay')) return 'Infra Lead';
  if (name.includes('Neha')) return 'Frontend Lead';
  return 'Product Lead';
}

function generateActionItemsFromTranscript(text: string, meetingId: string, meetingTitle: string): ActionItem[] {
  const items: ActionItem[] = [];
  const lower = text.toLowerCase();

  // If matches prompt demo transcript:
  if (lower.includes('landing page redesign') || lower.includes('rahul')) {
    items.push({
      id: `act-${Date.now()}-1`,
      meetingId,
      meetingTitle,
      task: 'Finalize landing page redesign',
      assignee: 'Rahul Patel',
      assigneeRole: 'Product Designer',
      assigneeAvatar: getAvatarForSpeaker('Rahul Patel'),
      deadline: 'Sep 11, 2026',
      originalDeadlinePhrase: 'by Friday',
      priority: 'High',
      confidence: 96,
      status: 'todo',
      sourceTimestamp: '10:33',
      sourceText: 'Rahul: "I\'ll finish the landing page redesign by Friday."',
      detectedEntities: {
        assignee: 'Rahul Patel',
        task: 'landing page redesign',
        deadline: 'Friday (Sep 11)',
        tags: ['Design', 'V2']
      },
      isConfirmed: true,
      createdAt: '2026-09-08'
    });
  }

  if (lower.includes('payment api') || lower.includes('amit')) {
    items.push({
      id: `act-${Date.now()}-2`,
      meetingId,
      meetingTitle,
      task: 'Complete payment API integration',
      assignee: 'Amit Shah',
      assigneeRole: 'Backend Lead',
      assigneeAvatar: getAvatarForSpeaker('Amit Shah'),
      deadline: 'Sep 9, 2026',
      originalDeadlinePhrase: 'before Wednesday',
      priority: 'High',
      confidence: 94,
      status: 'in-progress',
      sourceTimestamp: '10:35',
      sourceText: 'Amit: "I\'ll complete the payment API integration before Wednesday."',
      detectedEntities: {
        assignee: 'Amit Shah',
        task: 'payment API integration',
        deadline: 'Wednesday (Sep 9)',
        tags: ['Backend', 'Stripe']
      },
      isConfirmed: true,
      createdAt: '2026-09-08'
    });
  }

  if (lower.includes('launch announcement') || lower.includes('priya')) {
    items.push({
      id: `act-${Date.now()}-3`,
      meetingId,
      meetingTitle,
      task: 'Prepare launch announcement',
      assignee: 'Priya Mehta',
      assigneeRole: 'Marketing Lead',
      assigneeAvatar: getAvatarForSpeaker('Priya Mehta'),
      deadline: 'Sep 14, 2026',
      originalDeadlinePhrase: 'by next Monday',
      priority: 'Medium',
      confidence: 92,
      status: 'review',
      sourceTimestamp: '10:38',
      sourceText: 'Priya: "I\'ll prepare the launch announcement by next Monday."',
      detectedEntities: {
        assignee: 'Priya Mehta',
        task: 'launch announcement',
        deadline: 'Next Monday (Sep 14)',
        tags: ['Marketing']
      },
      isConfirmed: true,
      createdAt: '2026-09-08'
    });
  }

  if (lower.includes('navigation drawer') || lower.includes('neha')) {
    items.push({
      id: `act-${Date.now()}-4`,
      meetingId,
      meetingTitle,
      task: 'Implement responsive mobile navigation drawer',
      assignee: 'Neha Shah',
      assigneeRole: 'Frontend Lead',
      assigneeAvatar: getAvatarForSpeaker('Neha Shah'),
      deadline: 'Sep 12, 2026',
      originalDeadlinePhrase: 'end of this week',
      priority: 'High',
      confidence: 95,
      status: 'todo',
      sourceTimestamp: '10:45',
      sourceText: 'Neha: "I will implement the responsive mobile navigation drawer and make sure drawer gestures feel native on iOS."',
      detectedEntities: {
        assignee: 'Neha Shah',
        task: 'responsive mobile navigation drawer',
        deadline: 'Sep 12',
        tags: ['Frontend', 'Mobile']
      },
      isConfirmed: true,
      createdAt: '2026-09-08'
    });
  }

  // Fallback if generic input:
  if (items.length === 0) {
    items.push(
      {
        id: `act-${Date.now()}-1`,
        meetingId,
        meetingTitle,
        task: 'Review meeting takeaways & deliverables',
        assignee: 'Alex Mercer',
        assigneeRole: 'Product Lead',
        assigneeAvatar: getAvatarForSpeaker('Alex Mercer'),
        deadline: 'Sep 11, 2026',
        originalDeadlinePhrase: 'by Friday',
        priority: 'High',
        confidence: 94,
        status: 'todo',
        sourceTimestamp: '10:30',
        sourceText: text.slice(0, 100),
        detectedEntities: {
          assignee: 'Alex Mercer',
          task: 'Review meeting takeaways',
          deadline: 'Friday (Sep 11)'
        },
        isConfirmed: true,
        createdAt: '2026-09-08'
      },
      {
        id: `act-${Date.now()}-2`,
        meetingId,
        meetingTitle,
        task: 'Follow up on technical architecture commitments',
        assignee: 'Amit Shah',
        assigneeRole: 'Backend Lead',
        assigneeAvatar: getAvatarForSpeaker('Amit Shah'),
        deadline: 'Sep 15, 2026',
        originalDeadlinePhrase: 'next week',
        priority: 'Medium',
        confidence: 86,
        status: 'in-progress',
        sourceTimestamp: '10:35',
        sourceText: text.slice(0, 120),
        detectedEntities: {
          assignee: 'Amit Shah',
          task: 'Architecture commitments',
          deadline: 'Next week'
        },
        isConfirmed: true,
        createdAt: '2026-09-08'
      }
    );
  }

  return items;
}

function generateDecisionsFromTranscript(text: string, meetingId: string, meetingTitle: string): Decision[] {
  const decisions: Decision[] = [];
  const lower = text.toLowerCase();

  if (lower.includes('launch version 2') || lower.includes('decided to launch')) {
    decisions.push({
      id: `dec-${Date.now()}-1`,
      meetingId,
      meetingTitle,
      text: 'Launch version 2 next Monday across all staging and production channels.',
      status: 'confirmed',
      category: 'Consensus',
      confidence: 94,
      timestamp: 'Sep 8, 2026 · 18:42',
      sourceText: 'Manager: "We\'ve decided to launch version 2 next Monday."',
      citationSpeaker: 'Alex Mercer (Manager)',
      details: 'Consensus reached across product and engineering leads. Staging validation approved.',
      quorumStatus: '100% Consensus',
      signaturesCount: '4/4 Lead Signatures',
      triggeredIntegration: 'Release Pipeline & Jira Milestone #V2-LAUNCH',
      createdAt: '2026-09-08'
    });
  }

  if (lower.includes('pricing model') || lower.includes('pricing') || lower.includes('seat')) {
    decisions.push({
      id: `dec-${Date.now()}-2`,
      meetingId,
      meetingTitle,
      text: 'Pricing model needs further discussion before enterprise outreach.',
      status: 'open',
      category: 'Unresolved Debate',
      confidence: 76,
      timestamp: 'Detected at: 32:14',
      sourceText: 'Jay: "We should probably discuss the pricing model again."',
      citationSpeaker: 'Jay Patel',
      details: 'Debate over 25-seat hard minimum for enterprise pilots vs flexible self-serve tier.',
      aiSuggestion: 'Schedule dedicated 30-minute alignment sync with Finance & Product.',
      createdAt: '2026-09-08'
    });
  }

  if (lower.includes('serverless') || lower.includes('cold start') || lower.includes('infra cost')) {
    decisions.push({
      id: `dec-${Date.now()}-3`,
      meetingId,
      meetingTitle,
      text: 'Serverless streaming infra cost impact and edge caching strategy',
      status: 'open',
      category: 'Unresolved Debate',
      confidence: 72,
      timestamp: 'Detected at: 42:15',
      sourceText: 'Jay Patel: "Regarding serverless streaming infra cost: AWS Lambda cold starts will spike our hosting bill by 35%."',
      citationSpeaker: 'Jay Patel (Infra Lead)',
      details: 'Edge caching layer required before scaling v2 traffic to prevent billing surges.',
      aiSuggestion: 'Schedule Follow-up with Jay Patel & Amit Shah before Friday.',
      createdAt: '2026-09-08'
    });
  }

  if (decisions.length === 0) {
    decisions.push({
      id: `dec-${Date.now()}-1`,
      meetingId,
      meetingTitle,
      text: 'Proceed with prioritized roadmap commitments outlined in this session.',
      status: 'confirmed',
      category: 'Consensus',
      confidence: 91,
      timestamp: 'Sep 8, 2026 · 10:30',
      sourceText: text.slice(0, 120),
      citationSpeaker: 'Alex Mercer',
      details: 'Unanimous lead sign-off recorded.',
      quorumStatus: '100% Consensus',
      createdAt: '2026-09-08'
    });
  }

  return decisions;
}

function generateSummaryFromTranscript(text: string, actionItems: ActionItem[], decisions: Decision[]): string {
  const confirmedCount = decisions.filter(d => d.status === 'confirmed').length;
  const openCount = decisions.filter(d => d.status === 'open' || d.status === 'pending').length;
  
  return `Executive AI Synthesis: This session established ${actionItems.length} structured action items and ${confirmedCount} confirmed decisions. Unresolved debates (${openCount}) were flagged with recommended alignment follow-ups. Primary ownership was linked to ${actionItems.map(a => a.assignee).filter(Boolean).slice(0, 3).join(', ')}.`;
}
