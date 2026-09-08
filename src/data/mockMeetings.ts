import { Meeting, ActionItem, Decision, TranscriptMessage } from '../types';

export const mockTranscriptMessages: TranscriptMessage[] = [
  {
    id: 'tr-1',
    timestamp: '10:32',
    seconds: 632,
    speaker: 'Alex Mercer',
    speakerRole: 'Product Lead (Host)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    color: '#0284C7',
    text: "Welcome everyone to our Q4 Sprint & Architecture alignment. Let's start with the web refresh deliverables and staging deadlines.",
  },
  {
    id: 'tr-2',
    timestamp: '10:33',
    seconds: 633,
    speaker: 'Rahul Patel',
    speakerRole: 'Product Designer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    color: '#8B5CF6',
    text: "I'll finish the landing page redesign by Friday, including responsive mobile layouts and the Figma design system handoff.",
    highlightEntities: [
      { text: 'Rahul Patel', type: 'assignee' },
      { text: 'landing page redesign', type: 'task' },
      { text: 'by Friday', type: 'deadline' },
    ],
    associatedActionItemId: 'act-1',
  },
  {
    id: 'tr-3',
    timestamp: '10:35',
    seconds: 635,
    speaker: 'Amit Shah',
    speakerRole: 'Backend Lead',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    color: '#10B981',
    text: "I'll complete the payment API integration before Wednesday. Stripe webhook retry latency is now down to 120ms.",
    highlightEntities: [
      { text: 'Amit Shah', type: 'assignee' },
      { text: 'payment API integration', type: 'task' },
      { text: 'before Wednesday', type: 'deadline' },
    ],
    associatedActionItemId: 'act-2',
  },
  {
    id: 'tr-4',
    timestamp: '10:38',
    seconds: 638,
    speaker: 'Priya Mehta',
    speakerRole: 'Marketing Lead',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    color: '#EC4899',
    text: "I'll prepare the launch announcement by next Monday and coordinate with PR for tech publication embargos.",
    highlightEntities: [
      { text: 'Priya Mehta', type: 'assignee' },
      { text: 'launch announcement', type: 'task' },
      { text: 'next Monday', type: 'deadline' },
    ],
    associatedActionItemId: 'act-3',
  },
  {
    id: 'tr-5',
    timestamp: '10:41',
    seconds: 641,
    speaker: 'Alex Mercer',
    speakerRole: 'Product Lead (Host)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    color: '#0284C7',
    text: "Okay, we've decided to launch version 2 next Monday across all staging and production channels. Everyone aligns? Infrastructure is green, docs are verified.",
    highlightEntities: [
      { text: 'launch version 2 next Monday', type: 'decision' },
    ],
    associatedDecisionId: 'dec-1',
  },
  {
    id: 'tr-6',
    timestamp: '10:43',
    seconds: 643,
    speaker: 'Jay Patel',
    speakerRole: 'Infra Lead',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80',
    color: '#F59E0B',
    text: "We should probably discuss the pricing model again before enterprise outreach. Imposing a 25-seat floor might stall mid-market conversions.",
    highlightEntities: [
      { text: 'discuss the pricing model again', type: 'decision' },
    ],
    associatedDecisionId: 'dec-4',
  },
  {
    id: 'tr-7',
    timestamp: '10:45',
    seconds: 645,
    speaker: 'Neha Shah',
    speakerRole: 'Frontend Lead',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
    color: '#06B6D4',
    text: "I will implement the responsive mobile navigation drawer and make sure drawer gesture gestures feel native on iOS.",
    highlightEntities: [
      { text: 'Neha Shah', type: 'assignee' },
      { text: 'implement responsive mobile navigation drawer', type: 'task' },
    ],
    associatedActionItemId: 'act-5',
  },
  {
    id: 'tr-8',
    timestamp: '10:48',
    seconds: 648,
    speaker: 'Jay Patel',
    speakerRole: 'Infra Lead',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80',
    color: '#F59E0B',
    text: "Regarding serverless streaming infra cost: if we deploy the dynamic hero without edge caching, AWS Lambda cold starts will spike our hosting bill by 35%. We need sign-off before Friday.",
    highlightEntities: [
      { text: 'Serverless streaming infra cost impact', type: 'decision' },
    ],
    associatedDecisionId: 'dec-5',
  }
];

export const initialActionItems: ActionItem[] = [
  {
    id: 'act-1',
    meetingId: 'meet-q4-strategy',
    meetingTitle: 'Q4 Product Strategy & Sprint Planning',
    task: 'Finalize landing page redesign',
    assignee: 'Rahul Patel',
    assigneeRole: 'Product Designer',
    assigneeAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    deadline: 'Sep 11, 2026',
    originalDeadlinePhrase: 'by Friday',
    priority: 'High',
    confidence: 96,
    status: 'todo',
    sourceTimestamp: '10:33',
    sourceText: 'Rahul will finalize the landing page redesign by Friday, including responsive mobile layouts and the Figma design system handoff.',
    detectedEntities: {
      assignee: 'Rahul Patel',
      task: 'landing page redesign',
      deadline: 'Friday (Sep 11)',
      tags: ['Design', 'V2-Launch', 'Figma']
    },
    isConfirmed: true,
    createdAt: '2026-09-08'
  },
  {
    id: 'act-2',
    meetingId: 'meet-q4-strategy',
    meetingTitle: 'Q4 Product Strategy & Sprint Planning',
    task: 'Complete payment API integration',
    assignee: 'Amit Shah',
    assigneeRole: 'Backend Lead',
    assigneeAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    deadline: 'Sep 9, 2026',
    originalDeadlinePhrase: 'before Wednesday',
    priority: 'High',
    confidence: 94,
    status: 'in-progress',
    sourceTimestamp: '10:35',
    sourceText: 'Amit will complete the payment API integration before Wednesday. Stripe webhook retry latency is now down to 120ms.',
    detectedEntities: {
      assignee: 'Amit Shah',
      task: 'Complete payment API integration',
      deadline: 'Wednesday (Sep 9)',
      tags: ['Backend', 'Stripe', 'API']
    },
    isConfirmed: true,
    createdAt: '2026-09-08'
  },
  {
    id: 'act-3',
    meetingId: 'meet-q4-strategy',
    meetingTitle: 'Q4 Product Strategy & Sprint Planning',
    task: 'Prepare launch announcement & press embargo',
    assignee: 'Priya Mehta',
    assigneeRole: 'Marketing Lead',
    assigneeAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    deadline: 'Sep 14, 2026',
    originalDeadlinePhrase: 'by next Monday',
    priority: 'Medium',
    confidence: 92,
    status: 'review',
    sourceTimestamp: '10:38',
    sourceText: 'Priya will prepare the launch announcement by next Monday and coordinate with PR for tech publication embargos.',
    detectedEntities: {
      assignee: 'Priya Mehta',
      task: 'Prepare launch announcement',
      deadline: 'Next Monday (Sep 14)',
      tags: ['Marketing', 'PR', 'V2-Launch']
    },
    isConfirmed: true,
    createdAt: '2026-09-08'
  },
  {
    id: 'act-4',
    meetingId: 'meet-q4-strategy',
    meetingTitle: 'Q4 Product Strategy & Sprint Planning',
    task: 'Benchmark serverless streaming cold starts',
    assignee: 'Jay Patel',
    assigneeRole: 'Infra Lead',
    assigneeAvatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80',
    deadline: 'Sep 15, 2026',
    originalDeadlinePhrase: 'next Tuesday',
    priority: 'Medium',
    confidence: 88,
    status: 'in-progress',
    sourceTimestamp: '10:48',
    sourceText: 'If we deploy dynamic hero without edge caching, AWS Lambda cold starts will spike our hosting bill by 35%. Jay to run benchmark.',
    detectedEntities: {
      assignee: 'Jay Patel',
      task: 'Benchmark serverless cold starts',
      deadline: 'Sep 15',
      tags: ['Infra', 'AWS', 'Optimization']
    },
    isConfirmed: true,
    createdAt: '2026-09-08'
  },
  {
    id: 'act-5',
    meetingId: 'meet-q4-strategy',
    meetingTitle: 'Q4 Product Strategy & Sprint Planning',
    task: 'Implement responsive mobile navigation drawer',
    assignee: 'Neha Shah',
    assigneeRole: 'Frontend Lead',
    assigneeAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
    deadline: 'Sep 12, 2026',
    originalDeadlinePhrase: 'end of this week',
    priority: 'High',
    confidence: 95,
    status: 'done',
    sourceTimestamp: '10:45',
    sourceText: 'Neha will implement the responsive mobile navigation drawer and make sure drawer gestures feel native on iOS.',
    detectedEntities: {
      assignee: 'Neha Shah',
      task: 'Implement responsive mobile drawer',
      deadline: 'Sep 12',
      tags: ['Frontend', 'Mobile', 'UI']
    },
    isConfirmed: true,
    createdAt: '2026-09-08'
  },
  {
    id: 'act-6',
    meetingId: 'meet-q4-strategy',
    meetingTitle: 'Q4 Product Strategy & Sprint Planning',
    task: 'Review pricing tier legal terms & SOC2 disclosures',
    assignee: 'Alex Mercer',
    assigneeRole: 'Product Lead',
    assigneeAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    deadline: 'Sep 18, 2026',
    originalDeadlinePhrase: 'in 10 days',
    priority: 'Low',
    confidence: 68, // <70% -> Needs Review!
    status: 'todo',
    sourceTimestamp: '10:43',
    sourceText: 'Speaker mentioned compliance review for pricing tier changes but owner was tentatively flagged.',
    detectedEntities: {
      assignee: 'Alex Mercer',
      task: 'Review pricing tier legal terms',
      deadline: 'Sep 18',
      tags: ['Legal', 'Compliance']
    },
    isConfirmed: false,
    createdAt: '2026-09-08'
  },
  {
    id: 'act-7',
    meetingId: 'meet-weekly-sync',
    meetingTitle: 'Weekly Product Sync',
    task: 'Configure Linear webhook & Jira issue sync',
    assignee: 'Amit Shah',
    assigneeRole: 'Backend Lead',
    assigneeAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    deadline: 'Sep 10, 2026',
    originalDeadlinePhrase: 'tomorrow evening',
    priority: 'Medium',
    confidence: 91,
    status: 'done',
    sourceTimestamp: '09:15',
    sourceText: 'Amit will configure the webhook pipeline so all confirmed meeting items auto-populate Linear tickets.',
    detectedEntities: {
      assignee: 'Amit Shah',
      task: 'Configure Linear webhook',
      deadline: 'Sep 10',
      tags: ['DevOps', 'Linear']
    },
    isConfirmed: true,
    createdAt: '2026-09-08'
  },
  {
    id: 'act-8',
    meetingId: 'meet-marketing-review',
    meetingTitle: 'Marketing Strategy Review',
    task: 'Finalize customer interview case studies',
    assignee: 'Priya Mehta',
    assigneeRole: 'Marketing Lead',
    assigneeAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    deadline: 'Sep 16, 2026',
    originalDeadlinePhrase: 'next Wednesday',
    priority: 'Medium',
    confidence: 89,
    status: 'in-progress',
    sourceTimestamp: '14:20',
    sourceText: 'Priya to wrap up 3 enterprise user testimonials for the new landing page.',
    detectedEntities: {
      assignee: 'Priya Mehta',
      task: 'Customer case studies',
      deadline: 'Sep 16',
      tags: ['Content', 'Marketing']
    },
    isConfirmed: true,
    createdAt: '2026-09-07'
  }
];

export const initialDecisions: Decision[] = [
  {
    id: 'dec-1',
    meetingId: 'meet-q4-strategy',
    meetingTitle: 'Weekly Product Sync',
    text: 'Launch version 2 next Monday across all staging and production channels.',
    status: 'confirmed',
    category: 'Consensus',
    confidence: 94,
    timestamp: 'Sep 8, 2026 · 18:42',
    sourceText: "Manager (Alex Mercer): 'Okay, we've decided to launch version 2 next Monday. Everyone aligns?' — Rahul Patel: 'Yes, infrastructure is green.' — Amit Shah: 'Ready on docs and pipeline.'",
    citationSpeaker: 'Alex Mercer',
    details: 'Approval finalized across engineering, design, and release management leads. Deployment schedule locked in for 09:00 UTC staging smoke tests followed by zero-downtime rolling prod rollout.',
    quorumStatus: '100% Consensus',
    signaturesCount: '4/4 Lead Signatures',
    triggeredIntegration: 'Release Pipeline & Jira Milestone #V2-LAUNCH',
    createdAt: '2026-09-08'
  },
  {
    id: 'dec-2',
    meetingId: 'meet-arch-review',
    meetingTitle: 'Architecture Review',
    text: 'Deprecate legacy v1 webhook endpoints by end of Q4.',
    status: 'confirmed',
    category: 'Architecture',
    confidence: 97,
    timestamp: 'Sep 5, 2026 · 41:10',
    sourceText: "Amit Shah: 'We will enforce deprecation of v1 webhook endpoints on Dec 31. Notices will be broadcast in October.'",
    citationSpeaker: 'Amit Shah (Principal Architect)',
    details: 'Mandatory sunsetting plan approved. Developer relations will dispatch 90-day, 60-day, and 15-day sunset notices to registered enterprise partners.',
    owner: 'Amit Shah (Principal Architect)',
    targetDate: 'Dec 31, 2026',
    quorumStatus: 'Architecture Consensus',
    signaturesCount: '3/3 Architects Signed',
    createdAt: '2026-09-05'
  },
  {
    id: 'dec-3',
    meetingId: 'meet-q4-strategy',
    meetingTitle: 'Q4 Product Strategy',
    text: 'Adopt Stripe Billing v3 vs Custom Invoicing Engine',
    status: 'pending',
    category: 'Sign-off Required',
    confidence: 88,
    timestamp: 'Sep 7, 2026 · 28:05',
    sourceText: 'Engineering team proposes switching to hosted Stripe Customer Portal & Billing v3 to bypass 4-month custom backend implementation. Finance flagged 0.7% transaction margin delta.',
    details: 'Proposals requiring executive tie-breaker or designated lead sign-off before engineering sprint allocation.',
    quorumStatus: '3 In Favor · 1 In Review · 0 Opposed',
    votesInFavor: ['Rahul Patel', 'Amit Shah', 'Sarah Lin'],
    votesInReview: ['Alex Mercer (Reviewing Margin Analysis)'],
    aiSuggestion: 'Voting expires in 48 hours. Alex Mercer vote needed.',
    createdAt: '2026-09-07'
  },
  {
    id: 'dec-4',
    meetingId: 'meet-q4-strategy',
    meetingTitle: 'Executive Pricing Council',
    text: 'Enterprise Pricing Tier Structure & Seat Minimums',
    status: 'open',
    category: 'Unresolved Debate',
    confidence: 76,
    timestamp: 'Detected at: 32:14',
    sourceText: "Jay Patel: 'We should probably discuss the pricing model again before enterprise outreach. Imposing a 25-seat floor might stall mid-market conversions.' — Alex Mercer: 'Agreed, we need sales velocity data before locking that clause. Let's run a 14-day cohort first.'",
    details: 'Divergent opinions on establishing a 25-seat hard minimum for SOC2 Type II compliance add-ons. Sales insists on custom flexible tiers for early enterprise pilots.',
    aiSuggestion: 'Requires dedicated 30-min alignment sync. Assign champion to prepare sales cohort telemetry.',
    createdAt: '2026-09-08'
  },
  {
    id: 'dec-5',
    meetingId: 'meet-q4-strategy',
    meetingTitle: 'Q4 Product Strategy & Sprint Planning',
    text: 'Serverless streaming infra cost impact and edge caching strategy',
    status: 'open',
    category: 'Unresolved Debate',
    confidence: 72,
    timestamp: 'Detected at: 42:15',
    sourceText: 'Speaker mentioned infra spikes without explicit owner assigned for cost recalculation before Q4 budget freeze.',
    details: 'Potential blocker: AWS Lambda cold starts without edge caching projected to inflate bill by 35%.',
    aiSuggestion: 'Schedule Follow-up with Jay Patel & Amit Shah.',
    createdAt: '2026-09-08'
  }
];

export const mockMeetings: Meeting[] = [
  {
    id: 'meet-q4-strategy',
    title: 'Q4 Product Strategy & Sprint Planning',
    date: 'September 8, 2026',
    duration: 45,
    durationFormatted: '45 mins',
    status: 'analyzed',
    platform: 'Google Meet',
    meetingUrl: 'meet.google.com/xyz-flow-meet',
    isRecording: true,
    recordingDuration: 'REC 42:15',
    participants: ['Alex Mercer', 'Rahul Patel', 'Amit Shah', 'Priya Mehta', 'Jay Patel', 'Neha Shah'],
    participantDetails: [
      {
        name: 'Alex Mercer',
        role: 'Product Lead (Host)',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        talkTime: '14:02',
        isHost: true,
        email: 'alex@acme.com'
      },
      {
        name: 'Rahul Patel',
        role: 'Product Designer',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        talkTime: '09:41',
        email: 'rahul@acme.com'
      },
      {
        name: 'Amit Shah',
        role: 'Backend Lead',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
        talkTime: '06:18',
        email: 'amit@acme.com'
      },
      {
        name: 'Priya Mehta',
        role: 'Marketing Lead',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
        talkTime: '05:44',
        email: 'priya@acme.com'
      },
      {
        name: 'Jay Patel',
        role: 'Infra Lead',
        avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80',
        talkTime: '04:30',
        email: 'jay@acme.com'
      },
      {
        name: 'Neha Shah',
        role: 'Frontend Lead',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
        talkTime: '02:40',
        email: 'neha@acme.com'
      }
    ],
    transcriptMessages: mockTranscriptMessages,
    actionItems: initialActionItems.filter(item => item.meetingId === 'meet-q4-strategy'),
    decisions: initialDecisions.filter(dec => dec.meetingId === 'meet-q4-strategy'),
    summary: 'Executive alignment across engineering and product confirmed Version 2.0 release for next Monday. Key commitments locked for Rahul Patel (Landing page redesign due Sep 11), Amit Shah (Payment API integration due Sep 9), and Priya Mehta (Launch announcement due Sep 14). Unresolved debate remains on enterprise pricing tier seat minimums and AWS serverless cold start caching.',
    transcript: mockTranscriptMessages.map(m => `${m.speaker} (${m.timestamp}): "${m.text}"`).join('\n\n')
  },
  {
    id: 'meet-weekly-sync',
    title: 'Weekly Product Sync',
    date: 'September 8, 2026',
    duration: 30,
    durationFormatted: '30 mins',
    status: 'analyzed',
    platform: 'Google Meet',
    meetingUrl: 'meet.google.com/sync-weekly',
    participants: ['Alex Mercer', 'Rahul Patel', 'Amit Shah', 'Priya Mehta', 'Jay Patel', 'Neha Shah', 'Sarah Lin', 'David K'],
    participantDetails: [
      { name: 'Alex Mercer', role: 'Product Lead', talkTime: '10:15', isHost: true },
      { name: 'Rahul Patel', role: 'Designer', talkTime: '06:20' },
      { name: 'Amit Shah', role: 'Backend Lead', talkTime: '05:10' },
      { name: 'Priya Mehta', role: 'Marketing', talkTime: '04:15' }
    ],
    actionItems: initialActionItems.filter(item => item.meetingId === 'meet-weekly-sync'),
    decisions: initialDecisions.filter(dec => dec.id === 'dec-1'),
    summary: 'Synchronized weekly KPIs, resolved design blockers on checkout step 2, and scheduled staging validation tests.',
    transcript: 'Alex Mercer: Team, our ARR target is on track. Let us verify sprint blockers before Friday.'
  },
  {
    id: 'meet-marketing-review',
    title: 'Marketing Strategy Review',
    date: 'September 7, 2026',
    duration: 35,
    durationFormatted: '35 mins',
    status: 'analyzed',
    platform: 'Zoom',
    participants: ['Priya Mehta', 'Alex Mercer', 'Sarah Lin', 'Elena Rostova', 'Mark Vance'],
    actionItems: initialActionItems.filter(item => item.meetingId === 'meet-marketing-review'),
    decisions: initialDecisions.filter(dec => dec.id === 'dec-3'),
    summary: 'Reviewed outbound campaign conversions, planned podcast sponsorship schedule, and reviewed customer case studies for V2 launch.',
    transcript: 'Priya: The click-through rate on our developer teaser jumped 42% week over week.'
  },
  {
    id: 'meet-arch-review',
    title: 'Architecture Review: Cloud Pipeline',
    date: 'September 5, 2026',
    duration: 50,
    durationFormatted: '50 mins',
    status: 'analyzed',
    platform: 'Google Meet',
    participants: ['Amit Shah', 'Jay Patel', 'Neha Shah', 'Alex Mercer', 'Carlos Gomez', 'Lian Wei'],
    actionItems: [],
    decisions: initialDecisions.filter(dec => dec.id === 'dec-2'),
    summary: 'Architectural committee confirmed deprecation of legacy v1 webhooks by December 31, 2026 and agreed on gRPC for internal service hops.',
    transcript: 'Amit Shah: The migration to gRPC microservices has reduced P99 latency by 32%.'
  }
];

export const DEMO_SAMPLE_TRANSCRIPT = `Alex Mercer (Product Lead):
"Welcome everyone to our Q4 Sprint & Architecture alignment. Let's start with the web refresh deliverables and staging deadlines."

Rahul Patel:
"I'll finish the landing page redesign by Friday, including responsive mobile layouts and the Figma design system handoff."

Amit Shah:
"I'll complete the payment API integration before Wednesday. Stripe webhook retry latency is now down to 120ms."

Priya Mehta:
"I'll prepare the launch announcement by next Monday and coordinate with PR for tech publication embargos."

Alex Mercer (Manager):
"Okay, we've decided to launch version 2 next Monday across all staging and production channels. Everyone aligns? Infrastructure is green, docs are verified."

Jay Patel:
"We should probably discuss the pricing model again before enterprise outreach. Imposing a 25-seat floor might stall mid-market conversions."

Neha Shah:
"I will implement the responsive mobile navigation drawer and make sure drawer gestures feel native on iOS."

Jay Patel:
"Regarding serverless streaming infra cost: if we deploy the dynamic hero without edge caching, AWS Lambda cold starts will spike our hosting bill by 35%. We need sign-off before Friday."`;
