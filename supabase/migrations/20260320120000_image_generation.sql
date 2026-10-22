create schema if not exists app;

create type public.brand_asset_kind as enum ('style_reference', 'logo', 'product');
create type public.generation_status as enum ('pending', 'succeeded', 'failed');

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.memberships (
  user_id uuid not null,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  primary key (user_id, tenant_id)
);

create table public.vision_guidelines (
  id uuid primary key default gen_random_uuid(),
  version int not null,
  principles text[] not null,
  quality_bar text not null,
  avoid text[] not null default '{}',
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  unique (version)
);

create unique index vision_guidelines_one_active
  on public.vision_guidelines (is_active)
  where is_active;

create table public.brand_profiles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  version int not null,
  visual_style text not null,
  composition text not null,
  moods text[] not null default '{}',
  avoid text[] not null default '{}',
  content_pages jsonb not null default '[]',
  segments text[] not null default '{}',
  palette jsonb not null default '[]',
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  unique (tenant_id, version)
);

create unique index brand_profiles_one_active_per_tenant
  on public.brand_profiles (tenant_id, is_active)
  where is_active;

create table public.brand_assets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  kind public.brand_asset_kind not null,
  storage_path text not null,
  mime_type text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table public.generations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null,
  status public.generation_status not null default 'pending',
  request jsonb not null,
  prompt text not null default '',
  vision_guideline_id uuid references public.vision_guidelines (id),
  brand_profile_id uuid references public.brand_profiles (id),
  reference_asset_ids uuid[] not null default '{}',
  model text not null,
  aspect_ratio text not null,
  image_size text not null,
  storage_path text,
  error_code text,
  latency_ms int,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index generations_tenant_created_idx
  on public.generations (tenant_id, created_at desc);

create or replace function app.current_tenant_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id
  from public.memberships
  where user_id = auth.uid();
$$;

alter table public.tenants enable row level security;
alter table public.memberships enable row level security;
alter table public.vision_guidelines enable row level security;
alter table public.brand_profiles enable row level security;
alter table public.brand_assets enable row level security;
alter table public.generations enable row level security;

create policy tenants_select on public.tenants
  for select using (id in (select app.current_tenant_ids()));

create policy memberships_select on public.memberships
  for select using (tenant_id in (select app.current_tenant_ids()));

create policy vision_select on public.vision_guidelines
  for select using (true);

create policy brand_profiles_select on public.brand_profiles
  for select using (tenant_id in (select app.current_tenant_ids()));

create policy brand_assets_select on public.brand_assets
  for select using (tenant_id in (select app.current_tenant_ids()));

create policy generations_select on public.generations
  for select using (tenant_id in (select app.current_tenant_ids()));

create policy generations_insert on public.generations
  for insert with check (tenant_id in (select app.current_tenant_ids()));

create policy generations_update on public.generations
  for update using (tenant_id in (select app.current_tenant_ids()));

insert into storage.buckets (id, name, public)
values
  ('brand-assets', 'brand-assets', false),
  ('generations', 'generations', false)
on conflict (id) do nothing;
