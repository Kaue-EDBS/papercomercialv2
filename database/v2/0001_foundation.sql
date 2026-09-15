-- Paper Comercial V2 - Fundacao operacional
-- Fonte oficial: GitHub / database/v2
-- Este arquivo define apenas tabelas tecnicas. Nao cria datasets de negocio.

-- # etl_cargas
-- Registra cada carga de dados: origem, arquivo, volume, status e timestamps do processamento.
create table if not exists public.etl_cargas (
  carga_id uuid primary key default gen_random_uuid(),
  dataset text not null,
  fonte_sistema text not null,
  fonte_referencia text,
  ano_referencia integer,
  arquivo_nome text,
  arquivo_sha256 text,
  status text not null check (status in ('iniciada', 'validada', 'concluida', 'rejeitada', 'erro')),
  linhas_recebidas bigint not null default 0 check (linhas_recebidas >= 0),
  linhas_validas bigint not null default 0 check (linhas_validas >= 0),
  linhas_rejeitadas bigint not null default 0 check (linhas_rejeitadas >= 0),
  linhas_gravadas bigint not null default 0 check (linhas_gravadas >= 0),
  iniciada_em timestamptz not null default now(),
  finalizada_em timestamptz,
  observacoes text,
  criado_em timestamptz not null default now()
);

create index if not exists etl_cargas_dataset_idx on public.etl_cargas (dataset);
create index if not exists etl_cargas_status_idx on public.etl_cargas (status);
create index if not exists etl_cargas_iniciada_em_idx on public.etl_cargas (iniciada_em desc);

-- # audit_data_quality
-- Guarda os checks de qualidade de cada dataset/carga antes da liberacao para consumo.
create table if not exists public.audit_data_quality (
  check_id uuid primary key default gen_random_uuid(),
  carga_id uuid references public.etl_cargas(carga_id) on delete set null,
  dataset text not null,
  nome_check text not null,
  severidade text not null check (severidade in ('info', 'warning', 'critical')),
  passou boolean not null,
  detalhes jsonb not null default '{}'::jsonb,
  executado_em timestamptz not null default now()
);

create index if not exists audit_data_quality_carga_idx on public.audit_data_quality (carga_id);
create index if not exists audit_data_quality_dataset_idx on public.audit_data_quality (dataset);

-- # audit_replication_runs
-- Audita cada replicacao PRIMARY -> REPLICA, comparando volumes, checksums e status de paridade.
create table if not exists public.audit_replication_runs (
  run_id uuid primary key default gen_random_uuid(),
  carga_id uuid references public.etl_cargas(carga_id) on delete set null,
  tabela text not null,
  origem text not null default 'lovable_cloud',
  destino text not null default 'supabase_replica',
  status text not null check (status in ('iniciada', 'concluida', 'divergente', 'erro')),
  linhas_origem bigint check (linhas_origem is null or linhas_origem >= 0),
  linhas_destino bigint check (linhas_destino is null or linhas_destino >= 0),
  inseridas bigint not null default 0 check (inseridas >= 0),
  atualizadas bigint not null default 0 check (atualizadas >= 0),
  rejeitadas bigint not null default 0 check (rejeitadas >= 0),
  checksum_origem text,
  checksum_destino text,
  iniciada_em timestamptz not null default now(),
  finalizada_em timestamptz,
  erro text
);

create index if not exists audit_replication_runs_carga_idx on public.audit_replication_runs (carga_id);
create index if not exists audit_replication_runs_tabela_idx on public.audit_replication_runs (tabela);
create index if not exists audit_replication_runs_status_idx on public.audit_replication_runs (status);

-- Tabelas tecnicas internas: RLS habilitado e sem grants diretos para usuarios finais.
alter table public.etl_cargas enable row level security;
alter table public.audit_data_quality enable row level security;
alter table public.audit_replication_runs enable row level security;

revoke all on table public.etl_cargas from anon, authenticated;
revoke all on table public.audit_data_quality from anon, authenticated;
revoke all on table public.audit_replication_runs from anon, authenticated;

comment on table public.etl_cargas is 'Registro de cargas de datasets do Paper Comercial V2.';
comment on table public.audit_data_quality is 'Resultados de verificacoes de qualidade por dataset/carga do Paper Comercial V2.';
comment on table public.audit_replication_runs is 'Auditoria da replica unidirecional Lovable Cloud PRIMARY -> Supabase REPLICA.';
