-- Step 1: Create org_role enum
CREATE TYPE public.org_role AS ENUM ('member', 'manager', 'admin', 'owner');

-- Step 2: Drop the default constraint temporarily, convert column, then restore default
ALTER TABLE public.organization_members 
  ALTER COLUMN role DROP DEFAULT;

ALTER TABLE public.organization_members 
  ALTER COLUMN role TYPE org_role 
  USING role::org_role;

ALTER TABLE public.organization_members 
  ALTER COLUMN role SET DEFAULT 'member'::org_role;

-- Step 3: Create SECURITY DEFINER function to check org roles
CREATE OR REPLACE FUNCTION public.has_org_role(
  _user_id uuid,
  _org_id uuid,
  _required_role org_role
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
      AND role = _required_role
  );
$$;

-- Step 4: Create role audit table
CREATE TABLE public.organization_role_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  old_role org_role,
  new_role org_role NOT NULL,
  changed_by uuid NOT NULL REFERENCES auth.users(id),
  changed_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.organization_role_audit ENABLE ROW LEVEL SECURITY;

-- Org admins can view role audit logs
CREATE POLICY "Org admins can view role audit logs"
ON public.organization_role_audit
FOR SELECT
USING (
  public.has_org_role(auth.uid(), organization_id, 'admin')
  OR public.has_org_role(auth.uid(), organization_id, 'owner')
);

-- Step 5: Create trigger function for role change auditing
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.organization_role_audit (
      user_id,
      organization_id,
      old_role,
      new_role,
      changed_by
    ) VALUES (
      NEW.user_id,
      NEW.organization_id,
      OLD.role,
      NEW.role,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Step 6: Create trigger for role changes
CREATE TRIGGER audit_role_changes
AFTER UPDATE OF role ON public.organization_members
FOR EACH ROW
EXECUTE FUNCTION public.log_role_change();

-- Step 7: Add RLS policy to prevent self-promotion
CREATE POLICY "Users cannot change their own role"
ON public.organization_members
FOR UPDATE
USING (
  user_id != auth.uid() 
  OR role = (SELECT role FROM public.organization_members WHERE id = organization_members.id)
)
WITH CHECK (
  user_id != auth.uid()
  OR role = (SELECT role FROM public.organization_members WHERE id = organization_members.id)
);