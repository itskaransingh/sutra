# Sutra 🏥

> **Patient's story, shared, and powered by agentic AI.**

Built for MumbaiHacks 2025 - 16hr Agentic AI Hackathon (HealthTech Track)

## The Problem

Patients lose critical medical context when moving between doctors. Whether it's a hospital referral or a return visit to a local clinic, valuable information gets lost - leading to repeated examinations, incomplete histories, and potential medical risks.

## The Solution

Sutra creates a persistent, AI-powered communication layer between patients and doctors:

- **One QR, Complete History** - Patients get a permanent Sutra ID that doctors scan
- **Voice-Powered Notes** - Doctors speak naturally, AI transcribes and extracts medical entities
- **Seamless Referrals** - Context travels with patients between specialists
- **Smart Extraction** - Medicines, conditions, and follow-ups are automatically tracked

## Tech Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS 4
- **Auth**: Supabase (Google OAuth for patients, Anonymous for doctors)
- **Database**: Supabase PostgreSQL with JSONB
- **Real-time**: Supabase Realtime
- **AI Backend**: Python + FastAPI + LangGraph (separate workspace)

## Quick Start

### Prerequisites

- Node.js 18+ or Bun
- Supabase project (free tier works)
- Google OAuth credentials (Supabase console)

### Setup

1. **Clone and install**
   ```bash
   git clone <repo-url>
   cd sutra
   bun install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   NEXT_PUBLIC_AI_API_URL=http://localhost:8000  # Python backend
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Setup database**
   ```bash
   # Push migrations to Supabase
   npx supabase db push
   ```

4. **Configure Supabase Auth**
   - Enable Google OAuth in Supabase Dashboard
   - Enable Anonymous Sign-in
   - Add redirect URL: `http://localhost:3000/auth/callback`

5. **Create storage bucket** (for voice notes)
   - In Supabase Dashboard → Storage
   - Create bucket: `voice-notes`
   - Set to public (for hackathon simplicity)

6. **Run development server**
   ```bash
   bun dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## User Flows

### Patient Flow
1. Sign in with Google → Complete onboarding
2. View dashboard with health summary
3. Show Sutra ID QR to doctors
4. Track medicines and use AI copilot

### Doctor Flow
1. Scan patient's QR code
2. Enter name (first time only)
3. View patient's health state card
4. Send text/voice messages
5. AI processes voice → extracts entities
6. Create referrals with QR codes

## Project Structure

```
app/
├── page.tsx                    # Landing page
├── auth/
│   ├── callback/route.ts       # OAuth callback
│   └── onboarding/page.tsx     # Patient onboarding
├── me/                         # Patient dashboard
│   ├── page.tsx               # Home
│   ├── meds/page.tsx          # Medicine tracker
│   ├── copilot/page.tsx       # AI chat
│   └── qr/page.tsx            # Full-screen QR
├── doctor/                     # Doctor dashboard
│   ├── page.tsx               # Sessions list
│   └── copilot/page.tsx       # Doctor AI chat
├── [patientId]/
│   ├── new/page.tsx           # Create session
│   └── [sessionId]/page.tsx   # Chat session
└── actions/                    # Server actions
    ├── onboarding.ts
    ├── session.ts
    ├── message.ts
    └── referral.ts

components/
├── ui/                         # Primitives
├── shared/                     # Layout components
├── patient/                    # Patient-specific
├── doctor/                     # Doctor-specific
└── session/                    # Chat components
```

## Demo Script

1. **Patient signs up** - Complete onboarding with medical info
2. **Show QR** - Display Sutra ID
3. **Doctor scans** - Anonymous auth, enters name
4. **View health card** - See patient's allergies, conditions, meds
5. **Send voice note** - AI transcribes and extracts:
   - Medicines prescribed
   - Conditions diagnosed
   - Referral suggestions
6. **Create referral** - QR appears in chat
7. **Second doctor joins** - Same session, full context

## AI Backend Integration

The frontend expects these endpoints from the Python backend:

```
POST /api/voice/process
Body: { audio_base64, language_hint? }
Returns: { transcription, summary, entities, language_detected }

POST /api/copilot/chat  
Body: { user_type, user_id, message, context? }
Returns: SSE stream of { type, content }
```

If the backend is unavailable, the app uses mock responses for demo purposes.

## License

MIT - Built with ❤️ at MumbaiHacks 2025
