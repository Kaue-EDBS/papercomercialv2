-- Paper Comercial V2 - Geografia canonica DTB 2025 + CEP5
-- Fontes:
--   - IBGE / Divisao Territorial Brasileira 2025
--   - CEP5.xlsx auditado em 2026-09-15
--
-- Principio:
--   COD_MUNICIPAL e a chave canonica administrativa.
--   CEP5 e granularidade territorial operacional de primeira classe,
--   identificada de forma inequivoca por (cod_municipal, cep5).

begin;

-- Municipio canonico DTB 2025.
create table if not exists public.dim_municipio (
  cod_municipal text primary key check (cod_municipal ~ '^[0-9]{7}$'),
  municipio text not null,
  cod_uf text not null check (cod_uf ~ '^[0-9]{2}$'),
  nome_uf text not null,
  cod_regiao_intermediaria text not null check (cod_regiao_intermediaria ~ '^[0-9]{4}$'),
  regiao_intermediaria text not null,
  cod_regiao_imediata text not null check (cod_regiao_imediata ~ '^[0-9]{6}$'),
  regiao_imediata text not null,
  cod_municipio_dtb text not null check (cod_municipio_dtb ~ '^[0-9]{5}$'),
  ano_dtb smallint not null check (ano_dtb between 2000 and 2100),
  data_base_dtb date not null,
  ativo boolean not null default true,
  carga_id uuid not null references public.etl_cargas(carga_id) on delete restrict,
  atualizado_em timestamptz not null default now(),
  unique (cod_uf, cod_municipio_dtb)
);

create index if not exists dim_municipio_uf_idx
  on public.dim_municipio (cod_uf);
create index if not exists dim_municipio_regiao_intermediaria_idx
  on public.dim_municipio (cod_regiao_intermediaria);
create index if not exists dim_municipio_regiao_imediata_idx
  on public.dim_municipio (cod_regiao_imediata);
create index if not exists dim_municipio_nome_uf_idx
  on public.dim_municipio (cod_uf, municipio);

-- Distritos DTB 2025.
create table if not exists public.dim_distrito (
  cod_distrito text primary key check (cod_distrito ~ '^[0-9]{9}$'),
  cod_municipal text not null references public.dim_municipio(cod_municipal) on delete restrict,
  distrito_dtb text not null check (distrito_dtb ~ '^[0-9]{2}$'),
  distrito text not null,
  ano_dtb smallint not null check (ano_dtb between 2000 and 2100),
  data_base_dtb date not null,
  ativo boolean not null default true,
  carga_id uuid not null references public.etl_cargas(carga_id) on delete restrict,
  atualizado_em timestamptz not null default now(),
  check (left(cod_distrito, 7) = cod_municipal)
);

create index if not exists dim_distrito_municipio_idx
  on public.dim_distrito (cod_municipal);

-- Subdistritos DTB 2025.
create table if not exists public.dim_subdistrito (
  cod_subdistrito text primary key check (cod_subdistrito ~ '^[0-9]{11}$'),
  cod_distrito text not null references public.dim_distrito(cod_distrito) on delete restrict,
  cod_municipal text not null references public.dim_municipio(cod_municipal) on delete restrict,
  subdistrito_dtb text not null check (subdistrito_dtb ~ '^[0-9]{2}$'),
  subdistrito text not null,
  ano_dtb smallint not null check (ano_dtb between 2000 and 2100),
  data_base_dtb date not null,
  ativo boolean not null default true,
  carga_id uuid not null references public.etl_cargas(carga_id) on delete restrict,
  atualizado_em timestamptz not null default now(),
  check (left(cod_subdistrito, 9) = cod_distrito),
  check (left(cod_subdistrito, 7) = cod_municipal)
);

create index if not exists dim_subdistrito_distrito_idx
  on public.dim_subdistrito (cod_distrito);
create index if not exists dim_subdistrito_municipio_idx
  on public.dim_subdistrito (cod_municipal);

-- CEP5 operacional.
-- O mesmo CEP5 pode pertencer a mais de um municipio. Por isso a PK e composta.
create table if not exists public.dim_cep5 (
  cod_municipal text not null references public.dim_municipio(cod_municipal) on delete restrict,
  cep5 text not null check (cep5 ~ '^[0-9]{5}$'),
  municipio_origem text not null,
  uf_origem text not null check (uf_origem ~ '^[A-Z]{2}$'),
  metodo_resolucao text not null check (metodo_resolucao in ('EXATO', 'ALIAS_HOMOLOGADO')),
  ativo boolean not null default true,
  carga_id uuid not null references public.etl_cargas(carga_id) on delete restrict,
  atualizado_em timestamptz not null default now(),
  primary key (cod_municipal, cep5)
);

create index if not exists dim_cep5_cep5_idx
  on public.dim_cep5 (cep5);
create index if not exists dim_cep5_municipio_idx
  on public.dim_cep5 (cod_municipal);
create index if not exists dim_cep5_uf_origem_idx
  on public.dim_cep5 (uf_origem);

-- Camada interna: acesso por backend/server-side ate existir contrato de exposicao.
alter table public.dim_municipio enable row level security;
alter table public.dim_distrito enable row level security;
alter table public.dim_subdistrito enable row level security;
alter table public.dim_cep5 enable row level security;

revoke all on table public.dim_municipio from anon, authenticated;
revoke all on table public.dim_distrito from anon, authenticated;
revoke all on table public.dim_subdistrito from anon, authenticated;
revoke all on table public.dim_cep5 from anon, authenticated;

comment on table public.dim_municipio is
  'Dimensao municipal canonica do Paper Comercial V2, baseada na DTB 2025 do IBGE.';
comment on table public.dim_distrito is
  'Hierarquia de distritos DTB 2025 vinculada ao municipio canonico.';
comment on table public.dim_subdistrito is
  'Hierarquia de subdistritos DTB 2025 vinculada a distrito e municipio canonicos.';
comment on table public.dim_cep5 is
  'Dimensao territorial operacional CEP5. A identidade e (cod_municipal, cep5) porque CEP5 nao e globalmente unico.';
comment on column public.dim_cep5.cep5 is
  'Prefixo textual de 5 digitos. Mantido como text para preservar zeros a esquerda.';
comment on column public.dim_cep5.metodo_resolucao is
  'Metodo usado para relacionar Municipio+UF da fonte ao COD_MUNICIPAL canonico: EXATO ou ALIAS_HOMOLOGADO.';

commit;
