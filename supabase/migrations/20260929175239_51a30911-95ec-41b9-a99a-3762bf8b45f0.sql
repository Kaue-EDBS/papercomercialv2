begin;

alter table public.dim_municipio
  add column if not exists uf text,
  add column if not exists regiao text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'dim_municipio_uf_sigla_chk') then
    alter table public.dim_municipio
      add constraint dim_municipio_uf_sigla_chk check (uf is null or uf in
        ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'dim_municipio_regiao_chk') then
    alter table public.dim_municipio
      add constraint dim_municipio_regiao_chk check (regiao is null or regiao in
        ('Norte','Nordeste','Centro-Oeste','Sudeste','Sul'));
  end if;
end $$;

create table public.dim_escola (
  escola_id text primary key,
  cod_inep text unique,
  cod_municipio text not null references public.dim_municipio(cod_municipal),
  nome_escola text not null,
  tipo_escola text,
  endereco text,
  numero text,
  complemento text,
  bairro text,
  cep5 text,
  cep text,
  cnpj_escola_censo text,
  latitude double precision,
  longitude double precision,
  alunos_ei integer,
  alunos_ef1 integer,
  alunos_ef2 integer,
  alunos_em integer,
  alunos_total integer,
  dados_alunos_disponiveis boolean not null default false,
  tem_conflito_cadastro boolean not null default false,
  qtd_cadastros_protheus smallint not null default 1,
  atualizado_em timestamptz not null default now(),
  constraint dim_escola_id_chk check (escola_id ~ '^(INEP:[0-9]{8}|PROTHEUS:[A-Z0-9]{6})$'),
  constraint dim_escola_inep_chk check (cod_inep is null or cod_inep ~ '^[0-9]{8}$'),
  constraint dim_escola_tipo_chk check (tipo_escola is null or tipo_escola in ('Comunitária','Confessional','Filantrópica','Particular','Privada')),
  constraint dim_escola_cep5_chk check (cep5 is null or cep5 ~ '^[0-9]{5}$'),
  constraint dim_escola_cep_chk check (cep is null or cep ~ '^[0-9]{8}$'),
  constraint dim_escola_cep_consistente_chk check (cep5 is null or cep is null or cep5 = left(cep,5)),
  constraint dim_escola_cnpj_censo_chk check (cnpj_escola_censo is null or cnpj_escola_censo ~ '^[0-9]{14}$'),
  constraint dim_escola_coord_par_chk check ((latitude is null) = (longitude is null)),
  constraint dim_escola_lat_chk check (latitude is null or latitude between -90 and 90),
  constraint dim_escola_lon_chk check (longitude is null or longitude between -180 and 180),
  constraint dim_escola_alunos_estado_chk check (
    (dados_alunos_disponiveis = false and alunos_ei is null and alunos_ef1 is null and alunos_ef2 is null and alunos_em is null and alunos_total is null)
    or
    (dados_alunos_disponiveis = true and alunos_ei >= 0 and alunos_ef1 >= 0 and alunos_ef2 >= 0 and alunos_em >= 0
      and alunos_total = alunos_ei + alunos_ef1 + alunos_ef2 + alunos_em)
  ),
  constraint dim_escola_qtd_protheus_chk check (qtd_cadastros_protheus >= 1)
);

create table public.escola_protheus (
  cod_protheus text primary key,
  escola_id text not null references public.dim_escola(escola_id),
  cd_escola text,
  cnpj_protheus text,
  cnpj_protheus_status text not null,
  tipo_contrato_brasil text,
  adota_did_apoio_brasil boolean not null default false,
  adota_literatura_brasil boolean not null default false,
  adota_sistema_brasil boolean not null default false,
  adota_brasil boolean not null default false,
  adocao_inconsistente boolean not null default false,
  tipos_adocao text[] not null,
  mensalidade_ei text,
  mensalidade_ef1 text,
  mensalidade_ef2 text,
  mensalidade_em text,
  atualizado_em timestamptz not null default now(),
  constraint escola_protheus_codigo_chk check (cod_protheus ~ '^[A-Z0-9]{6}$'),
  constraint escola_protheus_cd_escola_chk check (cd_escola is null or cd_escola ~ '^[0-9]{6,9}$'),
  constraint escola_protheus_cnpj_chk check (cnpj_protheus is null or cnpj_protheus ~ '^[0-9]{14}$'),
  constraint escola_protheus_cnpj_status_chk check (cnpj_protheus_status in ('cnpj_valido','cpf_descartado','cnpj_invalido')),
  constraint escola_protheus_cpf_descartado_chk check (cnpj_protheus_status <> 'cpf_descartado' or cnpj_protheus is null),
  constraint escola_protheus_contrato_chk check (tipo_contrato_brasil is null or tipo_contrato_brasil in ('FIE','SISTEMA','VDD')),
  constraint escola_protheus_tipos_adocao_chk check (
    cardinality(tipos_adocao) >= 1
    and tipos_adocao <@ array['Didático e Apoio','Híbrido','Material Próprio','Sem informação','Sistema de Ensino','Sistema de Ensino e Material Próprio','Só literatura mapeada']::text[]
  ),
  constraint escola_protheus_mens_ei_chk check (mensalidade_ei is null or mensalidade_ei in ('1. até R$399','2. R$400 a R$799','3. R$800 a R$1.399','4. R$1.400 a R$2.399','5. acima de R$2.400')),
  constraint escola_protheus_mens_ef1_chk check (mensalidade_ef1 is null or mensalidade_ef1 in ('1. até R$399','2. R$400 a R$799','3. R$800 a R$1.399','4. R$1.400 a R$2.399','5. acima de R$2.400')),
  constraint escola_protheus_mens_ef2_chk check (mensalidade_ef2 is null or mensalidade_ef2 in ('1. até R$399','2. R$400 a R$799','3. R$800 a R$1.399','4. R$1.400 a R$2.399','5. acima de R$2.400')),
  constraint escola_protheus_mens_em_chk check (mensalidade_em is null or mensalidade_em in ('1. até R$399','2. R$400 a R$799','3. R$800 a R$1.399','4. R$1.400 a R$2.399','5. acima de R$2.400'))
);

comment on table public.dim_escola is 'Escola fisica. INEP repetido no CRM e consolidado em uma unica entidade fisica.';
comment on table public.escola_protheus is 'Cadastro operacional/comercial por COD_PROTHEUS. COD_PROTHEUS e a chave digitada pelo consultor.';

create index dim_escola_municipio_idx on public.dim_escola(cod_municipio);
create index dim_escola_demografia_idx on public.dim_escola(cod_municipio, cep5) where cep5 is not null;
create index dim_escola_cnpj_censo_idx on public.dim_escola(cnpj_escola_censo) where cnpj_escola_censo is not null;
create index escola_protheus_escola_idx on public.escola_protheus(escola_id);
create index escola_protheus_cd_escola_idx on public.escola_protheus(cd_escola) where cd_escola is not null;
create index escola_protheus_cnpj_idx on public.escola_protheus(cnpj_protheus) where cnpj_protheus is not null;

create view public.v_escola_por_protheus
with (security_invoker = true)
as
select
  p.cod_protheus,
  e.escola_id,
  e.cod_inep,
  p.cd_escola,
  m.regiao,
  m.uf,
  m.municipio,
  m.cod_municipal as cod_municipio,
  e.nome_escola,
  e.tipo_escola,
  e.endereco,
  e.numero,
  e.complemento,
  e.bairro,
  e.cep5,
  e.cep,
  e.cnpj_escola_censo,
  e.latitude,
  e.longitude,
  p.cnpj_protheus,
  p.cnpj_protheus_status,
  p.tipo_contrato_brasil,
  p.adota_did_apoio_brasil,
  p.adota_literatura_brasil,
  p.adota_sistema_brasil,
  p.adota_brasil,
  p.adocao_inconsistente,
  p.tipos_adocao,
  e.alunos_ei,
  e.alunos_ef1,
  e.alunos_ef2,
  e.alunos_em,
  e.alunos_total,
  e.dados_alunos_disponiveis,
  p.mensalidade_ei,
  p.mensalidade_ef1,
  p.mensalidade_ef2,
  p.mensalidade_em,
  e.tem_conflito_cadastro,
  e.qtd_cadastros_protheus
from public.escola_protheus p
join public.dim_escola e on e.escola_id = p.escola_id
join public.dim_municipio m on m.cod_municipal = e.cod_municipio;

grant all on table public.dim_escola to service_role;
grant all on table public.escola_protheus to service_role;
grant select on table public.v_escola_por_protheus to service_role;

alter table public.dim_escola enable row level security;
alter table public.escola_protheus enable row level security;

revoke all privileges on table public.dim_escola from anon, authenticated;
revoke all privileges on table public.escola_protheus from anon, authenticated;
revoke all privileges on table public.v_escola_por_protheus from anon, authenticated;

commit;