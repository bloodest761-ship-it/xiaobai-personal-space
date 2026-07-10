-- Stage 3: entries are retained and removed only through deleted_at.
revoke delete on public.entries from authenticated;

drop policy if exists "Admins can delete entries" on public.entries;
