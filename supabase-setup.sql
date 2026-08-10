-- Waltz for Venus shared workspace schema
-- Run this once in Supabase > SQL Editor AFTER replacing the four email placeholders below.

create table if not exists public.band_members (
  email text primary key,
  display_name text not null,
  role text not null default 'member',
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_kv (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.band_members enable row level security;
alter table public.workspace_kv enable row level security;

-- Explicit browser-client privileges; RLS policies below still decide which authenticated users may act.
grant select on public.band_members to authenticated;
grant select, insert, update, delete on public.workspace_kv to authenticated;

create or replace function public.is_wfv_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.band_members
    where lower(email) = lower(coalesce(auth.jwt()->>'email',''))
  );
$$;

revoke all on function public.is_wfv_member() from public;
grant execute on function public.is_wfv_member() to authenticated;

drop policy if exists "WFV members can read band members" on public.band_members;
create policy "WFV members can read band members"
on public.band_members for select
to authenticated
using (public.is_wfv_member());

drop policy if exists "WFV members can read workspace" on public.workspace_kv;
create policy "WFV members can read workspace"
on public.workspace_kv for select
to authenticated
using (public.is_wfv_member());

drop policy if exists "WFV members can insert workspace" on public.workspace_kv;
create policy "WFV members can insert workspace"
on public.workspace_kv for insert
to authenticated
with check (public.is_wfv_member());

drop policy if exists "WFV members can update workspace" on public.workspace_kv;
create policy "WFV members can update workspace"
on public.workspace_kv for update
to authenticated
using (public.is_wfv_member())
with check (public.is_wfv_member());

drop policy if exists "WFV members can delete workspace" on public.workspace_kv;
create policy "WFV members can delete workspace"
on public.workspace_kv for delete
to authenticated
using (public.is_wfv_member());

-- REPLACE THESE EMAILS with the Google accounts Jay, Bart, Scott and Derek will use.
insert into public.band_members (email, display_name, role) values
  ('JAY_GOOGLE_EMAIL@gmail.com',   'Jay',   'admin'),
  ('bartek_1212@yahoo.com',  'Bart',  'member'),
  ('rottlerscott@gmail.com', 'Scott', 'member'),
  ('dmaish@mintel.net', 'Derek', 'member')
on conflict (email) do update set
  display_name = excluded.display_name,
  role = excluded.role;

-- Private file bucket for demos + lyric PDFs.
insert into storage.buckets (id, name, public)
values ('wfv-private','wfv-private',false)
on conflict (id) do update set public=false;

drop policy if exists "WFV members can read private files" on storage.objects;
create policy "WFV members can read private files"
on storage.objects for select
to authenticated
using (bucket_id='wfv-private' and public.is_wfv_member());

drop policy if exists "WFV members can upload private files" on storage.objects;
create policy "WFV members can upload private files"
on storage.objects for insert
to authenticated
with check (bucket_id='wfv-private' and public.is_wfv_member());

drop policy if exists "WFV members can update private files" on storage.objects;
create policy "WFV members can update private files"
on storage.objects for update
to authenticated
using (bucket_id='wfv-private' and public.is_wfv_member())
with check (bucket_id='wfv-private' and public.is_wfv_member());

drop policy if exists "WFV members can delete private files" on storage.objects;
create policy "WFV members can delete private files"
on storage.objects for delete
to authenticated
using (bucket_id='wfv-private' and public.is_wfv_member());

-- Realtime for shared edits/checklists/comments.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='workspace_kv'
  ) then
    alter publication supabase_realtime add table public.workspace_kv;
  end if;
end $$;
