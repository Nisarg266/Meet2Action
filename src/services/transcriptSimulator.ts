import { getPersona } from './liveAiService';

/**
 * Mock STT layer for Demo Mode.
 *
 * Real architecture (see README/spec):
 *   Browser -> LiveKit WebRTC -> Audio stream -> STT / LiveKit Agent -> live transcript
 *
 * Until the STT agent is deployed, this simulator emits realistic transcript
 * events progressively so the full Live Meeting demo (transcript -> AI
 * extraction -> insights panel) works without external services.
 */

export interface SimulatedUtterance {
  speaker: string;
  text: string;
}

const SCRIPT: SimulatedUtterance[] = [
  { speaker: 'Alex Mercer', text: "Alright, let's kick off the V2 launch readiness sync. Rahul, where are we on the landing page?" },
  { speaker: 'Rahul Patel', text: "I'll finish the landing page redesign by Friday." },
  { speaker: 'Amit Shah', text: "I'll complete the payment API integration before Wednesday." },
  { speaker: 'Neha Shah', text: "I will implement the responsive mobile navigation drawer by end of this week." },
  { speaker: 'Alex Mercer', text: "We've decided to launch version 2 next Monday." },
  { speaker: 'Jay Patel', text: "We should probably discuss the pricing model again — the enterprise seat minimums need a second look." },
  { speaker: 'Priya Mehta', text: "I'll prepare the launch announcement and press notes by next Monday." },
  { speaker: 'Rahul Patel', text: "The hero section copy still needs final review from legal before we ship it." },
  { speaker: 'Amit Shah', text: "Load testing on the payment service showed a 99.9% success rate under peak traffic." },
  { speaker: 'Jay Patel', text: "The serverless streaming infra cost could spike — we need to revisit edge caching before launch." },
  { speaker: 'Neha Shah', text: "I'll run the cross-browser QA pass on the staging build by Thursday." },
  { speaker: 'Priya Mehta', text: "Pricing model needs further discussion before the enterprise outreach starts." },
  { speaker: 'Alex Mercer', text: "Great — to summarize: V2 launches Monday, landing page Friday, payments Wednesday." },
];

const FILLERS: SimulatedUtterance[] = [
  { speaker: 'Amit Shah', text: "Can someone share the staging dashboard link in the chat?" },
  { speaker: 'Alex Mercer', text: "I'll send out the updated launch timeline right after this call." },
  { speaker: 'Neha Shah', text: "The new onboarding flow feels much smoother after the latest fixes." },
  { speaker: 'Jay Patel', text: "Monitoring dashboards look stable — no incidents since the last deploy." },
  { speaker: 'Priya Mehta', text: "The beta cohort feedback has been overwhelmingly positive so far." },
  { speaker: 'Rahul Patel', text: "I'll sync the final design tokens with the frontend team tomorrow." },
];

export interface SimulatorHandle {
  stop: () => void;
}

export interface SimulatorCallbacks {
  onUtterance: (utterance: { speaker: string; text: string; timestamp: string }) => void;
}

function wallClockTimestamp(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * Starts the progressive transcript simulation:
 * scripted events first (9–15s apart), then a loop of realistic fillers
 * (20–30s apart) so long-running meetings stay alive.
 */
export function startTranscriptSimulator(callbacks: SimulatorCallbacks): SimulatorHandle {
  let stopped = false;
  let scriptIndex = 0;
  let fillerIndex = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const emit = (utterance: SimulatedUtterance) => {
    if (stopped) return;
    callbacks.onUtterance({
      speaker: utterance.speaker,
      text: utterance.text,
      timestamp: wallClockTimestamp(),
    });
  };

  const randomBetween = (min: number, max: number) => min + Math.floor(Math.random() * (max - min));

  const runNext = () => {
    if (stopped) return;

    if (scriptIndex < SCRIPT.length) {
      emit(SCRIPT[scriptIndex++]);
      timer = setTimeout(runNext, randomBetween(9000, 15000));
    } else {
      emit(FILLERS[fillerIndex++ % FILLERS.length]);
      timer = setTimeout(runNext, randomBetween(20000, 30000));
    }
  };

  // First simulated utterance arrives shortly after the meeting starts.
  timer = setTimeout(runNext, randomBetween(4500, 6500));

  return {
    stop: () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    },
  };
}

/** Convenience: builds a full TranscriptMessage payload from a simulated utterance. */
export function toTranscriptPayload(
  utterance: { speaker: string; text: string; timestamp: string },
  sequence: number
) {
  const persona = getPersona(utterance.speaker);
  return {
    id: `tr-live-${sequence}`,
    timestamp: utterance.timestamp,
    speaker: persona.name,
    speakerRole: persona.role,
    avatar: persona.avatar,
    color: persona.color,
    text: utterance.text,
  };
}
