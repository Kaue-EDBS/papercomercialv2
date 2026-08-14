create extension if not exists pgcrypto;

create table if not exists public.cadastros (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  cod_protheus text unique,
  nome text not null,
  email text not null unique,
  cargo text not null,
  gestor text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cadastros_nome_preenchido check (btrim(nome) <> ''),
  constraint cadastros_email_normalizado check (email = lower(btrim(email)) and btrim(email) <> ''),
  constraint cadastros_cargo_valido check (cargo in ('Consultor', 'Gerente', 'Supervisor', 'Diretor', 'Administrador')),
  constraint cadastros_cod_protheus_por_cargo check (
    (cargo = 'Administrador' and cod_protheus is null)
    or (cargo in ('Consultor','Gerente','Supervisor','Diretor') and cod_protheus is not null and btrim(cod_protheus) <> '')
  ),
  constraint cadastros_gestor_por_cargo check (
    (cargo in ('Diretor','Administrador') and gestor is null)
    or (cargo in ('Consultor','Gerente','Supervisor') and gestor is not null and btrim(gestor) <> '')
  )
);

comment on table public.cadastros is 'Usuários autorizados do Paper Comercial V3. E-mail é a chave de login e comunicação.';
comment on column public.cadastros.cod_protheus is 'Identificador textual do time comercial. Nunca converter para número; zeros à esquerda são significativos.';
comment on column public.cadastros.gestor is 'Nome de referência do gestor, usado inicialmente para orientar a Etapa 2.2. Não é chave estrangeira nesta versão.';

grant select on table public.cadastros to authenticated;
grant all on table public.cadastros to service_role;

alter table public.cadastros enable row level security;

drop policy if exists cadastros_select_proprio on public.cadastros;
create policy cadastros_select_proprio
on public.cadastros
for select
to authenticated
using (auth.uid() is not null and auth_user_id = auth.uid());

create index if not exists cadastros_cargo_idx on public.cadastros (cargo);
create index if not exists cadastros_gestor_idx on public.cadastros (gestor);
create index if not exists cadastros_ativo_idx on public.cadastros (ativo) where ativo = true;

drop trigger if exists cadastros_touch on public.cadastros;
create trigger cadastros_touch
before update on public.cadastros
for each row execute function public.touch_updated_at();

-- Vincula o cadastro pelo e-mail dentro da função já usada pelo gatilho existente em auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
  v_cod TEXT := COALESCE(NEW.raw_user_meta_data->>'cod_protheus', split_part(NEW.email, '@', 1));
  v_nome TEXT := COALESCE(NEW.raw_user_meta_data->>'nome', v_cod);
  v_gestor TEXT := NEW.raw_user_meta_data->>'gestor';
  v_arquivo TEXT := NEW.raw_user_meta_data->>'arquivo_carteira';
  v_role public.app_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'consultor');
  v_must_change BOOLEAN := COALESCE((NEW.raw_user_meta_data->>'must_change_password')::BOOLEAN, true);
BEGIN
  INSERT INTO public.profiles (id, cod_protheus, nome, gestor, arquivo_carteira, must_change_password)
  VALUES (NEW.id, upper(v_cod), v_nome, v_gestor, v_arquivo, v_must_change)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.cadastros
     SET auth_user_id = NEW.id
   WHERE email = lower(btrim(NEW.email))
     AND (auth_user_id IS NULL OR auth_user_id = NEW.id);

  RETURN NEW;
END;
$function$;

-- Importação idempotente (somente servidor)
create or replace function public.import_cadastros(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  affected_rows integer;
begin
  if jsonb_typeof(payload) <> 'array' then
    raise exception 'payload deve ser um array JSON';
  end if;

  insert into public.cadastros (cod_protheus, nome, email, cargo, gestor, auth_user_id)
  select
    nullif(btrim(x.cod_protheus), ''),
    btrim(x.nome),
    lower(btrim(x.email)),
    btrim(x.cargo),
    nullif(btrim(x.gestor), ''),
    u.id
  from jsonb_to_recordset(payload) as x(
    cod_protheus text, nome text, email text, cargo text, gestor text
  )
  left join auth.users u on lower(u.email) = lower(btrim(x.email))
  on conflict (email) do update set
    cod_protheus = excluded.cod_protheus,
    nome = excluded.nome,
    cargo = excluded.cargo,
    gestor = excluded.gestor,
    auth_user_id = coalesce(excluded.auth_user_id, public.cadastros.auth_user_id),
    ativo = true;

  get diagnostics affected_rows = row_count;

  return jsonb_build_object(
    'status', 'ok',
    'registros_processados', affected_rows,
    'total_cadastros', (select count(*) from public.cadastros)
  );
end;
$$;

revoke all on function public.import_cadastros(jsonb) from public, anon, authenticated;
grant execute on function public.import_cadastros(jsonb) to service_role;

update public.cadastros c
   set auth_user_id = u.id
  from auth.users u
 where lower(u.email) = c.email
   and c.auth_user_id is null;