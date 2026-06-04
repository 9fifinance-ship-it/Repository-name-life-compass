create table if not exists public.waitlist_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null,
  goal text not null,
  source text not null default '9fifi-life-compass',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.waitlist_leads enable row level security;

create policy "service role can manage waitlist leads"
on public.waitlist_leads
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists waitlist_leads_set_updated_at on public.waitlist_leads;

create trigger waitlist_leads_set_updated_at
before update on public.waitlist_leads
for each row
execute function public.set_updated_at();
