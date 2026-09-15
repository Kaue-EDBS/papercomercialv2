-- Synthetic fixture: disposable CI databases only.
insert into public.etl_cargas(carga_id,dataset,fonte_sistema,status) values('20000000-0000-4000-8000-000000000001','ci_geo','CI','concluida');
insert into public.dim_municipio(cod_municipal,municipio,cod_uf,nome_uf,cod_regiao_intermediaria,regiao_intermediaria,cod_regiao_imediata,regiao_imediata,cod_municipio_dtb,ano_dtb,data_base_dtb,carga_id)
select code,nm,'35','Sao Paulo','3501','CI','350001','CI',right(code,5),2025,'2025-12-31','20000000-0000-4000-8000-000000000001'::uuid from
(values('3550308','Sao Paulo'),('3509502','Campinas'))x(code,nm);
insert into public.dim_distrito(cod_distrito,cod_municipal,distrito_dtb,distrito,ano_dtb,data_base_dtb,carga_id) values('355030805','3550308','05','CI',2025,'2025-12-31','20000000-0000-4000-8000-000000000001');
insert into public.dim_subdistrito(cod_subdistrito,cod_distrito,cod_municipal,subdistrito_dtb,subdistrito,ano_dtb,data_base_dtb,carga_id) values('35503080501','355030805','3550308','01','CI',2025,'2025-12-31','20000000-0000-4000-8000-000000000001');
insert into public.dim_cep5(cod_municipal,cep5,municipio_origem,uf_origem,metodo_resolucao,carga_id)
select '3550308',lpad(i::text,5,'0'),'Sao Paulo','SP','EXATO','20000000-0000-4000-8000-000000000001'::uuid from generate_series(0,1004) i;
