-- Enable realtime for messages table
-- REPLICA IDENTITY FULL is required for RLS to work with realtime
ALTER TABLE messages REPLICA IDENTITY FULL;
alter publication supabase_realtime add table messages;

