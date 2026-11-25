-- WiseCRM database schema for Supabase (PostgreSQL).
-- Run this once in the Supabase SQL editor. Every table is protected by
-- Row Level Security: users can only see and change data of organizations they belong to.

create extension if not exists pgcrypto;

-- Organizations and members ---------------------------------------------------

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'sales' check (role in ('admin', 'manager', 'sales')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

-- CRM data -------------------------------------------------------------------

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  company text not null check (char_length(company) between 1 and 160),
  email text,
  phone text,
  status text not null default 'Lead' check (status in ('Lead', 'Proposal', 'Negotiation', 'Won', 'Lost')),
  value numeric(14, 2) not null default 0 check (value >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  client_id uuid references public.clients (id) on delete set null,
  due_date date,
  done boolean not null default false,
  priority text not null default 'Medium' check (priority in ('High', 'Medium', 'Low')),
  created_at timestamptz not null default now()
);

create index if not exists clients_org_idx on public.clients (organization_id);
create index if not exists tasks_org_idx on public.tasks (organization_id);
create index if not exists tasks_client_idx on public.tasks (client_id);

-- Helpers --------------------------------------------------------------------

-- SECURITY DEFINER avoids RLS recursion when policies check membership.
create or replace function public.is_org_member(org uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.memberships m
    where m.organization_id = org and m.user_id = (select auth.uid())
  );
$$;

-- Creates an organization and makes the caller its admin. This is the only way
-- to create memberships, so nobody can join an organization they were not invited to.
create or replace function public.create_organization(org_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Not authenticated';
  end if;
  insert into public.organizations (name) values (coalesce(nullif(trim(org_name), ''), 'My workspace'))
  returning id into new_id;
  insert into public.memberships (organization_id, user_id, role) values (new_id, (select auth.uid()), 'admin');
  return new_id;
end;
$$;

revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.create_organization(text) from public;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.create_organization(text) to authenticated;

-- Row Level Security ----------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.clients enable row level security;
alter table public.tasks enable row level security;

drop policy if exists "org select" on public.organizations;
create policy "org select" on public.organizations
  for select to authenticated using (public.is_org_member(id));

drop policy if exists "members select" on public.memberships;
create policy "members select" on public.memberships
  for select to authenticated using (public.is_org_member(organization_id));

drop policy if exists "clients select" on public.clients;
drop policy if exists "clients insert" on public.clients;
drop policy if exists "clients update" on public.clients;
drop policy if exists "clients delete" on public.clients;
create policy "clients select" on public.clients
  for select to authenticated using (public.is_org_member(organization_id));
create policy "clients insert" on public.clients
  for insert to authenticated with check (public.is_org_member(organization_id));
create policy "clients update" on public.clients
  for update to authenticated using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "clients delete" on public.clients
  for delete to authenticated using (public.is_org_member(organization_id));

drop policy if exists "tasks select" on public.tasks;
drop policy if exists "tasks insert" on public.tasks;
drop policy if exists "tasks update" on public.tasks;
drop policy if exists "tasks delete" on public.tasks;
create policy "tasks select" on public.tasks
  for select to authenticated using (public.is_org_member(organization_id));
create policy "tasks insert" on public.tasks
  for insert to authenticated with check (public.is_org_member(organization_id));
create policy "tasks update" on public.tasks
  for update to authenticated using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "tasks delete" on public.tasks
  for delete to authenticated using (public.is_org_member(organization_id));
