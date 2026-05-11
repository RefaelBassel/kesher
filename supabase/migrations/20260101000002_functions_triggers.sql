-- auto-create profile row on auth signup
-- admin promotion is done in the Next.js middleware against ADMIN_EMAILS
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- updated_at triggers
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute procedure public.touch_updated_at();

drop trigger if exists opportunities_touch on public.opportunities;
create trigger opportunities_touch before update on public.opportunities
  for each row execute procedure public.touch_updated_at();

-- increment failure count + auto-disable after 5 consecutive failures
create or replace function public.increment_source_failures(p_source_id uuid, p_error text)
returns void language plpgsql as $$
begin
  update public.sources
  set consecutive_failures = consecutive_failures + 1,
      last_error = p_error,
      last_scraped_at = now(),
      active = case when consecutive_failures + 1 >= 5 then false else active end
  where id = p_source_id;
end; $$;
