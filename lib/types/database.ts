// ========================================
// SUTRA DATABASE TYPES
// ========================================

// ========================================
// JSONB STRUCTURES
// ========================================

export interface PersonalDetails {
  dob?: string; // ISO date string
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  blood_type?:
    | "A+"
    | "A-"
    | "B+"
    | "B-"
    | "AB+"
    | "AB-"
    | "O+"
    | "O-"
    | "unknown";
  emergency_contact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface MedicalProfile {
  allergies?: string[];
  chronic_conditions?: string[];
  current_meds?: {
    name: string;
    dosage?: string;
    frequency?: string;
  }[];
  past_surgeries?: {
    name: string;
    year?: number;
  }[];
}

export interface HealthSnapshot {
  name: string;
  age: number;
  blood_type?: string;
  allergies: string[];
  chronic_conditions: string[];
  current_medications: {
    name: string;
    dosage?: string;
    frequency?: string;
  }[];
  recent_diagnoses?: string[];
  emergency_contact?: {
    name: string;
    phone: string;
  };
  generated_at: string;
}

// ========================================
// MESSAGE CONTENT TYPES
// ========================================

export interface TextMessageContent {
  text: string;
}

export interface VoiceMessageContent {
  audio_url: string;
  duration_seconds: number;
  transcription?: string;
  language_detected?: string;
}

export interface VoiceAIProcessed {
  transcription: string;
  summary: string;
  language_detected: string;
  entities: {
    medicines: {
      name: string;
      dosage?: string;
      frequency?: string;
      duration?: string;
    }[];
    conditions: string[];
    referral?: {
      specialty: string;
      doctor_name?: string;
      condition?: string;
    };
    follow_up?: {
      condition: string;
      timeframe: string;
      action: string;
    };
  };
}

export interface PrescriptionMessageContent {
  medicines: {
    name: string;
    dosage: string;
    frequency: string;
    duration?: string;
    notes?: string;
  }[];
  instructions?: string;
}

export interface ReferralMessageContent {
  referral_id: string;
  referral_code: string;
  target_specialty?: string;
  target_doctor_name?: string;
  notes?: string;
  qr_data: string; // URL to join: /[patientId]/[sessionId]?ref=[code]
}

export interface UploadMessageContent {
  file_url: string;
  file_type: "image" | "pdf" | "other";
  file_name: string;
  ai_extracted_text?: string;
}

export interface SystemMessageContent {
  event:
    | "doctor_joined"
    | "referral_created"
    | "session_closed"
    | "session_created";
  actor_name?: string;
  metadata?: Record<string, unknown>;
}

export type MessageContent =
  | TextMessageContent
  | VoiceMessageContent
  | PrescriptionMessageContent
  | ReferralMessageContent
  | UploadMessageContent
  | SystemMessageContent;

// ========================================
// TABLE TYPES
// ========================================

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  email_verified: boolean;
  onboarded: boolean;
  personal_details: PersonalDetails;
  medical_profile: MedicalProfile;
  created_at: string;
  updated_at: string;
}

export interface Doctor {
  id: string;
  anonymous_id: string | null;
  display_name: string | null;
  specialty: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  patient_id: string;
  created_by_doctor_id: string | null;
  status: "active" | "closed";
  health_snapshot: HealthSnapshot | null;
  created_at: string;
  updated_at: string;
}

export interface SessionParticipant {
  id: string;
  session_id: string;
  doctor_id: string;
  role: "primary" | "referred";
  joined_at: string;
}

export interface Message {
  id: string;
  session_id: string;
  sender_type: "patient" | "doctor" | "system";
  sender_id: string | null;
  message_type:
    | "text"
    | "voice"
    | "prescription"
    | "referral"
    | "upload"
    | "system";
  content: MessageContent;
  ai_processed: VoiceAIProcessed | null;
  created_at: string;
}

export interface Referral {
  id: string;
  session_id: string;
  created_by_doctor_id: string | null;
  referral_code: string;
  target_specialty: string | null;
  notes: string | null;
  status: "pending" | "accepted";
  accepted_by_doctor_id: string | null;
  created_at: string;
  accepted_at: string | null;
}

export interface MedicineTodo {
  id: string;
  patient_id: string;
  session_id: string | null;
  message_id: string | null;
  medicine_name: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
  is_active: boolean;
  created_at: string;
}

export interface FollowUpReminder {
  id: string;
  patient_id: string;
  session_id: string | null;
  message_id: string | null;
  reminder_text: string;
  trigger_condition: string | null;
  trigger_value: string | null;
  target_doctor_name: string | null;
  is_triggered: boolean;
  created_at: string;
}

// ========================================
// JOINED/ENRICHED TYPES
// ========================================

export interface SessionWithParticipants extends Session {
  patient?: User;
  participants?: (SessionParticipant & { doctor: Doctor })[];
  created_by_doctor?: Doctor;
}

export interface MessageWithSender extends Message {
  sender?: User | Doctor;
}

export interface SessionWithMessages extends Session {
  messages: MessageWithSender[];
}

// ========================================
// API RESPONSE TYPES (Python Backend)
// ========================================

export interface VoiceProcessingRequest {
  audio_base64: string;
  language_hint?: "en" | "hi" | "hinglish";
}

export interface VoiceProcessingResponse {
  transcription: string;
  summary: string;
  language_detected: string;
  entities: VoiceAIProcessed["entities"];
}

export interface CopilotChatRequest {
  user_type: "patient" | "doctor";
  user_id: string;
  message: string;
  context?: {
    session_id?: string;
    patient_id?: string;
  };
}

export interface CopilotChatStreamChunk {
  type: "text" | "ui_component" | "done";
  content?: string;
  component?: {
    type: "medicine_list" | "session_card" | "patient_card" | "reminder";
    data: Record<string, unknown>;
  };
}

export interface HealthStateRequest {
  patient_id: string;
}

export interface HealthStateResponse {
  health_state_card: HealthSnapshot;
}

// ========================================
// UI HELPER TYPES
// ========================================

export type BottomNavTab = "home" | "meds" | "copilot" | "sessions";

export interface QRData {
  type: "sutra_id" | "referral";
  url: string;
  patient_id?: string;
  session_id?: string;
  referral_code?: string;
}
