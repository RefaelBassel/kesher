alter table public.profiles enable row level security;
alter table public.opportunities enable row level security;
alter table public.sources enable row level security;
alter table public.source_suggestions enable row level security;
alter table public.notifications enable row level security;
alter table public.scrape_logs enable row level security;
alter table public.saved_opportunities enable row level security;

-- helper: is_admin()
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- profiles
create policy "Users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Admins read all profiles" on public.profiles for select using (public.is_admin());

-- opportunities
create policy "Anyone reads active opportunities" on public.opportunities for select using (status = 'active');
create policy "Admins manage opportunities" on public.opportunities for all using (public.is_admin()) with check (public.is_admin());

-- sources
create policy "Admins manage sources" on public.sources for all using (public.is_admin()) with check (public.is_admin());

-- source_suggestions
create policy "Admins manage suggestions" on public.source_suggestions for all using (public.is_admin()) with check (public.is_admin());

-- notifications
create policy "Users read own notifications" on public.notifications for select using (auth.uid() = profile_id);
create policy "Admins read all notifications" on public.notifications for select using (public.is_admin());

-- scrape_logs
create policy "Admins read scrape logs" on public.scrape_logs for select using (public.is_admin());

-- saved_opportunities
create policy "Users manage own saves" on public.saved_opportunities for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
