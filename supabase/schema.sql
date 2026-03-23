-- MOSO TEA booking schema for Supabase (PostgreSQL)
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.workshop_catalog (
  key text primary key,
  title text not null,
  unit_price numeric(10,2) not null check (unit_price >= 0),
  default_capacity integer not null check (default_capacity >= 0),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.booking_sessions (
  id uuid primary key default gen_random_uuid(),
  workshop_key text not null references public.workshop_catalog(key) on update cascade on delete restrict,
  session_date date not null,
  start_time time not null,
  end_time time not null,
  capacity integer not null check (capacity >= 0),
  booked_count integer not null default 0 check (booked_count >= 0),
  status text not null default 'open' check (status in ('open', 'full', 'cancelled', 'completed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (workshop_key, session_date, start_time, end_time)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_ref text not null unique,
  session_id uuid not null references public.booking_sessions(id) on update cascade on delete restrict,
  workshop_key text not null references public.workshop_catalog(key) on update cascade on delete restrict,
  guests integer not null check (guests >= 1 and guests <= 6),
  full_name text not null,
  email text not null,
  phone text not null,
  notes text not null default '',
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  total_amount numeric(10,2) not null check (total_amount >= 0),
  mail_status text not null default 'pending' check (mail_status in ('pending', 'sent', 'failed')),
  source text not null default 'front' check (source in ('front', 'admin')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_booking_sessions_date on public.booking_sessions(session_date);
create index if not exists idx_booking_sessions_status on public.booking_sessions(status);
create index if not exists idx_bookings_session_id on public.bookings(session_id);
create index if not exists idx_bookings_email on public.bookings(email);
create index if not exists idx_bookings_status on public.bookings(status);

drop trigger if exists trg_workshop_catalog_updated_at on public.workshop_catalog;
create trigger trg_workshop_catalog_updated_at
before update on public.workshop_catalog
for each row execute function public.set_updated_at();

drop trigger if exists trg_booking_sessions_updated_at on public.booking_sessions;
create trigger trg_booking_sessions_updated_at
before update on public.booking_sessions
for each row execute function public.set_updated_at();

drop trigger if exists trg_bookings_updated_at on public.bookings;
create trigger trg_bookings_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

insert into public.workshop_catalog (key, title, unit_price, default_capacity, active, sort_order)
values
  ('authentic', 'Authentic Ceremony', 50.00, 6, true, 1),
  ('brewing', 'Tradition of Tea Brewing', 50.00, 6, true, 2),
  ('making', 'Art of Tea Making', 50.00, 6, true, 3)
on conflict (key) do update
set
  title = excluded.title,
  unit_price = excluded.unit_price,
  default_capacity = excluded.default_capacity,
  active = excluded.active,
  sort_order = excluded.sort_order;

