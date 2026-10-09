-- ============================================================================
-- STALKER TERMINAL: SUPABASE POSTGRESQL SCHEMA (NSE / BSE PORTFOLIO & FORENSICS)
-- Run this inside your Supabase SQL Editor when connecting your project in Phase 5
-- ============================================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- 1. Pinned Watchlist Ribbon ("Up Here" top ticker strip)
create table if not exists public.watchlist_items (
  id uuid primary key default uuid_generate_v4(),
  symbol text not null unique,           -- e.g., 'WSTCSTPAPR.NS', 'RELIANCE.NS', 'HAL.NS'
  ticker text not null,                  -- e.g., 'WSTCSTPAPR'
  exchange text not null default 'NSE',  -- 'NSE' or 'BSE'
  company_name text not null,
  industry text,
  pinned_order integer default 0,
  created_at timestamptz not null default now()
);

-- 2. Portfolio Holdings Tracker
create table if not exists public.portfolio_holdings (
  id uuid primary key default uuid_generate_v4(),
  symbol text not null unique,           -- e.g., 'WSTCSTPAPR.NS'
  ticker text not null,                  -- e.g., 'WSTCSTPAPR'
  exchange text not null default 'NSE',  -- 'NSE' or 'BSE'
  company_name text not null,
  quantity numeric(14, 2) not null default 1,
  avg_buy_price numeric(14, 2) not null,
  target_price numeric(14, 2),
  stop_loss numeric(14, 2),
  conviction_thesis text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Cached Holistic Stock Intelligence & OpenRouter (Luna 6) Deep Analyses
create table if not exists public.stock_analyses (
  id uuid primary key default uuid_generate_v4(),
  symbol text not null unique,
  ticker text not null,
  exchange text not null default 'NSE',
  company_name text not null,
  last_price numeric(14, 2),
  model_used text default 'openrouter/luna-6',
  
  -- Structured Intelligence Payloads (JSONB)
  shareholding_data jsonb not null default '{}'::jsonb,
  industry_boom_data jsonb not null default '{}'::jsonb,
  technical_verdict jsonb not null default '{}'::jsonb,
  fundamental_concall_data jsonb not null default '{}'::jsonb,
  capex_subsidiary_data jsonb not null default '{}'::jsonb,
  regulatory_ed_flags jsonb not null default '[]'::jsonb,
  news_items jsonb not null default '[]'::jsonb,
  holistic_summary text,

  analyzed_at timestamptz not null default now()
);

-- 4. Seed Default Watchlist & West Coast Paper Mills Showcase
insert into public.watchlist_items (symbol, ticker, exchange, company_name, industry, pinned_order)
values
  ('WSTCSTPAPR.NS', 'WSTCSTPAPR', 'NSE', 'West Coast Paper Mills Ltd', 'Paper & Optical Fiber Infrastructure', 1),
  ('HAL.NS', 'HAL', 'NSE', 'Hindustan Aeronautics Ltd', 'Aerospace & Defense Manufacturing', 2),
  ('DIXON.NS', 'DIXON', 'NSE', 'Dixon Technologies (India) Ltd', 'EMS & Consumer Electronics PLI', 3),
  ('TATAELXSI.NS', 'TATAELXSI', 'NSE', 'Tata Elxsi Ltd', 'ER&D, Automotive SDV & AI', 4),
  ('RELIANCE.NS', 'RELIANCE', 'NSE', 'Reliance Industries Ltd', 'Conglomerate, New Energy & Telecom', 5),
  ('HDFCBANK.NS', 'HDFCBANK', 'NSE', 'HDFC Bank Ltd', 'Private Sector Banking', 6)
on conflict (symbol) do nothing;

-- Enable Row Level Security (with public read/write policies for single-user / anon key simplicity)
alter table public.watchlist_items enable row level security;
alter table public.portfolio_holdings enable row level security;
alter table public.stock_analyses enable row level security;

create policy "Allow public access to watchlist_items"
  on public.watchlist_items for all using (true) with check (true);

create policy "Allow public access to portfolio_holdings"
  on public.portfolio_holdings for all using (true) with check (true);

create policy "Allow public access to stock_analyses"
  on public.stock_analyses for all using (true) with check (true);
