create table matches (
  id uuid primary key default gen_random_uuid(),
  external_id integer unique not null,
  home_team text not null,
  away_team text not null,
  home_score integer,
  away_score integer,
  kickoff_time timestamptz not null,
  status text not null default 'SCHEDULED',
  stage text not null default 'GROUP_STAGE',
  "group" text,
  slug text unique not null,
  created_at timestamptz default now()
);

create table odds_snapshots (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  book_name text not null,
  home_price numeric,
  draw_price numeric,
  away_price numeric,
  over_line numeric,
  over_price numeric,
  under_price numeric,
  snapshotted_at timestamptz default now()
);

create table content (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete set null,
  type text not null,
  slug text unique not null,
  title text not null,
  body_md text not null,
  meta_description text not null,
  published_at timestamptz,
  created_at timestamptz default now()
);

create table x_posts (
  id uuid primary key default gen_random_uuid(),
  content_id uuid references content(id) on delete set null,
  body text not null,
  posted_at timestamptz,
  status text not null default 'pending',
  created_at timestamptz default now()
);

create index on matches(kickoff_time);
create index on matches(status);
create index on content(type);
create index on content(published_at);
create index on x_posts(status);
