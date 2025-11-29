# Sutra - Product Requirements Document
> **Tagline**: Patient's story, shared, and powered by agentic AI.  
> **Event**: MumbaiHacks 2024 (16-hour Agentic AI Hackathon - HealthTech Track)

---

## 1. Executive Summary

Sutra solves the **context loss problem** in healthcare by creating a persistent, AI-powered communication layer between patients and doctors. Patients carry a single QR code (Sutra ID) that unlocks their complete medical context. Doctors scan to join chat sessions where they can share findings via voice notes that get transcribed, summarized, and structured by AI agents.

---

## 2. User Personas

### 2.1 Patient (Authenticated User)
- Creates Sutra account, completes onboarding
- Owns a permanent Sutra ID (QR code)
- Views medical history, medicine todos, and interacts with AI copilot
- Controls who accesses their data via session-based sharing

### 2.2 Doctor (Anonymous User via Supabase)
- Scans patient's QR to join/create sessions
- No account required (frictionless access)
- Records findings via text/voice, creates referrals
- Has own dashboard to view all patient sessions and AI copilot

---

## 3. Core User Flows

### 3.1 Patient Onboarding Flow
```
Landing Page → Google OAuth → Onboarding Form → Generate Sutra ID QR → /me Dashboard
```

**Onboarding collects:**
- Basic Info: Name, DOB, Gender, Blood Type, Emergency Contact
- Medical History: Chronic conditions, past surgeries, known allergies
- Current Medications: Name, dosage, frequency
- Optional: Upload existing medical records (images/PDFs)

### 3.2 Doctor Session Flow (New Patient Visit)
```
Scan QR (/[userId]/new) → Anonymous Auth → Session Created → Redirect to /[userId]/[sessionId]
                                                    ↓
                                         See Health State Card
                                                    ↓
                                    Record findings (text/voice)
                                                    ↓
                                    AI processes → Summary UI
                                                    ↓
                              (Optional) Create Referral QR → Another doctor joins SAME session
```

### 3.3 Doctor Session Flow (Returning Visit)
```
Scan QR (/[userId]/new) → Recognize anonymous user → Show past sessions OR create new
                                                    ↓
                                    Access previous findings & continue
```

### 3.4 Referral Flow (Within Session)
```
Doctor A in session → Creates Referral → Referral QR appears in chat
                                                    ↓
                        Patient shows QR to Doctor B → Doctor B scans
                                                    ↓
                              Doctor B joins SAME session thread
                                                    ↓
                        Doctor B sees all previous messages + Health State Card
```

---

## 4. Information Architecture

### 4.1 Route Structure

```
/                           # Landing page (unauthenticated patients)
/auth/onboarding            # Patient onboarding wizard
/me                         # Patient dashboard (mobile nav: Home | Meds | Copilot)
/me/qr                      # Full-screen Sutra ID QR display
/[userId]/new               # Creates new session, redirects to session page
/[userId]/[sessionId]       # Chat session page (accessible by patient + doctors in session)
/doctor                     # Doctor dashboard (mobile nav: Sessions | Copilot)
```

### 4.2 Patient Dashboard (`/me`) - Bottom Nav
| Tab | Description |
|-----|-------------|
| **Home** | Health State Card, recent sessions, quick actions |
| **Meds** | Medicine todo list with checkboxes, schedules extracted from prescriptions |
| **Copilot** | AI chat with Gen UI - ask about health, get reminders, manage data |

### 4.3 Doctor Dashboard (`/doctor`) - Bottom Nav
| Tab | Description |
|-----|-------------|
| **Sessions** | List of all patient sessions (searchable, filterable by date) |
| **Copilot** | AI chat to query across patients, find conditions, get clinical suggestions |

---

## 5. Feature Specifications

### 5.1 Health State Card
**Displayed at top of every session for quick context**

| Field | Source |
|-------|--------|
| Patient Name & Age | Onboarding |
| Blood Type | Onboarding |
| Known Allergies | Onboarding + AI extraction |
| Chronic Conditions | Onboarding + AI extraction |
| Current Medications | Onboarding + AI extraction from sessions |
| Recent Diagnoses | AI extraction from last 3 sessions |
| Emergency Contact | Onboarding |

**Collapsible/expandable** - Shows summary by default, expands for full details.

### 5.2 Chat Session (`/[userId]/[sessionId]`)

**Message Types:**
| Type | Description | UI Component |
|------|-------------|--------------|
| `text` | Plain text message | Chat bubble |
| `voice` | Audio blob + transcription + AI summary | Audio player + Summary card |
| `prescription` | Structured medicine list | Prescription card with medicine chips |
| `referral` | QR code for another doctor to join | Referral card with QR |
| `upload` | Images/PDFs (scans, reports) | File preview card |
| `system` | Session events (doctor joined, referral created) | System message |

**Voice Note Flow:**
```
Doctor taps mic → Records audio → Uploads to storage → 
Backend transcribes (multi-language) → Extracts entities → 
Returns: { transcription, summary, medicines[], conditions[], referral? }
```

**AI Summary Card (after voice note):**
```
┌─────────────────────────────────────────┐
│ 🎤 Voice Note                    [▶ Play]│
├─────────────────────────────────────────┤
│ 📝 Summary                              │
│ Patient presents with 3-day fever and   │
│ right-sided abdominal pain. Suspected   │
│ appendicitis. Referred to surgery.      │
├─────────────────────────────────────────┤
│ 💊 Prescribed                           │
│ • Pan D - 1 tab daily                   │
│ • Taxim 200mg - twice daily             │
├─────────────────────────────────────────┤
│ 🏥 Referral                             │
│ Surgery Department                      │
│ [Create Referral QR]                    │
└─────────────────────────────────────────┘
```

### 5.3 Medicine Todo List (`/me` - Meds tab)
- Aggregates all medicines from active prescriptions
- Each medicine has: Name, Dosage, Frequency, Checkbox for "taken today"
- Shows conditional follow-ups extracted from sessions
- Visual indicator for overdue/upcoming

### 5.4 Copilot Chat (Gen UI)
**For Patients:**
- "What medicines am I taking?"
- "Summarize my last visit"
- "When is my follow-up?"
- Responses render as interactive UI components

**For Doctors:**
- "Show me patients with diabetes"
- "What did I prescribe to the patient I saw yesterday?"
- "Find patients with recurring fever"
- Responses render as patient cards, session links

### 5.5 Notifications (Mocked for Hackathon)
- In-app notification bell
- Show extracted reminders: "Follow up with Dr. Shetty if no relief in 2 days"
- Clicking notification navigates to relevant session with highlighted message

---

## 6. Database Schema

### 6.1 Tables

```sql
-- Patients (authenticated users)
users (
  id UUID PK REFERENCES auth.users,
  email TEXT UNIQUE,
  full_name TEXT,
  onboarded BOOLEAN,
  personal_details JSONB,  -- { dob, gender, blood_type, emergency_contact }
  medical_profile JSONB,   -- { allergies[], chronic_conditions[], current_meds[] }
  created_at, updated_at
)

-- Doctors (anonymous users, tracked by anonymous_id)
doctors (
  id UUID PK DEFAULT gen_random_uuid(),
  anonymous_id UUID REFERENCES auth.users(id),  -- Supabase anonymous user
  display_name TEXT,  -- Optional, entered when joining first session
  specialty TEXT,
  created_at
)

-- Chat sessions
sessions (
  id UUID PK,
  patient_id UUID REFERENCES users(id),
  created_by_doctor_id UUID REFERENCES doctors(id),
  status TEXT DEFAULT 'active',  -- active, closed
  health_snapshot JSONB,  -- Snapshot of patient's health state at session start
  created_at, updated_at
)

-- Session participants (doctors in session)
session_participants (
  id UUID PK,
  session_id UUID REFERENCES sessions(id),
  doctor_id UUID REFERENCES doctors(id),
  role TEXT,  -- 'primary', 'referred'
  joined_at
)

-- Messages in session
messages (
  id UUID PK,
  session_id UUID REFERENCES sessions(id),
  sender_type TEXT,  -- 'patient', 'doctor', 'system'
  sender_id UUID,    -- user.id or doctor.id
  message_type TEXT, -- 'text', 'voice', 'prescription', 'referral', 'upload', 'system'
  content JSONB,     -- Structure varies by message_type
  ai_processed JSONB, -- { transcription, summary, entities }
  created_at
)

-- Referrals
referrals (
  id UUID PK,
  session_id UUID REFERENCES sessions(id),
  created_by_doctor_id UUID REFERENCES doctors(id),
  referral_code TEXT UNIQUE,  -- Short code for QR
  target_specialty TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending',  -- pending, accepted
  accepted_by_doctor_id UUID REFERENCES doctors(id),
  created_at, accepted_at
)

-- Medicine todos (extracted from sessions)
medicine_todos (
  id UUID PK,
  patient_id UUID REFERENCES users(id),
  session_id UUID REFERENCES sessions(id),
  message_id UUID REFERENCES messages(id),
  medicine_name TEXT,
  dosage TEXT,
  frequency TEXT,
  duration TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at
)

-- Follow-up reminders (extracted from sessions)
follow_up_reminders (
  id UUID PK,
  patient_id UUID REFERENCES users(id),
  session_id UUID REFERENCES sessions(id),
  message_id UUID REFERENCES messages(id),
  reminder_text TEXT,
  trigger_condition TEXT,  -- 'no_relief', 'after_days'
  trigger_value TEXT,      -- '2 days', etc.
  is_triggered BOOLEAN DEFAULT FALSE,
  created_at
)
```

### 6.2 Message Content JSONB Structures

```typescript
// text message
{ text: string }

// voice message
{ 
  audio_url: string,
  duration_seconds: number,
  transcription: string,
  language_detected: string,
  ai_summary: string,
  extracted_entities: {
    medicines: { name, dosage, frequency }[],
    conditions: string[],
    referral?: { specialty, doctor_name?, condition }
  }
}

// prescription message
{
  medicines: { name, dosage, frequency, duration, notes? }[],
  instructions: string
}

// referral message
{
  referral_id: string,
  referral_code: string,
  target_specialty: string,
  notes: string,
  qr_data: string  // URL to join
}

// upload message
{
  file_url: string,
  file_type: string,  // 'image', 'pdf'
  file_name: string,
  ai_extracted_text?: string  // OCR if applicable
}

// system message
{
  event: string,  // 'doctor_joined', 'referral_created', 'session_closed'
  actor_name: string,
  metadata: object
}
```

---

## 7. API Endpoints (Python Backend)

### 7.1 Voice Processing
```
POST /api/voice/process
Body: { audio_base64, language_hint? }
Response: { transcription, summary, entities, language_detected }
Streaming: SSE for real-time transcription updates
```

### 7.2 Copilot Chat
```
POST /api/copilot/chat
Body: { user_type, user_id, message, context? }
Response: SSE stream of { type: 'text' | 'ui_component', content }
```

### 7.3 Health State Generation
```
POST /api/health-state/generate
Body: { patient_id }
Response: { health_state_card }
```

### 7.4 Entity Extraction (for existing text)
```
POST /api/extract/entities
Body: { text, context? }
Response: { medicines[], conditions[], referrals[], follow_ups[] }
```

---

## 8. Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TailwindCSS 4, Lucide Icons |
| State | React hooks, Supabase Realtime subscriptions |
| Auth | Supabase Auth (Google OAuth for patients, Anonymous for doctors) |
| Database | Supabase PostgreSQL |
| Storage | Supabase Storage (voice notes, uploads) |
| Real-time | Supabase Realtime (chat messages) |
| AI Backend | Python, FastAPI, LangGraph |
| AI Models | OpenAI/Groq for LLM, Whisper for transcription |
| Streaming | Server-Sent Events (SSE) |

---

## 9. Hackathon MVP Scope

### 9.1 Must Have (Core Demo Flow)
- [ ] Patient onboarding with basic fields
- [ ] Sutra ID QR generation and display
- [ ] Doctor QR scan → Anonymous auth → Session creation
- [ ] Chat session with text messages (real-time)
- [ ] Voice note recording → Backend transcription → AI summary
- [ ] Health State Card display
- [ ] Referral creation and QR in chat
- [ ] Doctor joining via referral QR (same session)
- [ ] Basic patient dashboard with session history
- [ ] Basic doctor dashboard with session list

### 9.2 Should Have (Impressive Features)
- [ ] Medicine todo extraction and display
- [ ] Multi-language transcription (Hindi/Hinglish/English)
- [ ] Patient copilot chat with Gen UI
- [ ] Doctor copilot for patient queries
- [ ] Prescription structured card in chat
- [ ] Follow-up reminder extraction (mocked notification)

### 9.3 Nice to Have (Polish)
- [ ] File upload in chat
- [ ] OCR extraction from uploaded reports
- [ ] PWA install prompt
- [ ] Print-friendly Sutra ID card
- [ ] Session search and filters

---

## 10. UI/UX Guidelines

### 10.1 Design Principles
- **Mobile-first**: Designed for phone scanning in clinics
- **Minimal friction**: Doctors must access in <5 seconds
- **Clear hierarchy**: Health State Card always visible
- **Accessible**: High contrast, large tap targets

### 10.2 Visual Language
- **Primary**: Deep teal/medical green
- **Accent**: Warm amber (for actions, notifications)
- **Background**: Off-white with subtle texture
- **Cards**: White with soft shadows, rounded corners
- **Typography**: Clean sans-serif, clear hierarchy

### 10.3 Motion
- Smooth page transitions
- Subtle card animations
- Loading states with skeleton UI
- Voice recording pulse animation

---

## 11. Success Metrics (Demo)

| Metric | Target |
|--------|--------|
| QR scan to first message | < 5 seconds |
| Voice note to AI summary | < 10 seconds |
| Health State Card render | < 2 seconds |
| End-to-end referral flow | Demonstrable in 2 minutes |

---

## 12. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Voice transcription latency | Pre-record demo audio, cache responses |
| Supabase Realtime issues | Fallback to polling |
| Multi-language accuracy | Focus on clear speech in demo |
| Time constraints | Prioritize core flow, mock secondary features |

---

*Last Updated: November 28, 2025*
*Version: 1.0.0*

