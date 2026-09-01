-- Run this once in Supabase: Dashboard > SQL Editor > New query > paste all > Run.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'You',
  avatar text default '🥑',
  sex text default 'female',
  age int,
  height_cm numeric,
  height_unit text default 'cm',
  weight_kg numeric,
  weight_unit text default 'kg',
  body_fat_pct numeric,
  activity text default 'light',
  goal text default 'maintain',
  pace text default 'moderate',
  cal_goal int default 2200,
  protein_goal int default 150,
  carbs_goal int default 220,
  fat_goal int default 70,
  water_goal int default 8,
  weight_goal_kg numeric,
  onboarded boolean not null default false,
  created_at timestamptz default now()
);

create table public.food_entries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  calories numeric not null default 0,
  protein_g numeric not null default 0,
  carbs_g numeric not null default 0,
  fat_g numeric not null default 0,
  logged_at timestamptz not null default now(),
  log_date date not null default current_date
);

create table public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  weight_kg numeric not null,
  logged_at timestamptz not null default now(),
  log_date date not null default current_date,
  unique (profile_id, log_date)
);

create table public.water_logs (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null default current_date,
  cups int not null default 0,
  primary key (profile_id, log_date)
);

-- Row Level Security: every table is locked down so a user can only ever
-- read or write their own rows. This is what makes the Supabase anon key
-- safe to ship in the browser bundle.
alter table public.profiles enable row level security;
alter table public.food_entries enable row level security;
alter table public.weight_entries enable row level security;
alter table public.water_logs enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own food entries" on public.food_entries
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy "own weight entries" on public.weight_entries
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy "own water logs" on public.water_logs
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- Automatically create a (blank) profile row whenever someone signs up,
-- regardless of whether they used email, Google, or GitHub.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
