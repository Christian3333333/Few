-- Few: perfil, cotización, destinatario, envío y voucher privado.
-- Cada persona solo lee y escribe lo suyo.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.perfiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  google_given_name text,
  sender_name text,
  dni text,
  phone text,
  constraint profiles_dni_digits check (dni is null or dni ~ '^[0-9]{8}$')
);

create table public.cotizaciones (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  send_amount numeric(12, 2) not null,
  country text not null,
  currency text not null,
  rate numeric(12, 2) not null,
  fee numeric(12, 2) not null,
  receive_amount numeric(12, 2) not null,
  total numeric(12, 2) not null,
  locked_at timestamptz not null,
  reference text not null unique,
  recipient_id uuid
);

create table public.destinatarios (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  country text not null,
  name text not null,
  iban text not null
);

alter table public.cotizaciones
  add constraint cotizaciones_destinatario_fk
  foreign key (recipient_id) references public.destinatarios (id);

create table public.envios (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  quote_id uuid not null references public.cotizaciones (id),
  recipient_id uuid not null references public.destinatarios (id),
  submitted_at timestamptz not null,
  send_amount numeric(12, 2) not null,
  country text not null,
  currency text not null,
  rate numeric(12, 2) not null,
  fee numeric(12, 2) not null,
  receive_amount numeric(12, 2) not null,
  total numeric(12, 2) not null,
  reference text not null,
  sender_name text not null,
  sender_dni text not null,
  sender_phone text not null,
  recipient_name text not null,
  recipient_iban text not null,
  voucher_content_type text not null,
  voucher_bytes integer not null
);

alter table public.perfiles enable row level security;
alter table public.cotizaciones enable row level security;
alter table public.destinatarios enable row level security;
alter table public.envios enable row level security;

create policy profiles_select on public.perfiles
  for select to authenticated using (user_id = (select auth.uid()));
create policy profiles_update on public.perfiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy quotes_select on public.cotizaciones
  for select to authenticated using (user_id = (select auth.uid()));
create policy quotes_insert on public.cotizaciones
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy quotes_update on public.cotizaciones
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy recipients_select on public.destinatarios
  for select to authenticated using (user_id = (select auth.uid()));
create policy recipients_insert on public.destinatarios
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy transfers_select on public.envios
  for select to authenticated using (user_id = (select auth.uid()));
create policy transfers_insert on public.envios
  for insert to authenticated with check (user_id = (select auth.uid()));

create or replace function private.protect_profile()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.sender_name is not null and new.sender_name is distinct from old.sender_name then
    raise exception 'sender name is immutable';
  end if;
  if old.dni is not null and new.dni is distinct from old.dni then
    raise exception 'dni is immutable';
  end if;
  if old.phone is not null and new.phone is distinct from old.phone then
    raise exception 'phone is immutable';
  end if;
  if new.email is distinct from old.email then
    new.email := old.email;
  end if;
  if old.google_given_name is not null and new.google_given_name is distinct from old.google_given_name then
    new.google_given_name := old.google_given_name;
  end if;
  if new.user_id is distinct from old.user_id then
    raise exception 'user is immutable';
  end if;
  return new;
end;
$$;

create trigger profiles_protect
  before update on public.perfiles
  for each row execute function private.protect_profile();

create or replace function private.protect_quote()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id is distinct from old.user_id
    or new.send_amount is distinct from old.send_amount
    or new.country is distinct from old.country
    or new.currency is distinct from old.currency
    or new.rate is distinct from old.rate
    or new.fee is distinct from old.fee
    or new.receive_amount is distinct from old.receive_amount
    or new.total is distinct from old.total
    or new.locked_at is distinct from old.locked_at
    or new.reference is distinct from old.reference
  then
    raise exception 'quote is locked';
  end if;
  return new;
end;
$$;

create trigger quotes_protect
  before update on public.cotizaciones
  for each row execute function private.protect_quote();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (user_id, email, google_given_name)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(
      split_part(
        coalesce(new.raw_user_meta_data ->> 'given_name', new.raw_user_meta_data ->> 'name', ''),
        ' ',
        1
      ),
      ''
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

insert into storage.buckets (id, name, public)
values ('vouchers', 'vouchers', false)
on conflict (id) do nothing;

create policy vouchers_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'vouchers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy vouchers_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'vouchers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

grant usage on schema private to authenticated, supabase_auth_admin;
grant execute on function private.protect_profile() to authenticated;
grant execute on function private.protect_quote() to authenticated;
grant execute on function private.handle_new_user() to supabase_auth_admin;
