-- CIT V2 - Populacao por Faixa de Renda vs Faixa Etaria (CEP5 + Municipio)
-- Fontes aprovadas do Paper:
--   Populacao_por_Faixa_de_Renda_vs_Faixa_Etaria_-_CEP5.xlsx       (24.905 linhas)
--   Populacao_por_Faixa_de_Renda_vs_Faixa_Etaria_-_Municipios.xlsx (5.571 linhas)
--
-- Regra de arredondamento aprovada pelo responsavel em 2026-09-30 (digito a digito):
--   1a casa <= 4  -> para baixo
--   1a casa >= 6  -> para cima
--   1a casa  = 5  -> avalia a casa seguinte com o mesmo teste, recursivamente
--   valor ausente permanece NULL (ausencia nao e zero)
--
-- Acesso: RLS habilitado sem policy permissiva; anon/authenticated sem privilegio.

begin;

create table if not exists public.populacao_renda_faixa_etaria_cep5 (
  id bigint generated always as identity primary key,
  cep5 char(5) not null check (cep5 ~ '^[0-9]{5}$'),
  municipio text not null,
  camada_total bigint,
  pop_renda_a_pp_ate_4 bigint,
  pop_renda_a_pp_5_14 bigint,
  pop_renda_a_pp_15_19 bigint,
  pop_renda_a_p_ate_4 bigint,
  pop_renda_a_p_5_14 bigint,
  pop_renda_a_p_15_19 bigint,
  pop_renda_b1_ate_4 bigint,
  pop_renda_b1_5_14 bigint,
  pop_renda_b1_15_19 bigint,
  pop_renda_b2_ate_4 bigint,
  pop_renda_b2_5_14 bigint,
  pop_renda_b2_15_19 bigint,
  pop_renda_c1_ate_4 bigint,
  pop_renda_c1_5_14 bigint,
  pop_renda_c1_15_19 bigint,
  pop_renda_c2_ate_4 bigint,
  pop_renda_c2_5_14 bigint,
  pop_renda_c2_15_19 bigint,
  pop_renda_d_ate_4 bigint,
  pop_renda_d_5_14 bigint,
  pop_renda_d_15_19 bigint,
  pop_renda_e_ate_4 bigint,
  pop_renda_e_5_14 bigint,
  pop_renda_e_15_19 bigint
  , constraint populacao_renda_cep5_uk unique (cep5, municipio)
);

create index if not exists ix_pop_renda_cep5_municipio
  on public.populacao_renda_faixa_etaria_cep5 (municipio);

grant all on public.populacao_renda_faixa_etaria_cep5 to service_role;
revoke all on public.populacao_renda_faixa_etaria_cep5 from anon, authenticated;
alter table public.populacao_renda_faixa_etaria_cep5 enable row level security;

create table if not exists public.populacao_renda_faixa_etaria_municipio (
  cod_municipal text primary key
    references public.dim_municipio (cod_municipal),
  pop_renda_a_pp_total bigint,
  pop_renda_a_pp_ate_4 bigint,
  pop_renda_a_pp_5_14 bigint,
  pop_renda_a_pp_15_19 bigint,
  pop_renda_a_pp_20_24 bigint,
  pop_renda_a_pp_25_34 bigint,
  pop_renda_a_pp_35_44 bigint,
  pop_renda_a_pp_45_49 bigint,
  pop_renda_a_pp_50_59 bigint,
  pop_renda_a_pp_60_mais bigint,
  pop_renda_a_p_total bigint,
  pop_renda_a_p_ate_4 bigint,
  pop_renda_a_p_5_14 bigint,
  pop_renda_a_p_15_19 bigint,
  pop_renda_a_p_20_24 bigint,
  pop_renda_a_p_25_34 bigint,
  pop_renda_a_p_35_44 bigint,
  pop_renda_a_p_45_49 bigint,
  pop_renda_a_p_50_59 bigint,
  pop_renda_a_p_60_mais bigint,
  pop_renda_b1_total bigint,
  pop_renda_b1_ate_4 bigint,
  pop_renda_b1_5_14 bigint,
  pop_renda_b1_15_19 bigint,
  pop_renda_b1_20_24 bigint,
  pop_renda_b1_25_34 bigint,
  pop_renda_b1_35_44 bigint,
  pop_renda_b1_45_49 bigint,
  pop_renda_b1_50_59 bigint,
  pop_renda_b1_60_mais bigint,
  pop_renda_b2_total bigint,
  pop_renda_b2_ate_4 bigint,
  pop_renda_b2_5_14 bigint,
  pop_renda_b2_15_19 bigint,
  pop_renda_b2_20_24 bigint,
  pop_renda_b2_25_34 bigint,
  pop_renda_b2_35_44 bigint,
  pop_renda_b2_45_49 bigint,
  pop_renda_b2_50_59 bigint,
  pop_renda_b2_60_mais bigint,
  pop_renda_c1_total bigint,
  pop_renda_c1_ate_4 bigint,
  pop_renda_c1_5_14 bigint,
  pop_renda_c1_15_19 bigint,
  pop_renda_c1_20_24 bigint,
  pop_renda_c1_25_34 bigint,
  pop_renda_c1_35_44 bigint,
  pop_renda_c1_45_49 bigint,
  pop_renda_c1_50_59 bigint,
  pop_renda_c1_60_mais bigint,
  pop_renda_c2_total bigint,
  pop_renda_c2_ate_4 bigint,
  pop_renda_c2_5_14 bigint,
  pop_renda_c2_15_19 bigint,
  pop_renda_c2_20_24 bigint,
  pop_renda_c2_25_34 bigint,
  pop_renda_c2_35_44 bigint,
  pop_renda_c2_45_49 bigint,
  pop_renda_c2_50_59 bigint,
  pop_renda_c2_60_mais bigint,
  pop_renda_d_total bigint,
  pop_renda_d_ate_4 bigint,
  pop_renda_d_5_14 bigint,
  pop_renda_d_15_19 bigint,
  pop_renda_d_20_24 bigint,
  pop_renda_d_25_34 bigint,
  pop_renda_d_35_44 bigint,
  pop_renda_d_45_49 bigint,
  pop_renda_d_50_59 bigint,
  pop_renda_d_60_mais bigint,
  pop_renda_e_total bigint,
  pop_renda_e_ate_4 bigint,
  pop_renda_e_5_14 bigint,
  pop_renda_e_15_19 bigint,
  pop_renda_e_20_24 bigint,
  pop_renda_e_25_34 bigint,
  pop_renda_e_35_44 bigint,
  pop_renda_e_45_49 bigint,
  pop_renda_e_50_59 bigint,
  pop_renda_e_60_mais bigint

);

grant all on public.populacao_renda_faixa_etaria_municipio to service_role;
revoke all on public.populacao_renda_faixa_etaria_municipio from anon, authenticated;
alter table public.populacao_renda_faixa_etaria_municipio enable row level security;

commit;