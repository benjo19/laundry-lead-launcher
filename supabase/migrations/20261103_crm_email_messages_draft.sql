-- Draft only. Review and apply explicitly before enabling any Make sync.
create table if not exists public.crm_email_messages (
  id uuid primary key default gen_random_uuid(),
  mailbox text not null,
  provider_message_id text not null,
  provider_thread_id text,
  direction text not null check (direction in ('inbound','outbound')),
  sender_email text not null,
  recipient_emails text[] not null default '{}',
  subject text,
  snippet text,
  received_at timestamptz,
  provider_status text not null default 'observed' check (provider_status in ('observed','sent','failed','unknown')),
  matched_lead_id uuid references public.leads(id) on delete set null,
  match_status text not null default 'unmatched' check (match_status in ('unique','ambiguous','unmatched')),
  match_count integer not null default 0 check (match_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mailbox,provider_message_id),
  check ((match_status = 'unique' and match_count = 1 and matched_lead_id is not null)
    or (match_status <> 'unique' and matched_lead_id is null))
);
create index if not exists crm_email_messages_lead_time_idx on public.crm_email_messages (matched_lead_id,received_at desc);
alter table public.crm_email_messages enable row level security;
revoke all on public.crm_email_messages from public,anon,authenticated;
grant select on public.crm_email_messages to authenticated;
grant select,insert,update,delete on public.crm_email_messages to service_role;
drop policy if exists "CRM email super admins read" on public.crm_email_messages;
create policy "CRM email super admins read" on public.crm_email_messages
  for select to authenticated using ((select private.is_super_admin(auth.uid())));
-- Never grant client-side insert/update. Make writes require a restricted backend
-- or carefully scoped service-role integration. Do not store email bodies by default.
-- Ingestion must compute match_count using normalized addresses, link only count=1,
-- and avoid modifying leads or marking delivery as verified without provider evidence.
