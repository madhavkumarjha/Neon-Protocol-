-- Supabase Schema for Neon Protocol Global Leaderboard
-- Strict Row Level Security: Public read, insert-only with bounded checks, zero updates/deletions

-- 1. Create scores table
create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  display_name text not null default 'CyberSamurai',
  score integer not null check (score >= 0 and score <= 10000000),
  wave integer not null check (wave >= 1 and wave <= 1000),
  kills integer not null check (kills >= 0 and kills <= 100000),
  score_hash text,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- 2. Indexes for fast leaderboard ranking queries
create index if not exists idx_scores_score_desc on public.scores (score desc);
create index if not exists idx_scores_created_at on public.scores (created_at desc);

-- 3. Enable Row Level Security (RLS)
alter table public.scores enable row level security;

-- 4. RLS Policies:
-- (a) Allow public read access to all scores
drop policy if exists "Allow public read access" on public.scores;
create policy "Allow public read access"
  on public.scores
  for select
  using (true);

-- (b) Allow public insert-only with strict bounds
drop policy if exists "Allow insert only with valid values" on public.scores;
create policy "Allow insert only with valid values"
  on public.scores
  for insert
  with check (
    score >= 0 and score <= 10000000 and
    wave >= 1 and wave <= 1000 and
    kills >= 0 and kills <= 100000 and
    length(display_name) <= 30
  );

-- Note: No UPDATE or DELETE policies are granted, ensuring append-only integrity.
