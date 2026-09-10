create or replace function public.is_current_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'super_admin'
  );
$$;

revoke execute on function public.is_current_super_admin() from public, anon;
grant execute on function public.is_current_super_admin() to authenticated;

create table if not exists public.sales_partner_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  invited_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','accepted','revoked')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

alter table public.sales_partner_invites enable row level security;

create policy "Super admins can view partner invites"
on public.sales_partner_invites for select to authenticated
using (public.is_current_super_admin());

create policy "Super admins can create partner invites"
on public.sales_partner_invites for insert to authenticated
with check (public.is_current_super_admin() and invited_by = auth.uid());

create policy "Super admins can update partner invites"
on public.sales_partner_invites for update to authenticated
using (public.is_current_super_admin())
with check (public.is_current_super_admin());

create policy "Super admins can delete partner invites"
on public.sales_partner_invites for delete to authenticated
using (public.is_current_super_admin());

create or replace function public.assign_default_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  partner_invite_id uuid;
begin
  select id into partner_invite_id
  from public.sales_partner_invites
  where lower(email) = lower(new.email)
    and status = 'pending'
  limit 1;

  if partner_invite_id is not null then
    insert into public.user_roles (user_id, role)
    values (new.id, 'sales_partner')
    on conflict (user_id, role) do nothing;

    update public.sales_partner_invites
    set status = 'accepted', accepted_at = now()
    where id = partner_invite_id;
  else
    insert into public.user_roles (user_id, role)
    values (new.id, 'user')
    on conflict (user_id, role) do nothing;
  end if;

  return new;
end;
$$;

create or replace function public.activate_existing_partner_from_invite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_user_id uuid;
begin
  if new.status <> 'pending' then
    return new;
  end if;

  select id into existing_user_id
  from auth.users
  where lower(email) = lower(new.email)
  limit 1;

  if existing_user_id is not null then
    delete from public.user_roles
    where user_id = existing_user_id and role = 'user';

    insert into public.user_roles (user_id, role)
    values (existing_user_id, 'sales_partner')
    on conflict (user_id, role) do nothing;

    update public.sales_partner_invites
    set status = 'accepted', accepted_at = now()
    where id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_sales_partner_invite_created on public.sales_partner_invites;
create trigger on_sales_partner_invite_created
after insert on public.sales_partner_invites
for each row execute function public.activate_existing_partner_from_invite();

revoke execute on function public.assign_default_role() from public, anon, authenticated;
revoke execute on function public.activate_existing_partner_from_invite() from public, anon, authenticated;
