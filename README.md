# Meet2Action (MeetFlow AI) 🎙️⚡

> **Real-Time AI-Powered Meeting Intelligence & Automated Action Items Platform**  
> Transform live meetings into structured transcripts, instant action items, key decisions, and follow-ups as you speak.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-meet2action.onrender.com-006194?style=for-the-badge&logo=render&logoColor=white)](https://meet2action.onrender.com)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![LiveKit](https://img.shields.io/badge/LiveKit-WebRTC-FF4F00?style=for-the-badge&logo=webrtc&logoColor=white)](https://livekit.io/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-3.6%20Flash-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS%204.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## 🌐 Live Application

Access the production deployment directly in your browser:  
👉 **[https://meet2action.onrender.com](https://meet2action.onrender.com)**

---

## 🚀 Overview

**Meet2Action** is an enterprise-grade, real-time meeting collaboration and intelligence platform designed to eliminate manual note-taking and lost action items. Powered by **LiveKit WebRTC** for ultra-low latency multi-party video conferencing, **Realtime Streaming STT**, and **Google Gemini 3.6 Flash**, Meet2Action listens to live meeting conversations and automatically detects:

- 📋 **Action Items & Tasks**: Assignees, priorities, deadlines, and verbatim context phrases extracted live.
- 🤝 **Consensus Decisions**: Key strategic decisions and conclusions reached during the discussion.
- 💬 **Open Discussions & Debates**: Unresolved questions and debate items flagged for post-meeting follow-up.
- 📝 **Verbatim Multi-Speaker Transcripts**: Realtime streaming speech-to-text with entity highlighting and speaker attribution.

---

## ✨ Key Features

### 🎥 Multi-Party WebRTC Video Conferencing
- **Adaptive Dynamic Grid (Google Meet Style)**: Responsive video stage dynamically reorganizes based on participant count (1: centered hero, 2: 50/50 side-by-side, 3: 3-column, 4: 2x2 grid, 6+: auto-flow grid).
- **Presentation & Screen Sharing**: High-resolution screen share hero stage with an unclipped participant thumbnail strip.
- **Spotlight / View Switcher**: Interactive `[Grid]` ↔ `[Speaker]` view toggle at any time.
- **Clean Hardware Release**: Pre-meeting lobby preview with zero device-locking issues on desktop or mobile.

### ⚡ Real-Time Speech-to-Text (STT)
- Streaming speech transcription using LiveKit Agents & Inference models (`google/gemini-3.5-transcribe` / Deepgram Nova-3).
- Instant interim transcription streaming with sub-second feedback.
- Resilient background auto-dispatch and reconnection with zero video interruptions.

### 🧠 Gemini 3.6 Flash Intelligence Pipeline
- High-throughput, decoupled queue processing for meeting utterances.
- Automated extraction of actionable tasks with smart deadline normalization (e.g., "by next Friday" → normalized date).
- Color-coded entity tagging live in the transcript feed (Assignee, Task, Deadline, Decision).

### 📅 Real Meeting Scheduling & Reminders
- Schedule future meetings with title, date, time, duration, timezone, and guest invitations.
- Unique LiveKit room generation with shareable meeting invite links.
- Automated background time-based reminders:
  - 🔔 **15-minute advance notice** toast + audio chime alert.
  - 🚨 **5-minute urgent reminder** toast + double-pulse chime.
  - Quick **"Join Now"** direct navigation button.

### 💬 In-Meeting Engagement & Reactions
- Floating animated emoji reactions (`👍`, `❤️`, `👏`, `🎉`, `🔥`, `💡`) synced across all peers via LiveKit DataChannel.
- Integrated in-meeting live text chat with unread notification badges.
- Real-time participant roster and connection health indicators.

### 📊 Post-Meeting Analytics & History
- Comprehensive meeting intelligence reports with executive summaries.
- Verbatim transcript viewers with search and timestamp filtering.
- Action items management dashboard with status tracking (Todo / In Progress / Done).

---

## 🛠️ Architecture & Tech Stack

```
                     ┌────────────────────────────────────────────────────────┐
                     │              Meet2Action Client (React 19)             │
                     │  - Adaptive Video Grid (LiveKit Components React)      │
                     │  - Realtime Insights Panel (Action Items, Decisions)   │
                     │  - Meeting Scheduler & Reminders (Zustand)             │
                     └───────────────▲────────────────────────▲───────────────┘
                                     │                        │
                         WebRTC Media & DataChannel      HTTP / REST API
                                     │                        │
                                     ▼                        ▼
                     ┌───────────────────────┐   ┌────────────────────────────┐
                     │     LiveKit Cloud     │   │   Express / Node.js Server │
                     │  - SFU Media Routing  │   │  - Token Minting           │
                     │  - Data Channels      │   │  - STT Agent Dispatch      │
                     │  - Egress Recording   │   │  - Gemini 3.6 Intelligence │
                     └───────────────▲───────┘   └────────────────────────────┘
                                     │
                                     ▼
                     ┌───────────────────────┐
                     │   Python STT Agent    │
                     │  (livekit-agents CLI) │
                     │  - Realtime STT Stream│
                     └───────────────────────┘
```

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS 4.0, Motion, Zustand, Lucide React |
| **Media & Realtime** | LiveKit Client SDK, LiveKit Components React, WebRTC |
| **Backend** | Express 4, Node.js, `livekit-server-sdk`, `tsx` |
| **AI & Intelligence**| Google Gemini 3.6 Flash (`@google/genai`), LiveKit Inference STT |
| **Agent Worker** | Python 3, `livekit-agents`, `livekit-plugins-deepgram` |
| **Deployment** | Render (Production Web Service) |

---

## 🚦 Getting Started Locally

### Prerequisites
- Node.js 20+
- Python 3.10+ (for local STT worker)
- LiveKit Cloud account ([livekit.io](https://livekit.io))
- Google AI Studio API Key ([aistudio.google.com](https://aistudio.google.com/))

### 1. Clone the Repository
```bash
git clone https://github.com/Nisarg266/Meet2Action.git
cd Meet2Action
```

### 2. Install Dependencies
```bash
# Install frontend & server dependencies
npm install

# Install Python agent dependencies (optional for local STT agent)
pip install -r agent/requirements.txt
```

### 3. Configure Environment Variables
Create a `.env` file in the project root:
```env
# Google Gemini API
GEMINI_API_KEY="your-gemini-api-key"

# LiveKit Cloud Credentials
LIVEKIT_URL="wss://your-project.livekit.cloud"
LIVEKIT_API_KEY="your-livekit-api-key"
LIVEKIT_API_SECRET="your-livekit-api-secret"

# App URL (optional for self-referential links)
APP_URL="http://localhost:3000"
```

### 4. Run the Development Environment

You can run the full stack locally:

```bash
# Terminal 1: Run React Frontend (Vite)
npm run dev

# Terminal 2: Run Express Token & API Server
npm run server

# Terminal 3: Run LiveKit Python STT Agent (Optional)
npm run agent
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📦 Available Scripts

- `npm run dev` — Starts the Vite development server on port `3000`.
- `npm run server` — Starts the Express backend server (`server/index.ts`).
- `npm run agent` — Launches the LiveKit Python STT agent worker (`agent/agent.py dev`).
- `npm run build` — Compiles TypeScript and builds the production bundle via Vite.
- `npm run lint` — Runs TypeScript type-checking across the codebase.

---

## 🚀 Production Deployment (Render)

The application is configured for single-service deployment on **Render**:

- **Environment**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`
- **Environment Variables**:
  - `GEMINI_API_KEY`
  - `LIVEKIT_URL`
  - `LIVEKIT_API_KEY`
  - `LIVEKIT_API_SECRET`
  - `PORT`: `10000` (automatically set by Render)

Live URL: **[https://meet2action.onrender.com](https://meet2action.onrender.com)**

---

## 📄 License

This project is licensed under the MIT License.
