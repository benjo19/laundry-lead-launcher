alter table public.leads add column if not exists won_locations_count integer check (won_locations_count is null or won_locations_count >= 0);
alter table public.leads add column if not exists actual_mrr numeric(12,2) check (actual_mrr is null or actual_mrr >= 0);

create or replace function public.delete_lead_complete(p_lead_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_allowed boolean := false;
begin
  select exists (
    select 1 from public.leads l
    where l.id = p_lead_id
      and (
        l.user_id = auth.uid()
        or l.assigned_to = auth.uid()
        or exists (
          select 1 from public.user_roles ur
          where ur.user_id = auth.uid() and ur.role::text = 'super_admin'
        )
      )
  ) into v_allowed;

  if not v_allowed then
    raise exception 'Not authorized to delete this lead';
  end if;

  delete from public.reminders where lead_id = p_lead_id;
  delete from public.lead_activities where lead_id = p_lead_id;
  delete from public.offers where lead_id = p_lead_id;
  delete from public.partner_locations where lead_id = p_lead_id;
  delete from public.lead_audit_log where lead_id = p_lead_id;
  delete from public.leads where id = p_lead_id;
end;
$$;

revoke all on function public.delete_lead_complete(uuid) from public;
grant execute on function public.delete_lead_complete(uuid) to authenticated;

create index if not exists idx_leads_next_action_at on public.leads(next_action_at) where next_action_at is not null;
create index if not exists idx_leads_interested_in on public.leads(interested_in);
create index if not exists idx_leads_status on public.leads(status);
