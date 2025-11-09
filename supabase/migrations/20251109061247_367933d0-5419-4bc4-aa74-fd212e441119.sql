-- Fix infinite recursion in RLS policy for organization_members by using a SECURITY DEFINER helper

-- 1) Helper function to check org membership without triggering RLS recursion
create or replace function public.is_member_of_org(_user_id uuid, _org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where user_id = _user_id
      and organization_id = _org_id
  );
$$;

-- 2) Replace recursive policy with non-recursive one that uses the helper
drop policy if exists "Members can view organization members" on public.organization_members;

create policy "Members can view organization members"
on public.organization_members
for select
to authenticated
using (
  public.is_member_of_org(auth.uid(), organization_id)
  or user_id = auth.uid()
);
