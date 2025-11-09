-- Add goals table for tracking career goals and learning objectives
CREATE TABLE IF NOT EXISTS public.career_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_skills TEXT[] DEFAULT '{}',
  timeline TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'archived')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  target_date TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.career_goals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own goals"
  ON public.career_goals
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_career_goals_updated_at
  BEFORE UPDATE ON public.career_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add learning resources table
CREATE TABLE IF NOT EXISTS public.learning_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES public.skill_framework(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('course', 'book', 'article', 'video', 'certification', 'project', 'mentor')),
  url TEXT,
  description TEXT,
  provider TEXT,
  duration TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for learning resources
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;

-- Create policies for learning resources
CREATE POLICY "Users can manage their own learning resources"
  ON public.learning_resources
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add trigger for learning resources updated_at
CREATE TRIGGER update_learning_resources_updated_at
  BEFORE UPDATE ON public.learning_resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add skill history table to track skill evolution over time
CREATE TABLE IF NOT EXISTS public.skill_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skill_framework(id) ON DELETE CASCADE,
  proficiency_level TEXT NOT NULL CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  data_source_id UUID REFERENCES public.data_sources(id) ON DELETE SET NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT
);

-- Enable RLS for skill history
ALTER TABLE public.skill_history ENABLE ROW LEVEL SECURITY;

-- Create policies for skill history
CREATE POLICY "Users can view their own skill history"
  ON public.skill_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert skill history"
  ON public.skill_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for efficient time-series queries
CREATE INDEX idx_skill_history_user_skill_time 
  ON public.skill_history(user_id, skill_id, recorded_at DESC);

-- Add comments
COMMENT ON TABLE public.career_goals IS 'Stores user career goals and learning objectives';
COMMENT ON TABLE public.learning_resources IS 'Tracks learning materials and resources for skill development';
COMMENT ON TABLE public.skill_history IS 'Maintains historical record of skill proficiency changes over time';
