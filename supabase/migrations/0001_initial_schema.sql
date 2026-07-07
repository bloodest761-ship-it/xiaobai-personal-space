-- Stage 2 initial schema for 小白个人内容空间.
-- Run this in Supabase SQL Editor or with `supabase db push`.

create extension if not exists pgcrypto;

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;

drop policy if exists "Users can read their own admin row" on public.app_admins;
create policy "Users can read their own admin row"
on public.app_admins
for select
to authenticated
using (user_id = auth.uid());

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  type text not null,
  status text not null default 'draft',
  summary text,
  content_json jsonb not null,
  content_text text,
  cover_path text,
  tags text[] not null default '{}',
  featured boolean not null default false,
  featured_order integer,
  metadata jsonb not null default '{}',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  deleted_at timestamptz,
  constraint entries_type_check check (
    type in ('reflection', 'essay', 'project', 'understanding')
  ),
  constraint entries_status_check check (
    status in ('draft', 'published', 'archived')
  )
);

create index if not exists entries_status_deleted_at_idx
on public.entries (status, deleted_at);

create index if not exists entries_type_published_at_idx
on public.entries (type, published_at desc);

create index if not exists entries_created_by_idx
on public.entries (created_by);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_entries_updated_at on public.entries;
create trigger set_entries_updated_at
before update on public.entries
for each row
execute function public.set_updated_at();

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_admins
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_app_admin() from public;
grant execute on function public.is_app_admin() to anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on public.entries to anon, authenticated;
grant insert, update, delete on public.entries to authenticated;
grant select on public.app_admins to authenticated;

alter table public.entries enable row level security;

drop policy if exists "Public can read published entries" on public.entries;
create policy "Public can read published entries"
on public.entries
for select
to anon, authenticated
using (
  status = 'published'
  and deleted_at is null
);

drop policy if exists "Admins can read all entries" on public.entries;
create policy "Admins can read all entries"
on public.entries
for select
to authenticated
using (public.is_app_admin());

drop policy if exists "Admins can insert entries" on public.entries;
create policy "Admins can insert entries"
on public.entries
for insert
to authenticated
with check (
  public.is_app_admin()
  and created_by = auth.uid()
);

drop policy if exists "Admins can update entries" on public.entries;
create policy "Admins can update entries"
on public.entries
for update
to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

drop policy if exists "Admins can delete entries" on public.entries;
create policy "Admins can delete entries"
on public.entries
for delete
to authenticated
using (public.is_app_admin());

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'content-images',
  'content-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can read content images" on storage.objects;
create policy "Anyone can read content images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'content-images');

drop policy if exists "Admins can upload content images" on storage.objects;
create policy "Admins can upload content images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'content-images'
  and public.is_app_admin()
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Admins can update content images" on storage.objects;
create policy "Admins can update content images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'content-images'
  and public.is_app_admin()
)
with check (
  bucket_id = 'content-images'
  and public.is_app_admin()
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Admins can delete content images" on storage.objects;
create policy "Admins can delete content images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'content-images'
  and public.is_app_admin()
);
