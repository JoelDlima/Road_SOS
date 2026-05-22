-- Profiles table for user accounts
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  blood_group text,
  language text default 'English',
  medical_info jsonb default '{}',
  crash_detection_enabled boolean default true,
  crash_sensitivity text default 'medium',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- User emergency contacts
create table if not exists user_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  phone text not null,
  created_at timestamptz default now()
);

create index user_contacts_user_idx on user_contacts(user_id);

-- Auto-create profile on user signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Row level security
alter table profiles enable row level security;
alter table user_contacts enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can view own contacts"
  on user_contacts for select using (auth.uid() = user_id);

create policy "Users can insert own contacts"
  on user_contacts for insert with check (auth.uid() = user_id);

create policy "Users can delete own contacts"
  on user_contacts for delete using (auth.uid() = user_id);
