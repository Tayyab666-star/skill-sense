-- Create learning_paths table to persist generated learning paths with versioning

CREATE TABLE public.learning_paths (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id uuid REFERENCES public.career_goals(id) ON DELETE SET NULL,
  path_title text NOT NULL,
  estimated_duration text,
  path_data jsonb NOT NULL,
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;

-- Users can view their own learning paths
CREATE POLICY "Users can view their own learning paths"
ON public.learning_paths
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own learning paths
CREATE POLICY "Users can insert their own learning paths"
ON public.learning_paths
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own learning paths
CREATE POLICY "Users can update their own learning paths"
ON public.learning_paths
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own learning paths
CREATE POLICY "Users can delete their own learning paths"
ON public.learning_paths
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_learning_paths_user_id ON public.learning_paths(user_id);
CREATE INDEX idx_learning_paths_goal_id ON public.learning_paths(goal_id);
CREATE INDEX idx_learning_paths_created_at ON public.learning_paths(created_at DESC);

-- Trigger to update updated_at
CREATE TRIGGER update_learning_paths_updated_at
BEFORE UPDATE ON public.learning_paths
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();