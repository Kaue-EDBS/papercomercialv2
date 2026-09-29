-- 0012_densidade_demografica_cep5_v2.sql
-- CIT V2 — Densidade Demografica por (municipio, cep5)
-- Fonte: densidade_demografica_cep5_higienizado_pacote_V2.zip (08/09/2026)
-- CSV SHA-256: ba40e7562eb9b3e940c3675ed1bae56fbb3a50e29c0fc2fa484633b5b12403ba
-- 24.905 registros, 123 colunas. Chave logica composta (municipio, cep5).
-- Acesso: RLS habilitada sem policy permissiva; anon/authenticated sem privilegio.

-- Densidade Demografica CEP5 - dados higienizados inteiros
-- PostgreSQL / Lovable Cloud

CREATE TABLE IF NOT EXISTS public.densidade_demografica_cep5 (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cep5 char(5) NOT NULL,
  municipio text NOT NULL,
  populacao bigint NULL,
  renda_nominal bigint NULL,
  renda_faixa_total bigint NULL,
  renda_faixa_a_pp bigint NULL,
  renda_faixa_a_p bigint NULL,
  renda_faixa_b1 bigint NULL,
  renda_faixa_b2 bigint NULL,
  renda_faixa_c1 bigint NULL,
  renda_faixa_c2 bigint NULL,
  renda_faixa_d bigint NULL,
  renda_faixa_e bigint NULL,
  pop_idade_total bigint NULL,
  pop_idade_ate_9 bigint NULL,
  pop_idade_ate_4 bigint NULL,
  pop_idade_5_9 bigint NULL,
  pop_idade_10_14 bigint NULL,
  pop_idade_15_19 bigint NULL,
  pop_idade_20_24 bigint NULL,
  pop_idade_25_34 bigint NULL,
  pop_idade_25_29 bigint NULL,
  pop_idade_30_34 bigint NULL,
  pop_idade_35_49 bigint NULL,
  pop_idade_35_39 bigint NULL,
  pop_idade_40_44 bigint NULL,
  pop_idade_45_49 bigint NULL,
  pop_idade_50_59 bigint NULL,
  pop_idade_50_54 bigint NULL,
  pop_idade_55_59 bigint NULL,
  pop_idade_60_mais bigint NULL,
  pop_idade_60_64 bigint NULL,
  pop_idade_65_69 bigint NULL,
  pop_idade_70_74 bigint NULL,
  pop_idade_75_79 bigint NULL,
  pop_idade_80_mais bigint NULL,
  consumo_total bigint NULL,
  consumo_livros_material_escolar bigint NULL,
  consumo_artigos_escolares bigint NULL,
  consumo_livros_didaticos_revistas_tecnicas bigint NULL,
  consumo_outros_livros_material_escolar bigint NULL,
  consumo_cursos_regulares bigint NULL,
  pop_renda_idade_total bigint NULL,
  pop_renda_a_pp_total bigint NULL,
  pop_renda_a_pp_ate_4 bigint NULL,
  pop_renda_a_pp_5_14 bigint NULL,
  pop_renda_a_pp_15_19 bigint NULL,
  pop_renda_a_pp_20_24 bigint NULL,
  pop_renda_a_pp_25_34 bigint NULL,
  pop_renda_a_pp_35_44 bigint NULL,
  pop_renda_a_pp_45_49 bigint NULL,
  pop_renda_a_pp_50_59 bigint NULL,
  pop_renda_a_pp_60_mais bigint NULL,
  pop_renda_a_p_total bigint NULL,
  pop_renda_a_p_ate_4 bigint NULL,
  pop_renda_a_p_5_14 bigint NULL,
  pop_renda_a_p_15_19 bigint NULL,
  pop_renda_a_p_20_24 bigint NULL,
  pop_renda_a_p_25_34 bigint NULL,
  pop_renda_a_p_35_44 bigint NULL,
  pop_renda_a_p_45_49 bigint NULL,
  pop_renda_a_p_50_59 bigint NULL,
  pop_renda_a_p_60_mais bigint NULL,
  pop_renda_b1_total bigint NULL,
  pop_renda_b1_ate_4 bigint NULL,
  pop_renda_b1_5_14 bigint NULL,
  pop_renda_b1_15_19 bigint NULL,
  pop_renda_b1_20_24 bigint NULL,
  pop_renda_b1_25_34 bigint NULL,
  pop_renda_b1_35_44 bigint NULL,
  pop_renda_b1_45_49 bigint NULL,
  pop_renda_b1_50_59 bigint NULL,
  pop_renda_b1_60_mais bigint NULL,
  pop_renda_b2_total bigint NULL,
  pop_renda_b2_ate_4 bigint NULL,
  pop_renda_b2_5_14 bigint NULL,
  pop_renda_b2_15_19 bigint NULL,
  pop_renda_b2_20_24 bigint NULL,
  pop_renda_b2_25_34 bigint NULL,
  pop_renda_b2_35_44 bigint NULL,
  pop_renda_b2_45_49 bigint NULL,
  pop_renda_b2_50_59 bigint NULL,
  pop_renda_b2_60_mais bigint NULL,
  pop_renda_c1_total bigint NULL,
  pop_renda_c1_ate_4 bigint NULL,
  pop_renda_c1_5_14 bigint NULL,
  pop_renda_c1_15_19 bigint NULL,
  pop_renda_c1_20_24 bigint NULL,
  pop_renda_c1_25_34 bigint NULL,
  pop_renda_c1_35_44 bigint NULL,
  pop_renda_c1_45_49 bigint NULL,
  pop_renda_c1_50_59 bigint NULL,
  pop_renda_c1_60_mais bigint NULL,
  pop_renda_c2_total bigint NULL,
  pop_renda_c2_ate_4 bigint NULL,
  pop_renda_c2_5_14 bigint NULL,
  pop_renda_c2_15_19 bigint NULL,
  pop_renda_c2_20_24 bigint NULL,
  pop_renda_c2_25_34 bigint NULL,
  pop_renda_c2_35_44 bigint NULL,
  pop_renda_c2_45_49 bigint NULL,
  pop_renda_c2_50_59 bigint NULL,
  pop_renda_c2_60_mais bigint NULL,
  pop_renda_d_total bigint NULL,
  pop_renda_d_ate_4 bigint NULL,
  pop_renda_d_5_14 bigint NULL,
  pop_renda_d_15_19 bigint NULL,
  pop_renda_d_20_24 bigint NULL,
  pop_renda_d_25_34 bigint NULL,
  pop_renda_d_35_44 bigint NULL,
  pop_renda_d_45_49 bigint NULL,
  pop_renda_d_50_59 bigint NULL,
  pop_renda_d_60_mais bigint NULL,
  pop_renda_e_total bigint NULL,
  pop_renda_e_ate_4 bigint NULL,
  pop_renda_e_5_14 bigint NULL,
  pop_renda_e_15_19 bigint NULL,
  pop_renda_e_20_24 bigint NULL,
  pop_renda_e_25_34 bigint NULL,
  pop_renda_e_35_44 bigint NULL,
  pop_renda_e_45_49 bigint NULL,
  pop_renda_e_50_59 bigint NULL,
  pop_renda_e_60_mais bigint NULL,
  CONSTRAINT densidade_demografica_cep5_uq UNIQUE (cep5, municipio),
  CONSTRAINT densidade_cep5_age_cap CHECK (populacao IS NULL OR (COALESCE(pop_idade_ate_4,0) + COALESCE(pop_idade_5_9,0) + COALESCE(pop_idade_10_14,0) + COALESCE(pop_idade_15_19,0) + COALESCE(pop_idade_20_24,0) + COALESCE(pop_idade_25_29,0) + COALESCE(pop_idade_30_34,0) + COALESCE(pop_idade_35_39,0) + COALESCE(pop_idade_40_44,0) + COALESCE(pop_idade_45_49,0) + COALESCE(pop_idade_50_54,0) + COALESCE(pop_idade_55_59,0) + COALESCE(pop_idade_60_64,0) + COALESCE(pop_idade_65_69,0) + COALESCE(pop_idade_70_74,0) + COALESCE(pop_idade_75_79,0) + COALESCE(pop_idade_80_mais,0)) <= populacao),
  CONSTRAINT densidade_cep5_income_cap CHECK (populacao IS NULL OR (COALESCE(pop_renda_a_pp_total,0) + COALESCE(pop_renda_a_p_total,0) + COALESCE(pop_renda_b1_total,0) + COALESCE(pop_renda_b2_total,0) + COALESCE(pop_renda_c1_total,0) + COALESCE(pop_renda_c2_total,0) + COALESCE(pop_renda_d_total,0) + COALESCE(pop_renda_e_total,0)) <= populacao),
  CONSTRAINT densidade_cep5_cross_cap CHECK (populacao IS NULL OR (COALESCE(pop_renda_a_pp_ate_4,0) + COALESCE(pop_renda_a_pp_5_14,0) + COALESCE(pop_renda_a_pp_15_19,0) + COALESCE(pop_renda_a_pp_20_24,0) + COALESCE(pop_renda_a_pp_25_34,0) + COALESCE(pop_renda_a_pp_35_44,0) + COALESCE(pop_renda_a_pp_45_49,0) + COALESCE(pop_renda_a_pp_50_59,0) + COALESCE(pop_renda_a_pp_60_mais,0) + COALESCE(pop_renda_a_p_ate_4,0) + COALESCE(pop_renda_a_p_5_14,0) + COALESCE(pop_renda_a_p_15_19,0) + COALESCE(pop_renda_a_p_20_24,0) + COALESCE(pop_renda_a_p_25_34,0) + COALESCE(pop_renda_a_p_35_44,0) + COALESCE(pop_renda_a_p_45_49,0) + COALESCE(pop_renda_a_p_50_59,0) + COALESCE(pop_renda_a_p_60_mais,0) + COALESCE(pop_renda_b1_ate_4,0) + COALESCE(pop_renda_b1_5_14,0) + COALESCE(pop_renda_b1_15_19,0) + COALESCE(pop_renda_b1_20_24,0) + COALESCE(pop_renda_b1_25_34,0) + COALESCE(pop_renda_b1_35_44,0) + COALESCE(pop_renda_b1_45_49,0) + COALESCE(pop_renda_b1_50_59,0) + COALESCE(pop_renda_b1_60_mais,0) + COALESCE(pop_renda_b2_ate_4,0) + COALESCE(pop_renda_b2_5_14,0) + COALESCE(pop_renda_b2_15_19,0) + COALESCE(pop_renda_b2_20_24,0) + COALESCE(pop_renda_b2_25_34,0) + COALESCE(pop_renda_b2_35_44,0) + COALESCE(pop_renda_b2_45_49,0) + COALESCE(pop_renda_b2_50_59,0) + COALESCE(pop_renda_b2_60_mais,0) + COALESCE(pop_renda_c1_ate_4,0) + COALESCE(pop_renda_c1_5_14,0) + COALESCE(pop_renda_c1_15_19,0) + COALESCE(pop_renda_c1_20_24,0) + COALESCE(pop_renda_c1_25_34,0) + COALESCE(pop_renda_c1_35_44,0) + COALESCE(pop_renda_c1_45_49,0) + COALESCE(pop_renda_c1_50_59,0) + COALESCE(pop_renda_c1_60_mais,0) + COALESCE(pop_renda_c2_ate_4,0) + COALESCE(pop_renda_c2_5_14,0) + COALESCE(pop_renda_c2_15_19,0) + COALESCE(pop_renda_c2_20_24,0) + COALESCE(pop_renda_c2_25_34,0) + COALESCE(pop_renda_c2_35_44,0) + COALESCE(pop_renda_c2_45_49,0) + COALESCE(pop_renda_c2_50_59,0) + COALESCE(pop_renda_c2_60_mais,0) + COALESCE(pop_renda_d_ate_4,0) + COALESCE(pop_renda_d_5_14,0) + COALESCE(pop_renda_d_15_19,0) + COALESCE(pop_renda_d_20_24,0) + COALESCE(pop_renda_d_25_34,0) + COALESCE(pop_renda_d_35_44,0) + COALESCE(pop_renda_d_45_49,0) + COALESCE(pop_renda_d_50_59,0) + COALESCE(pop_renda_d_60_mais,0) + COALESCE(pop_renda_e_ate_4,0) + COALESCE(pop_renda_e_5_14,0) + COALESCE(pop_renda_e_15_19,0) + COALESCE(pop_renda_e_20_24,0) + COALESCE(pop_renda_e_25_34,0) + COALESCE(pop_renda_e_35_44,0) + COALESCE(pop_renda_e_45_49,0) + COALESCE(pop_renda_e_50_59,0) + COALESCE(pop_renda_e_60_mais,0)) <= populacao),
  CONSTRAINT densidade_cep5_pop_renda_a_pp_total_cap CHECK (pop_renda_a_pp_total IS NULL OR (COALESCE(pop_renda_a_pp_ate_4,0) + COALESCE(pop_renda_a_pp_5_14,0) + COALESCE(pop_renda_a_pp_15_19,0) + COALESCE(pop_renda_a_pp_20_24,0) + COALESCE(pop_renda_a_pp_25_34,0) + COALESCE(pop_renda_a_pp_35_44,0) + COALESCE(pop_renda_a_pp_45_49,0) + COALESCE(pop_renda_a_pp_50_59,0) + COALESCE(pop_renda_a_pp_60_mais,0)) <= pop_renda_a_pp_total),
  CONSTRAINT densidade_cep5_pop_renda_a_p_total_cap CHECK (pop_renda_a_p_total IS NULL OR (COALESCE(pop_renda_a_p_ate_4,0) + COALESCE(pop_renda_a_p_5_14,0) + COALESCE(pop_renda_a_p_15_19,0) + COALESCE(pop_renda_a_p_20_24,0) + COALESCE(pop_renda_a_p_25_34,0) + COALESCE(pop_renda_a_p_35_44,0) + COALESCE(pop_renda_a_p_45_49,0) + COALESCE(pop_renda_a_p_50_59,0) + COALESCE(pop_renda_a_p_60_mais,0)) <= pop_renda_a_p_total),
  CONSTRAINT densidade_cep5_pop_renda_b1_total_cap CHECK (pop_renda_b1_total IS NULL OR (COALESCE(pop_renda_b1_ate_4,0) + COALESCE(pop_renda_b1_5_14,0) + COALESCE(pop_renda_b1_15_19,0) + COALESCE(pop_renda_b1_20_24,0) + COALESCE(pop_renda_b1_25_34,0) + COALESCE(pop_renda_b1_35_44,0) + COALESCE(pop_renda_b1_45_49,0) + COALESCE(pop_renda_b1_50_59,0) + COALESCE(pop_renda_b1_60_mais,0)) <= pop_renda_b1_total),
  CONSTRAINT densidade_cep5_pop_renda_b2_total_cap CHECK (pop_renda_b2_total IS NULL OR (COALESCE(pop_renda_b2_ate_4,0) + COALESCE(pop_renda_b2_5_14,0) + COALESCE(pop_renda_b2_15_19,0) + COALESCE(pop_renda_b2_20_24,0) + COALESCE(pop_renda_b2_25_34,0) + COALESCE(pop_renda_b2_35_44,0) + COALESCE(pop_renda_b2_45_49,0) + COALESCE(pop_renda_b2_50_59,0) + COALESCE(pop_renda_b2_60_mais,0)) <= pop_renda_b2_total),
  CONSTRAINT densidade_cep5_pop_renda_c1_total_cap CHECK (pop_renda_c1_total IS NULL OR (COALESCE(pop_renda_c1_ate_4,0) + COALESCE(pop_renda_c1_5_14,0) + COALESCE(pop_renda_c1_15_19,0) + COALESCE(pop_renda_c1_20_24,0) + COALESCE(pop_renda_c1_25_34,0) + COALESCE(pop_renda_c1_35_44,0) + COALESCE(pop_renda_c1_45_49,0) + COALESCE(pop_renda_c1_50_59,0) + COALESCE(pop_renda_c1_60_mais,0)) <= pop_renda_c1_total),
  CONSTRAINT densidade_cep5_pop_renda_c2_total_cap CHECK (pop_renda_c2_total IS NULL OR (COALESCE(pop_renda_c2_ate_4,0) + COALESCE(pop_renda_c2_5_14,0) + COALESCE(pop_renda_c2_15_19,0) + COALESCE(pop_renda_c2_20_24,0) + COALESCE(pop_renda_c2_25_34,0) + COALESCE(pop_renda_c2_35_44,0) + COALESCE(pop_renda_c2_45_49,0) + COALESCE(pop_renda_c2_50_59,0) + COALESCE(pop_renda_c2_60_mais,0)) <= pop_renda_c2_total),
  CONSTRAINT densidade_cep5_pop_renda_d_total_cap CHECK (pop_renda_d_total IS NULL OR (COALESCE(pop_renda_d_ate_4,0) + COALESCE(pop_renda_d_5_14,0) + COALESCE(pop_renda_d_15_19,0) + COALESCE(pop_renda_d_20_24,0) + COALESCE(pop_renda_d_25_34,0) + COALESCE(pop_renda_d_35_44,0) + COALESCE(pop_renda_d_45_49,0) + COALESCE(pop_renda_d_50_59,0) + COALESCE(pop_renda_d_60_mais,0)) <= pop_renda_d_total),
  CONSTRAINT densidade_cep5_pop_renda_e_total_cap CHECK (pop_renda_e_total IS NULL OR (COALESCE(pop_renda_e_ate_4,0) + COALESCE(pop_renda_e_5_14,0) + COALESCE(pop_renda_e_15_19,0) + COALESCE(pop_renda_e_20_24,0) + COALESCE(pop_renda_e_25_34,0) + COALESCE(pop_renda_e_35_44,0) + COALESCE(pop_renda_e_45_49,0) + COALESCE(pop_renda_e_50_59,0) + COALESCE(pop_renda_e_60_mais,0)) <= pop_renda_e_total)
);

CREATE INDEX IF NOT EXISTS densidade_demografica_cep5_cep5_idx ON public.densidade_demografica_cep5 (cep5);
CREATE INDEX IF NOT EXISTS densidade_demografica_cep5_municipio_idx ON public.densidade_demografica_cep5 (municipio);

CREATE INDEX IF NOT EXISTS densidade_demografica_cep5_mun_cep_idx
  ON public.densidade_demografica_cep5 (municipio, cep5);

COMMENT ON TABLE public.densidade_demografica_cep5 IS
  'Densidade demografica por territorio (municipio x cep5). Chave logica composta (municipio, cep5). Fonte V2 2026-09-08. Nao usar cep5 isolado: 9 cep5 sao compartilhados entre municipios.';

-- Seguranca V2: nenhum acesso via PostgREST
ALTER TABLE public.densidade_demografica_cep5 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.densidade_demografica_cep5 FROM PUBLIC;
REVOKE ALL ON public.densidade_demografica_cep5 FROM anon;
REVOKE ALL ON public.densidade_demografica_cep5 FROM authenticated;
GRANT ALL ON public.densidade_demografica_cep5 TO service_role;

-- Concessao temporaria ao papel de carga (revogada na 0013)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.densidade_demografica_cep5 TO sandbox_exec;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sandbox_exec;
