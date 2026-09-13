alter table public.leads
  add column if not exists ai_conversation_id text,
  add column if not exists ai_call_sid text,
  add column if not exists ai_call_status text,
  add column if not exists ai_call_summary text,
  add column if not exists ai_call_duration_secs integer,
  add column if not exists ai_last_call_at timestamptz;

create index if not exists leads_ai_conversation_id_idx on public.leads(ai_conversation_id);
