-- Add skill endorsements table
CREATE TABLE IF NOT EXISTS public.skill_endorsements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_skill_id UUID NOT NULL REFERENCES public.user_skills(id) ON DELETE CASCADE,
  endorsed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endorsement_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_skill_id, endorsed_by)
);

-- Enable RLS
ALTER TABLE public.skill_endorsements ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view endorsements for public and organization skills
CREATE POLICY "Users can view endorsements for accessible skills"
ON public.skill_endorsements
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_skills us
    WHERE us.id = skill_endorsements.user_skill_id
    AND (
      us.privacy_level = 'public'::privacy_level
      OR us.user_id = auth.uid()
      OR (
        us.privacy_level = 'organization'::privacy_level
        AND EXISTS (
          SELECT 1 FROM public.profiles p
          JOIN public.organization_members om ON p.organization_id = om.organization_id
          WHERE p.id = us.user_id AND om.user_id = auth.uid()
        )
      )
    )
  )
);

-- Policy: Users can endorse skills
CREATE POLICY "Users can endorse accessible skills"
ON public.skill_endorsements
FOR INSERT
WITH CHECK (
  auth.uid() = endorsed_by
  AND EXISTS (
    SELECT 1 FROM public.user_skills us
    WHERE us.id = skill_endorsements.user_skill_id
    AND us.user_id != auth.uid()
    AND (
      us.privacy_level = 'public'::privacy_level
      OR (
        us.privacy_level = 'organization'::privacy_level
        AND EXISTS (
          SELECT 1 FROM public.profiles p
          JOIN public.organization_members om ON p.organization_id = om.organization_id
          WHERE p.id = us.user_id AND om.user_id = auth.uid()
        )
      )
    )
  )
);

-- Policy: Users can delete their own endorsements
CREATE POLICY "Users can delete their own endorsements"
ON public.skill_endorsements
FOR DELETE
USING (auth.uid() = endorsed_by);

-- Add endorsement count column to user_skills for quick access
ALTER TABLE public.user_skills ADD COLUMN IF NOT EXISTS endorsement_count INTEGER DEFAULT 0;

-- Create function to update endorsement count
CREATE OR REPLACE FUNCTION public.update_endorsement_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.user_skills
    SET endorsement_count = endorsement_count + 1
    WHERE id = NEW.user_skill_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.user_skills
    SET endorsement_count = GREATEST(endorsement_count - 1, 0)
    WHERE id = OLD.user_skill_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for endorsement count updates
DROP TRIGGER IF EXISTS update_endorsement_count_trigger ON public.skill_endorsements;
CREATE TRIGGER update_endorsement_count_trigger
AFTER INSERT OR DELETE ON public.skill_endorsements
FOR EACH ROW
EXECUTE FUNCTION public.update_endorsement_count();