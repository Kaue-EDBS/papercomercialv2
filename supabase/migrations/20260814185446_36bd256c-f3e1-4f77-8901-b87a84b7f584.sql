create table if not exists public.carteiras_escolas_v3 (
  id bigint generated always as identity primary key,

  cod_protheus text not null,
  cod_inep text,
  cod_escola text,
  regiao text not null,
  uf text not null,
  cod_consultor text not null,
  consultor text not null,
  gerente text not null,
  municipio text not null,
  cod_municipio text not null,
  regiao_geografica_intermediaria text not null,
  cod_regiao_geografica_intermediaria text not null,
  regiao_geografica_imediata text not null,
  cod_regiao_geografica_imediata text not null,
  nome_escola text not null,
  tipo_escola text,
  endereco text not null,
  numero text,
  bairro text not null,
  cep5 text not null,
  cep text not null,
  ddd text,
  telefone text,
  cnpj_escola_censo text,
  latitude double precision,
  longitude double precision,
  tipo_contrato_brasil text,
  adota_did_apoio_brasil boolean not null default false,
  adota_lit_brasil boolean not null default false,
  adota_sistema_brasil boolean not null default false,
  adota_brasil boolean not null default false,
  tipo_adocao text not null,
  alvo_cora boolean not null default false,
  alvo_bilingue boolean not null default false,
  alvo_brincando boolean not null default false,
  alvo_versa boolean not null default false,
  alunos_ei integer not null default 0,
  alunos_f1 integer not null default 0,
  alunos_f2 integer not null default 0,
  alunos_em integer not null default 0,
  mensalidade_ei text,
  mensalidade_f1 text,
  mensalidade_f2 text,
  mensalidade_em text,
  adocao_brasil_did_apoio_ei integer not null default 0,
  adocao_brasil_did_apoio_f1 integer not null default 0,
  adocao_brasil_did_apoio_f2 integer not null default 0,
  adocao_brasil_did_apoio_em integer not null default 0,
  adocao_brasil_literatura_ei integer not null default 0,
  adocao_brasil_literatura_f1 integer not null default 0,
  adocao_brasil_literatura_f2 integer not null default 0,
  adocao_brasil_literatura_em integer not null default 0,
  adocao_brasil_sistema_ei integer not null default 0,
  adocao_brasil_sistema_f1 integer not null default 0,
  adocao_brasil_sistema_f2 integer not null default 0,
  adocao_brasil_sistema_em integer not null default 0,
  adocao_outra_did_apoio_ei integer not null default 0,
  adocao_outra_did_apoio_f1 integer not null default 0,
  adocao_outra_did_apoio_f2 integer not null default 0,
  adocao_outra_did_apoio_em integer not null default 0,
  adocao_outra_literatura_ei integer not null default 0,
  adocao_outra_literatura_f1 integer not null default 0,
  adocao_outra_literatura_f2 integer not null default 0,
  adocao_outra_literatura_em integer not null default 0,
  adocao_outra_sistema_ei integer not null default 0,
  adocao_outra_sistema_f1 integer not null default 0,
  adocao_outra_sistema_f2 integer not null default 0,
  adocao_outra_sistema_em integer not null default 0,
  adocao_material_proprio_ei integer not null default 0,
  adocao_material_proprio_f1 integer not null default 0,
  adocao_material_proprio_f2 integer not null default 0,
  adocao_material_proprio_em integer not null default 0,

  imported_at timestamptz not null default now(),

  constraint carteiras_uf_valida check (uf ~ '^[A-Z]{2}$'),
  constraint carteiras_cep5_valido check (cep5 ~ '^[0-9]{5}$'),
  constraint carteiras_cep_valido check (cep ~ '^[0-9]{8}$'),
  constraint carteiras_ddd_valido check (ddd is null or ddd ~ '^[0-9]{2}$'),
  constraint carteiras_telefone_valido check (telefone is null or telefone ~ '^[0-9]{4,15}$'),
  constraint carteiras_cnpj_valido check (
    cnpj_escola_censo is null or cnpj_escola_censo ~ '^[0-9]{14}$'
  ),
  constraint carteiras_latitude_valida check (
    latitude is null or latitude between -90 and 90
  ),
  constraint carteiras_longitude_valida check (
    longitude is null or longitude between -180 and 180
  ),
  constraint carteiras_contrato_valido check (
    tipo_contrato_brasil is null or tipo_contrato_brasil in ('FIE', 'VDD', 'SISTEMA')
  )
);

comment on table public.carteiras_escolas_v3 is
  'Carteiras comerciais de escolas da Etapa 2.1 do Paper Comercial V3.';
comment on column public.carteiras_escolas_v3.cod_protheus is
  'Código textual da escola no Protheus. A fonte contém 13 códigos repetidos; não usar como chave primária.';
comment on column public.carteiras_escolas_v3.cod_consultor is
  'Código textual reconciliado com public.cadastros.cod_protheus; zeros à esquerda são significativos.';
comment on column public.carteiras_escolas_v3.telefone is
  'Número sem DDD quando a separação foi possível. A apresentação formatada está na view vw_carteiras_etapa_2_1.';

create index if not exists carteiras_cod_protheus_idx on public.carteiras_escolas_v3 (cod_protheus);
create index if not exists carteiras_cod_consultor_idx on public.carteiras_escolas_v3 (cod_consultor);
create index if not exists carteiras_gerente_idx on public.carteiras_escolas_v3 (gerente);
create index if not exists carteiras_uf_municipio_idx on public.carteiras_escolas_v3 (uf, municipio);
create index if not exists carteiras_cep5_idx on public.carteiras_escolas_v3 (cep5);
create index if not exists carteiras_alvos_idx on public.carteiras_escolas_v3 (alvo_cora, alvo_bilingue, alvo_brincando, alvo_versa);

create or replace view public.vw_carteiras_etapa_2_1
with (security_invoker = true)
as
select
  c.*,
  case
    when c.ddd ~ '^[0-9]{2}$' and c.telefone ~ '^[0-9]{8}$'
      then '(' || c.ddd || ') ' || substr(c.telefone, 1, 4) || '-' || substr(c.telefone, 5, 4)
    when c.ddd ~ '^[0-9]{2}$' and c.telefone ~ '^[0-9]{9}$'
      then '(' || c.ddd || ') ' || substr(c.telefone, 1, 1) || ' ' || substr(c.telefone, 2, 4) || '-' || substr(c.telefone, 6, 4)
    when c.telefone is null then null
    else concat_ws(' ', case when c.ddd is not null then '(' || c.ddd || ')' end, c.telefone)
  end as telefone_formatado,
  c.alunos_ei + c.alunos_f1 + c.alunos_f2 + c.alunos_em as total_alunos,
  count(*) over (partition by c.cod_protheus) as ocorrencias_cod_protheus
from public.carteiras_escolas_v3 c;

create or replace function public.reset_carteiras_escolas_v3()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  truncate table public.carteiras_escolas_v3 restart identity;
end;
$$;

create or replace function public.validar_carteiras_escolas_v3()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'registros', count(*),
    'escolas_distintas', count(distinct cod_protheus),
    'carteiras', count(distinct cod_consultor),
    'codigos_escola_repetidos', (
      select count(*)
      from (
        select cod_protheus
        from public.carteiras_escolas_v3
        group by cod_protheus
        having count(*) > 1
      ) duplicados
    )
  )
  from public.carteiras_escolas_v3;
$$;

revoke all on function public.reset_carteiras_escolas_v3() from public, anon, authenticated;
revoke all on function public.validar_carteiras_escolas_v3() from public, anon, authenticated;
grant execute on function public.reset_carteiras_escolas_v3() to service_role;
grant execute on function public.validar_carteiras_escolas_v3() to service_role;

alter table public.carteiras_escolas_v3 enable row level security;
revoke all on table public.carteiras_escolas_v3 from anon;
revoke insert, update, delete on table public.carteiras_escolas_v3 from authenticated;
grant select on table public.carteiras_escolas_v3 to authenticated;
grant select on public.vw_carteiras_etapa_2_1 to authenticated;
grant select, insert, update, delete on table public.carteiras_escolas_v3 to service_role;
grant usage, select on sequence public.carteiras_escolas_v3_id_seq to service_role;

drop policy if exists carteiras_select_etapa_2_1 on public.carteiras_escolas_v3;
create policy carteiras_select_etapa_2_1
on public.carteiras_escolas_v3
for select
to authenticated
using (
  (select auth.uid()) is not null
  and exists (
    select 1
    from public.cadastros usuario
    where usuario.auth_user_id = (select auth.uid())
      and usuario.ativo = true
      and (
        usuario.cargo in ('Diretor', 'Administrador')
        or (
          usuario.cargo = 'Consultor'
          and usuario.cod_protheus = carteiras_escolas_v3.cod_consultor
        )
      )
  )
);