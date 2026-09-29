-- CIT/Paper V2 - verificacao de snapshot, sem alterar dados.
-- Nao e migration. Executar no PRIMARY (a REPLICA foi descontinuada em 29/09/2026).
-- Protocolo: sha256-json-array-lines-v1.
-- Array JSON por linha; colunas na ordem abaixo; PK ordenada; LF entre
-- linhas, sem LF final; UTF-8; SHA-256. Exclui carga_id e atualizado_em.
-- As tabelas tecnicas e os usuarios NAO fazem parte do checksum de negocio.

begin transaction isolation level repeatable read read only;

select current_timestamp as observado_em;

with fingerprints as (
  select 'dim_municipio' as tabela, count(*) as linhas,
    encode(extensions.digest(convert_to(coalesce(string_agg(
      jsonb_build_array(cod_municipal,municipio,cod_uf,nome_uf,
        cod_regiao_intermediaria,regiao_intermediaria,
        cod_regiao_imediata,regiao_imediata,cod_municipio_dtb,
        ano_dtb,data_base_dtb,ativo)::text,
      E'\n' order by cod_municipal collate "C"),''),'UTF8'),'sha256'),'hex') as sha256
  from public.dim_municipio
  union all
  select 'dim_distrito', count(*),
    encode(extensions.digest(convert_to(coalesce(string_agg(
      jsonb_build_array(cod_distrito,cod_municipal,distrito_dtb,
        distrito,ano_dtb,data_base_dtb,ativo)::text,
      E'\n' order by cod_distrito collate "C"),''),'UTF8'),'sha256'),'hex')
  from public.dim_distrito
  union all
  select 'dim_subdistrito', count(*),
    encode(extensions.digest(convert_to(coalesce(string_agg(
      jsonb_build_array(cod_subdistrito,cod_distrito,cod_municipal,
        subdistrito_dtb,subdistrito,ano_dtb,data_base_dtb,ativo)::text,
      E'\n' order by cod_subdistrito collate "C"),''),'UTF8'),'sha256'),'hex')
  from public.dim_subdistrito
  union all
  select 'dim_cep5', count(*),
    encode(extensions.digest(convert_to(coalesce(string_agg(
      jsonb_build_array(cod_municipal,cep5,municipio_origem,uf_origem,
        metodo_resolucao,ativo)::text,
      E'\n' order by cod_municipal collate "C",cep5 collate "C"),''),'UTF8'),'sha256'),'hex')
  from public.dim_cep5
)
select * from fingerprints order by tabela;

select
  (select count(distinct cod_uf) from public.dim_municipio) as ufs,
  (select count(distinct cod_regiao_intermediaria) from public.dim_municipio) as regioes_intermediarias,
  (select count(distinct cod_regiao_imediata) from public.dim_municipio) as regioes_imediatas,
  (select count(distinct cep5) from public.dim_cep5) as cep5_distintos,
  (select count(distinct cod_municipal) from public.dim_cep5) as municipios_com_cep5,
  (select count(*) from public.dim_cep5 where cep5 like '0%') as cep5_zero_esquerda,
  (select count(distinct cep5) from public.dim_cep5 where cep5 like '0%') as cep5_zero_esquerda_distintos,
  (select count(*) from public.dim_cep5 where metodo_resolucao='ALIAS_HOMOLOGADO') as aliases,
  (select count(*) from (select cep5 from public.dim_cep5 group by cep5 having count(distinct cod_municipal)>1) x) as cep5_compartilhados,
  (select count(*) from public.dim_cep5 where cep5 !~ '^[0-9]{5}$') as formato_cep5_invalido,
  (select count(*) from public.dim_cep5 c left join public.dim_municipio m using(cod_municipal) where m.cod_municipal is null) as cep5_fk_orfa,
  (select count(*) from public.dim_distrito d left join public.dim_municipio m using(cod_municipal) where m.cod_municipal is null or left(d.cod_distrito,7)<>d.cod_municipal) as distrito_hierarquia_invalida,
  (select count(*) from public.dim_subdistrito s left join public.dim_distrito d using(cod_distrito) left join public.dim_municipio m on m.cod_municipal=s.cod_municipal where d.cod_distrito is null or m.cod_municipal is null or s.cod_municipal<>d.cod_municipal or left(s.cod_subdistrito,9)<>s.cod_distrito or left(s.cod_subdistrito,7)<>s.cod_municipal) as subdistrito_hierarquia_invalida;

select m.cod_municipal,m.municipio,m.cod_uf
from public.dim_municipio m
where not exists (select 1 from public.dim_cep5 c where c.cod_municipal=m.cod_municipal)
order by m.cod_municipal;

select 'etl_cargas' as tabela,count(*) as linhas from public.etl_cargas
union all select 'audit_data_quality',count(*) from public.audit_data_quality
union all select 'audit_replication_runs',count(*) from public.audit_replication_runs;

-- Privilegios efetivos: inclui privilegios herdados de PUBLIC.
select c.relname as tabela,c.relrowsecurity as rls,
  has_table_privilege('anon',c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') as anon_any,
  has_table_privilege('authenticated',c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') as authenticated_any
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r'
  and c.relname in ('etl_cargas','audit_data_quality','audit_replication_runs','dim_municipio','dim_distrito','dim_subdistrito','dim_cep5')
order by c.relname;

commit;

-- Resultados esperados deste snapshot, NAO de toda publicacao futura:
-- dim_municipio:   5571 / 44b2d93b700d03b11ddb81ca1688b2d2f599e7eeffef2d6b3ab2cb2fd57d70f3
-- dim_distrito:   10751 / 5e3bfea56b4c8b82ca6f8a92f8ecd9f82ac4bfacc7c5825a8d5fdd5284dc3679
-- dim_subdistrito:  646 / 2c9aeef8a0df9882883ae042decea8cf799d7b0e516292c30fc44b0ec83d981a
-- dim_cep5:      24905 / 346285b67463ee58bd2e27f30d46e59281cb9c6ef095c3d5e4389e5f7d884b56
-- CEP5 iniciados por zero: 4495; aliases: 3; compartilhados: 9.
-- Para arquivos maiores, rever o custo de string_agg e usar protocolo
-- de particionamento documentado. Nao trocar protocolo silenciosamente.
