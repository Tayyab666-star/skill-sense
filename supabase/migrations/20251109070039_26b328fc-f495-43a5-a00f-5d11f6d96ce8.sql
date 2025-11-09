-- Enable realtime for user_skills table
ALTER TABLE public.user_skills REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_skills;