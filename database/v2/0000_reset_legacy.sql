-- Paper Comercial V2 - reset controlado da camada de negocio legada
-- Fonte oficial: GitHub / database/v2
--
-- ESCOPO: remove apenas objetos de negocio da aplicacao no schema public.
-- NAO remove schemas gerenciados pela plataforma (auth, storage, realtime,
-- extensions, vault, graphql, supabase_functions etc.).
--
-- Estado auditado antes do reset em 2026-09-15:
--   densidade_demografica_cep5 = 0 linhas
--   dim_escola                 = 0 linhas
--   dim_municipio              = 0 linhas
--   escola_protheus            = 0 linhas
--   v_escola_por_protheus      = view
--
-- O historico de migrations anterior permanece no GitHub apenas como legado e
-- NAO deve ser reaplicado na V2.

begin;

drop view if exists public.v_escola_por_protheus cascade;
drop table if exists public.densidade_demografica_cep5 cascade;
drop table if exists public.escola_protheus cascade;
drop table if exists public.dim_escola cascade;
drop table if exists public.dim_municipio cascade;

commit;
