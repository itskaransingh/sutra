-- ========================================
-- SUTRA DATABASE SCHEMA
-- Patient's story, shared, and powered by agentic AI.
-- ========================================

-- ========================================
-- PATIENTS (Authenticated Users)
-- ========================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  onboarded BOOLEAN DEFAULT FALSE,
  personal_details JSONB DEFAULT '{}',  -- { dob, gender, blood_type, emergency_contact }
  medical_profile JSONB DEFAULT '{}',   -- { allergies[], chronic_conditions[], current_meds[] }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- DOCTORS (Anonymous Users)
-- ========================================
CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name TEXT,
  specialty TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- SESSIONS (Chat Sessions between Patient & Doctors)
-- ========================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by_doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  health_snapshot JSONB,  -- Snapshot of patient's health state at session start
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- SESSION PARTICIPANTS (Doctors in each session)
-- ========================================
CREATE TABLE session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'primary' CHECK (role IN ('primary', 'referred')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, doctor_id)
);

-- ========================================
-- MESSAGES (All message types in sessions)
-- ========================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('patient', 'doctor', 'system')),
  sender_id UUID,  -- user.id or doctor.id (NULL for system messages)
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'voice', 'prescription', 'referral', 'upload', 'system')),
  content JSONB NOT NULL DEFAULT '{}',  -- Structure varies by message_type
  ai_processed JSONB,  -- { transcription, summary, entities } for voice messages
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- REFERRALS
-- ========================================
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  created_by_doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  referral_code TEXT UNIQUE NOT NULL,  -- Short code for QR
  target_specialty TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  accepted_by_doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- ========================================
-- MEDICINE TODOS (Extracted from sessions)
-- ========================================
CREATE TABLE medicine_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  medicine_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  duration TEXT,
  instructions TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- FOLLOW-UP REMINDERS (Extracted from sessions)
-- ========================================
CREATE TABLE follow_up_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  reminder_text TEXT NOT NULL,
  trigger_condition TEXT,  -- 'no_relief', 'after_days', etc.
  trigger_value TEXT,      -- '2 days', etc.
  target_doctor_name TEXT, -- Dr. Shetty, etc.
  is_triggered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES for Performance
-- ========================================
CREATE INDEX idx_sessions_patient_id ON sessions(patient_id);
CREATE INDEX idx_sessions_created_by_doctor ON sessions(created_by_doctor_id);
CREATE INDEX idx_session_participants_session ON session_participants(session_id);
CREATE INDEX idx_session_participants_doctor ON session_participants(doctor_id);
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_referrals_session ON referrals(session_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_medicine_todos_patient ON medicine_todos(patient_id);
CREATE INDEX idx_follow_up_reminders_patient ON follow_up_reminders(patient_id);
CREATE INDEX idx_doctors_anonymous_id ON doctors(anonymous_id);

-- ========================================
-- TRIGGER FUNCTIONS
-- ========================================

-- Update updated_at column automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TRIGGERS
-- ========================================

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- AUTH TRIGGER: Auto-create user on signup
-- ========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create user record for non-anonymous users (patients)
  IF NEW.is_anonymous = FALSE OR NEW.is_anonymous IS NULL THEN
    INSERT INTO public.users (id, email, full_name, email_verified, onboarded, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      NEW.email_confirmed_at IS NOT NULL,
      FALSE,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new auth users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_reminders ENABLE ROW LEVEL SECURITY;

-- USERS: Patients can read/write their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- DOCTORS: Doctors can manage their own record
CREATE POLICY "Doctors can view own record" ON doctors
  FOR SELECT USING (auth.uid() = anonymous_id);

CREATE POLICY "Doctors can insert own record" ON doctors
  FOR INSERT WITH CHECK (auth.uid() = anonymous_id);

CREATE POLICY "Doctors can update own record" ON doctors
  FOR UPDATE USING (auth.uid() = anonymous_id);

-- SESSIONS: Patients see their sessions, doctors see sessions they're in
CREATE POLICY "Patients can view own sessions" ON sessions
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view sessions they participate in" ON sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM session_participants sp
      JOIN doctors d ON d.id = sp.doctor_id
      WHERE sp.session_id = sessions.id AND d.anonymous_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can create sessions" ON sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM doctors d WHERE d.anonymous_id = auth.uid()
    )
  );

-- SESSION_PARTICIPANTS: Visible to patients and participating doctors
CREATE POLICY "Patients can view session participants" ON session_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions s WHERE s.id = session_participants.session_id AND s.patient_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can view session participants" ON session_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM doctors d 
      WHERE d.anonymous_id = auth.uid() 
      AND d.id IN (SELECT doctor_id FROM session_participants WHERE session_id = session_participants.session_id)
    )
  );

CREATE POLICY "Doctors can join sessions" ON session_participants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM doctors d WHERE d.id = session_participants.doctor_id AND d.anonymous_id = auth.uid()
    )
  );

-- MESSAGES: Visible to patients and session participants
CREATE POLICY "Patients can view messages in own sessions" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions s WHERE s.id = messages.session_id AND s.patient_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can view messages in their sessions" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM session_participants sp
      JOIN doctors d ON d.id = sp.doctor_id
      WHERE sp.session_id = messages.session_id AND d.anonymous_id = auth.uid()
    )
  );

CREATE POLICY "Patients can send messages" ON messages
  FOR INSERT WITH CHECK (
    sender_type = 'patient' AND sender_id = auth.uid() AND
    EXISTS (SELECT 1 FROM sessions s WHERE s.id = messages.session_id AND s.patient_id = auth.uid())
  );

CREATE POLICY "Doctors can send messages" ON messages
  FOR INSERT WITH CHECK (
    sender_type = 'doctor' AND
    EXISTS (
      SELECT 1 FROM session_participants sp
      JOIN doctors d ON d.id = sp.doctor_id
      WHERE sp.session_id = messages.session_id AND d.anonymous_id = auth.uid() AND d.id = messages.sender_id::uuid
    )
  );

-- REFERRALS: Similar to messages
CREATE POLICY "View referrals in own sessions" ON referrals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions s WHERE s.id = referrals.session_id AND s.patient_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM session_participants sp
      JOIN doctors d ON d.id = sp.doctor_id
      WHERE sp.session_id = referrals.session_id AND d.anonymous_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can create referrals" ON referrals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM session_participants sp
      JOIN doctors d ON d.id = sp.doctor_id
      WHERE sp.session_id = referrals.session_id AND d.anonymous_id = auth.uid()
    )
  );

-- MEDICINE_TODOS: Patients only
CREATE POLICY "Patients can view own medicine todos" ON medicine_todos
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Patients can update own medicine todos" ON medicine_todos
  FOR UPDATE USING (auth.uid() = patient_id);

-- FOLLOW_UP_REMINDERS: Patients only
CREATE POLICY "Patients can view own reminders" ON follow_up_reminders
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Patients can update own reminders" ON follow_up_reminders
  FOR UPDATE USING (auth.uid() = patient_id);

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Generate short referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- SERVICE ROLE PERMISSIONS
-- ========================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Anon and authenticated need specific permissions
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON doctors TO anon, authenticated;
GRANT SELECT, INSERT ON sessions TO anon, authenticated;
GRANT SELECT, INSERT ON session_participants TO anon, authenticated;
GRANT SELECT, INSERT ON messages TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON referrals TO anon, authenticated;
GRANT SELECT, UPDATE ON medicine_todos TO authenticated;
GRANT SELECT, UPDATE ON follow_up_reminders TO authenticated;
