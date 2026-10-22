alter table public.memberships drop column if exists role;
drop type if exists public.member_role;
