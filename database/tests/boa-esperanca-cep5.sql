begin;

create function pg_temp.check_ok(ok boolean,label text) returns void language plpgsql as $$
begin
  if ok is distinct from true then raise exception 'FAIL: %',label; end if;
  raise notice 'PASS: %',label;
end $$;

insert into public.etl_cargas(carga_id,dataset,fonte_sistema,status)
values('20000000-0000-4000-8000-000000000007','ci_boa_esperanca','CI','concluida');

insert into public.dim_municipio(
  cod_municipal,municipio,cod_uf,nome_uf,
  cod_regiao_intermediaria,regiao_intermediaria,
  cod_regiao_imediata,regiao_imediata,
  cod_municipio_dtb,ano_dtb,data_base_dtb,carga_id
) values
('5101837','Boa Esperanca do Norte','51','Mato Grosso','0000','CI','000000','CI','01837',2025,'2025-12-31','20000000-0000-4000-8000-000000000007'),
('5103403','Cuiaba','51','Mato Grosso','0000','CI','000000','CI','03403',2025,'2025-12-31','20000000-0000-4000-8000-000000000007');

insert into public.dim_cep5(cod_municipal,cep5,municipio_origem,uf_origem,metodo_resolucao,carga_id)
values('5103403','78000','Cuiaba','MT','EXATO','20000000-0000-4000-8000-000000000007');

select pg_temp.check_ok(
  cit_private.cep5_scope('5101837')->>'mode'='MUNICIPIO_INTEIRO',
  'Boa Esperanca uses whole municipality scope'
);

select pg_temp.check_ok(
  cit_private.cep5_scope('5101837')->>'label'='Município inteiro — sem recorte CEP5 na fonte aprovada',
  'Boa Esperanca exposes the approved UI label'
);

select pg_temp.check_ok(
  cit_private.resolve_row('{"COD_MUNICIPAL":"5101837"}'::jsonb,'CI',true)->>'status'='VALIDO'
  and cit_private.resolve_row('{"COD_MUNICIPAL":"5101837"}'::jsonb,'CI',true)->>'cep5_scope'='MUNICIPIO_INTEIRO',
  'required CEP5 does not block Boa Esperanca'
);

select pg_temp.check_ok(
  not (cit_private.resolve_row('{"COD_MUNICIPAL":"5101837","CEP5":"99999"}'::jsonb,'CI',true)->'normalized' ? 'CEP5')
  and cit_private.resolve_row('{"COD_MUNICIPAL":"5101837","CEP5":"99999"}'::jsonb,'CI',true)->>'cep5_scope'='MUNICIPIO_INTEIRO',
  'incoming CEP5 is not normalized as a territorial filter for Boa Esperanca'
);

select pg_temp.check_ok(
  cit_private.resolve_row('{"COD_MUNICIPAL":"5103403"}'::jsonb,'CI',true)->>'reason'='CEP5_OBRIGATORIO',
  'other municipalities still require CEP5 when requested'
);

select pg_temp.check_ok(
  cit_private.resolve_row('{"COD_MUNICIPAL":"5103403","CEP5":"78000"}'::jsonb,'CI',true)->>'cep5_scope'='CEP5',
  'ordinary municipality keeps CEP5 scope'
);

rollback;
