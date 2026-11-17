-- Nook database. Paste all of this into Supabase > SQL Editor > New query, then press Run.
-- Every table keeps a user_id, and Row Level Security means each account only ever sees its own rows.

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null,
  kind text not null default 'todo',          -- todo | reminder | routine | block
  date date not null,                         -- the day it starts (or the day it's for)
  time text,                                  -- 'HH:MM' or null for "anytime"
  end_time text,                              -- for schedule blocks
  repeat text not null default 'none',        -- none | daily | weekdays | weekly
  days int[] not null default '{}',           -- for weekly: 0 = Sunday ... 6 = Saturday
  notify boolean not null default false,      -- ring on the phone at this time
  done_on date,                               -- for one-off items
  created_at timestamptz not null default now()
);

create table if not exists completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  item_id uuid not null references items on delete cascade,
  day date not null,
  unique (item_id, day)
);

create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  color text not null default 'cyan',
  created_at timestamptz not null default now()
);

create table if not exists habit_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  habit_id uuid not null references habits on delete cascade,
  day date not null,
  unique (habit_id, day)
);

create table if not exists journal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  day date not null,
  water_ml int not null default 0,
  mood text,
  unique (user_id, day)
);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  color text not null default 'violet',
  created_at timestamptz not null default now()
);

create table if not exists milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  goal_id uuid not null references goals on delete cascade,
  title text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['items','completions','habits','habit_checks','journal','days','goals','milestones'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "own rows" on %I', t);
    execute format('create policy "own rows" on %I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;
