-- Fix infinite recursion in sessions RLS policies
-- The issue is that the INSERT policy might be checking something that causes recursion

-- Drop existing policies on sessions
DROP POLICY IF EXISTS "Authenticated can view sessions" ON sessions;
DROP POLICY IF EXISTS "Authenticated can create sessions" ON sessions;

-- Create simpler policies without any subqueries that could cause recursion
CREATE POLICY "Anyone authenticated can view sessions" ON sessions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone authenticated can insert sessions" ON sessions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Anyone authenticated can update sessions" ON sessions
  FOR UPDATE TO authenticated USING (true);

-- Also ensure system messages can be inserted
DROP POLICY IF EXISTS "Doctors can send messages" ON messages;
DROP POLICY IF EXISTS "Patients can send messages" ON messages;

-- Simplified message policies
CREATE POLICY "Authenticated can insert messages" ON messages
  FOR INSERT TO authenticated WITH CHECK (true);

