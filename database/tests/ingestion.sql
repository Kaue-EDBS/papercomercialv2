begin;
create function pg_temp.check_ok(ok boolean,label text) returns void language plpgsql as $$ begin if ok is distinct from true then raise exception 'FAIL: %',label; end if; raise notice 'PASS: %',label; end $$;
-- Grants come from the auth.users trigger (0008), never from manual fixtures:
-- 1 allowlisted admin, 2 and 3 EDBS viewers (both domains), 5 EDBS but unconfirmed email.
insert into auth.users(id,email,email_confirmed_at) values
 ('00000000-0000-4000-8000-000000000001','Kaue.Pastrello@EditoraDoBrasil.com.br',now()),
 ('00000000-0000-4000-8000-000000000002','consultor.ci@editoradobrasil.com.br',now()),
 ('00000000-0000-4000-8000-000000000003','consultor.ci@editoradobrasil1.onmicrosoft.com',now()),
 ('00000000-0000-4000-8000-000000000005','nao.confirmado@editoradobrasil.com.br',null);
-- 4: legacy non-EDBS account holding an old admin grant, created bypassing the sign-up gate.
alter table auth.users disable trigger on_auth_user_created_corporate_check;
insert into auth.users(id,email,email_confirmed_at) values('00000000-0000-4000-8000-000000000004','fora@example.com',now());
alter table auth.users enable trigger on_auth_user_created_corporate_check;
insert into cit_private.access_grants(user_id,role,reason) values('00000000-0000-4000-8000-000000000004','admin','CI legacy non-EDBS grant');
insert into auth.sessions(id,user_id) select ('10000000-0000-4000-8000-00000000000'||x)::uuid,('00000000-0000-4000-8000-00000000000'||x)::uuid from generate_series(1,5)x;
select pg_temp.check_ok((select role='admin' from cit_private.access_grants where user_id='00000000-0000-4000-8000-000000000001'),'allowlisted technical email provisioned as admin, case-insensitive');
select pg_temp.check_ok((select count(*)=2 from cit_private.access_grants where role='viewer' and user_id in ('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003')),'other EDBS accounts of both domains provisioned as viewer');
select pg_temp.check_ok(not exists(select 1 from cit_private.access_grants where user_id='00000000-0000-4000-8000-000000000005'),'unconfirmed email receives no grant');
DO $$ begin
 insert into auth.users(id,email,email_confirmed_at) values('00000000-0000-4000-8000-000000000009','intruso@example.com',now());
 raise exception 'non-EDBS sign-up accepted';
exception when others then if sqlerrm not like '%dominio nao autorizado%' then raise; end if; end $$;
select pg_temp.check_ok(true,'non-EDBS sign-up rejected by trigger');
DO $$ begin
 insert into cit_private.access_grants(user_id,role,reason) values('00000000-0000-4000-8000-000000000005','operator','CI legacy role');
 raise exception 'legacy role accepted';
exception when check_violation then null; end $$;
select pg_temp.check_ok(true,'only admin and viewer roles are storable');
select pg_temp.check_ok(to_regclass('public.user_roles') is null and to_regtype('public.app_role') is null,'parallel Lovable role model removed');
select pg_temp.check_ok(not has_table_privilege('authenticated','public.profiles','UPDATE') and has_table_privilege('authenticated','public.profiles','SELECT'),'profiles readable but not writable from the browser');
select pg_temp.check_ok(not has_table_privilege('authenticated','cit_private.admin_allowlist','SELECT'),'allowlist not exposed');
insert into public.etl_cargas(carga_id,dataset,fonte_sistema,status) values('20000000-0000-4000-8000-000000000001','ci_geo','CI','concluida');
insert into public.dim_municipio(cod_municipal,municipio,cod_uf,nome_uf,cod_regiao_intermediaria,regiao_intermediaria,cod_regiao_imediata,regiao_imediata,cod_municipio_dtb,ano_dtb,data_base_dtb,carga_id)
select code,nm,uf,ufname,'0000','CI','000000','CI',right(code,5),2025,'2025-12-31','20000000-0000-4000-8000-000000000001'::uuid from
(values('3550308','Sao Paulo','35','Sao Paulo'),('3509502','Campinas','35','Sao Paulo'),('3545803','Santa Barbara d''Oeste','35','Sao Paulo'),('3106200','Belo Horizonte','31','Minas Gerais'))x(code,nm,uf,ufname);
insert into public.dim_cep5(cod_municipal,cep5,municipio_origem,uf_origem,metodo_resolucao,carga_id) values
('3550308','01001','Sao Paulo','SP','EXATO','20000000-0000-4000-8000-000000000001'),('3509502','13010','Campinas','SP','EXATO','20000000-0000-4000-8000-000000000001');
select pg_temp.check_ok(not has_function_privilege('anon','public.cit_ingest(text,jsonb)','EXECUTE'),'anonymous RPC denied');
select pg_temp.check_ok(not has_table_privilege('authenticated','cit_private.ingestion_rows','SELECT,INSERT,UPDATE,DELETE'),'staging direct access denied');
select pg_temp.check_ok(cit_private.resolve_row('{"COD_IBGE":"3550308","MUNICIPIO":"Sao Paulo","UF":"SP","value":7}'::jsonb,'CI',false)->>'status'='VALIDO','exact code name UF');
select pg_temp.check_ok(cit_private.resolve_row('{"COD_IBGE":"3500000","MUNICIPIO":"Campinas","UF":"SP"}'::jsonb,'CI',false)->'normalized'->>'COD_MUNICIPAL'='3509502','bad code corrected name UF');
select pg_temp.check_ok(cit_private.resolve_row('{"COD_MUNICIPAL":"3550308","MUNICIPIO":"Campinas","UF":"SP"}'::jsonb,'CI',false)->>'reason'='CONFLITO_CODIGO_NOME_UF','valid but contradictory code blocked');
select pg_temp.check_ok(cit_private.resolve_row('{"COD_MUNICIPAL":"3550308","COD_IBGE":"3509502"}'::jsonb,'CI',false)->>'reason'='AMBIGUIDADE_DE_COLUNA','conflicting headers blocked');
select pg_temp.check_ok(cit_private.resolve_row('{"COD_MUNICIPAL":"3550308","CEP5":"01001","x":{"nested":3}}'::jsonb,'CI',true)->'normalized'->>'CEP5'='01001','leading zero preserved');
select pg_temp.check_ok(cit_private.resolve_row('{"COD_MUNICIPAL":"3550308","CEP":"01001-000"}'::jsonb,'CI',true)->'normalized'->>'CEP5'='01001','explicit full CEP prefix');
select pg_temp.check_ok(cit_private.resolve_row('{"COD_MUNICIPAL":"3550308","CEP5":"13010"}'::jsonb,'CI',true)->>'reason'='CEP5_NAO_PERTENCE_AO_MUNICIPIO','CEP must belong to municipality');
select pg_temp.check_ok(cit_private.resolve_row('{"COD_MUNICIPAL":"3550308","CEP5":1001}'::jsonb,'CI',true)->>'reason'='CEP5_FORMATO_INVALIDO','no numeric guess or silent padding');
select pg_temp.check_ok(cit_private.resolve_row('{"COD_MUNICIPAL":"3550308"}'::jsonb,'CI',true)->>'reason'='CEP5_OBRIGATORIO','required CEP');
select pg_temp.check_ok(cit_private.resolve_row('{"MUNICIPIO":"Sta Barbara D Oeste","UF":"SP"}'::jsonb,'CI',false)->>'status'='AGUARDANDO_REVISAO','fuzzy never autocorrects');
select pg_temp.check_ok(cit_private.resolve_row('{"MUNICIPIO":"Campinas"}'::jsonb,'CI',false)->>'status'='AGUARDANDO_REVISAO','name without UF is insufficient');
select pg_temp.check_ok(cit_private.resolve_row('{"COD_MUNICIPAL":"3550308","value":7,"x":{"nested":3}}'::jsonb,'CI',false)->'normalized'->'x'='{"nested":3}'::jsonb,'unrelated payload preserved');
select pg_temp.check_ok(cit_private.parse_source('x.csv',convert_to(E'COD_MUNICIPAL;CEP5\r\n3550308;01001','UTF8'))->0->>'CEP5'='01001','server parses original CSV without coercing zeros');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","session_id":"10000000-0000-4000-8000-000000000001"}',true);
set local role authenticated;
select pg_temp.check_ok(public.cit_ingest('session')->>'role'='admin','authenticated role reaches the RPC as admin');
reset role;
DO $$
declare b uuid; result jsonb; v integer; c uuid; src text;
begin
 -- viewer: session and municipality lookup only.
 perform set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000002","session_id":"10000000-0000-4000-8000-000000000002"}',true);
 perform pg_temp.check_ok(public.cit_ingest('session')->>'role'='viewer','viewer session reports its role');
 perform pg_temp.check_ok(jsonb_array_length(public.cit_ingest('lookup','{"query":"Campinas"}'))=1,'viewer may look up municipalities');
 begin perform public.cit_ingest('list'); raise exception 'viewer listed batches'; exception when insufficient_privilege then if sqlerrm<>'ADMIN_ONLY' then raise; end if; end;
 begin perform public.cit_ingest('start','{"dataset":"ci_test","source_system":"CI","filename":"x.json","source_base64":"W10=","source_sha256":"x","expected_rows":1}'); raise exception 'viewer imported'; exception when insufficient_privilege then null; end;
 -- admin: full ingestion cycle.
 perform set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","session_id":"10000000-0000-4000-8000-000000000001"}',true);
 begin perform public.cit_ingest('start','{"dataset":"ci_test","source_system":"CI","filename":"test.csv","source_base64":"dGVzdA==","source_sha256":"bad","expected_rows":2}'); raise exception 'expected hash failure'; exception when others then if sqlerrm not like '%SOURCE_HASH_MISMATCH%' then raise; end if; end;
 src:='[{"COD_IBGE":"3550308","extra":123},{"COD_IBGE":"0000000","MUNICIPIO":"Campinas","UF":"SP","value":42},{"MUNICIPIO":"Sta Barbara D Oeste","UF":"SP","extra":"retained"}]';
 result:=public.cit_ingest('start',jsonb_build_object('dataset','ci_test','source_system','CI','filename','test.json','source_base64',encode(convert_to(src,'UTF8'),'base64'),'source_sha256',encode(extensions.digest(src,'sha256'),'hex'),'expected_rows',3));
 b:=(result->>'batch_id')::uuid;
 begin perform public.cit_ingest('append',jsonb_build_object('batch_id',b,'offset',0,'rows','[{"COD_IBGE":"3509502","extra":123}]'::jsonb)); raise exception 'forged source row accepted'; exception when others then if sqlerrm not like '%SOURCE_ROW_MISMATCH%' then raise; end if; end;
 result:=public.cit_ingest('append',jsonb_build_object('batch_id',b,'offset',0,'rows','[{"COD_IBGE":"3550308","extra":123}]'::jsonb));
 perform pg_temp.check_ok(result->>'status'='UPLOADING','incomplete upload stays blocked');
 begin perform public.cit_ingest('finalize',jsonb_build_object('batch_id',b)); raise exception 'early finalize succeeded'; exception when others then if sqlerrm not like '%INCOMPLETE_OR_UNRESOLVED%' then raise; end if; end;
 perform public.cit_ingest('append',jsonb_build_object('batch_id',b,'offset',0,'rows','[{"COD_IBGE":"3550308","extra":123}]'::jsonb));
 perform pg_temp.check_ok((select count(*)=1 from cit_private.ingestion_rows where batch_id=b),'same chunk replay is idempotent');
 begin perform public.cit_ingest('append',jsonb_build_object('batch_id',b,'offset',0,'rows','[{"COD_IBGE":"3509502"}]'::jsonb)); raise exception 'changed replay accepted'; exception when others then if sqlerrm not like '%IDEMPOTENCY_ROW_CONFLICT%' then raise; end if; end;
 result:=public.cit_ingest('append',jsonb_build_object('batch_id',b,'offset',1,'rows','[{"COD_IBGE":"0000000","MUNICIPIO":"Campinas","UF":"SP","value":42},{"MUNICIPIO":"Sta Barbara D Oeste","UF":"SP","extra":"retained"}]'::jsonb));
 perform pg_temp.check_ok(result->>'status'='REVIEW' and (result->>'pending')::int=1,'mixed dataset blocked with one review');
 v:=(result->>'version')::int;
 perform set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000002","session_id":"10000000-0000-4000-8000-000000000002"}',true);
 begin perform public.cit_ingest('review',jsonb_build_object('batch_id',b,'row_index',3,'version',v,'cod_municipal','3545803','reason','CI explicit review')); raise exception 'viewer reviewed'; exception when insufficient_privilege then null; end;
 begin perform public.cit_ingest('inspect',jsonb_build_object('batch_id',b)); raise exception 'viewer inspected staging'; exception when insufficient_privilege then null; end;
 perform set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","session_id":"10000000-0000-4000-8000-000000000001"}',true);
 begin perform public.cit_ingest('review',jsonb_build_object('batch_id',b,'row_index',3,'version',v-1,'cod_municipal','3545803','reason','CI explicit review')); raise exception 'stale version accepted'; exception when others then if sqlerrm not like '%VERSION_CONFLICT%' then raise; end if; end;
 result:=public.cit_ingest('review',jsonb_build_object('batch_id',b,'row_index',3,'version',v,'cod_municipal','3545803','reason','CI explicit review','memorize',false));
 perform pg_temp.check_ok(result->>'status'='READY','manual review resumes dataset');
 perform pg_temp.check_ok((select count(*)=0 from cit_private.municipality_aliases),'alias is opt-in');
 perform pg_temp.check_ok((select raw->>'extra'='retained' and normalized->>'extra'='retained' from cit_private.ingestion_rows where batch_id=b and row_index=3),'manual review preserves raw and extra values');
 result:=public.cit_ingest('finalize',jsonb_build_object('batch_id',b)); c:=(result->>'carga_id')::uuid;
 perform pg_temp.check_ok(result->>'status'='VALIDATED' and result->>'business_promoted'='false','finalized gate does not write business facts');
 result:=public.cit_ingest('finalize',jsonb_build_object('batch_id',b));
 perform pg_temp.check_ok(result->>'carga_id'=c::text,'finalize replay does not duplicate load');
 perform pg_temp.check_ok((select status='validada' and linhas_gravadas=0 from public.etl_cargas where carga_id=c),'load not falsely marked as business complete');
 begin perform public.cit_ingest('append',jsonb_build_object('batch_id',b,'offset',0,'rows','[{"COD_IBGE":"3550308","extra":123}]'::jsonb)); raise exception 'sealed batch mutable'; exception when others then if sqlerrm not like '%BATCH_NOT_WRITABLE%' then raise; end if; end;
 -- non-EDBS legacy grant and unconfirmed email: no role.
 perform set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000004","session_id":"10000000-0000-4000-8000-000000000004"}',true);
 perform pg_temp.check_ok(public.cit_ingest('session')->>'authorized'='false','non-EDBS account denied despite legacy admin grant');
 begin perform public.cit_ingest('list'); raise exception 'non-EDBS accessed'; exception when insufficient_privilege then null; end;
 perform set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000005","session_id":"10000000-0000-4000-8000-000000000005"}',true);
 perform pg_temp.check_ok(public.cit_ingest('session')->>'authorized'='false','unconfirmed EDBS email has no role');
 update auth.users set email_confirmed_at=now() where id='00000000-0000-4000-8000-000000000005';
 perform pg_temp.check_ok(public.cit_ingest('session')->>'role'='viewer','existing EDBS account provisioned on first session after confirmation');
 -- revoked grant is not reactivated by provisioning.
 update cit_private.access_grants set active=false where user_id='00000000-0000-4000-8000-000000000003';
 perform set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000003","session_id":"10000000-0000-4000-8000-000000000003"}',true);
 perform pg_temp.check_ok(public.cit_ingest('session')->>'authorized'='false','revoked grant stays revoked');
 perform pg_temp.check_ok((select not active from cit_private.access_grants where user_id='00000000-0000-4000-8000-000000000003'),'provisioning does not reactivate');
 delete from auth.sessions where user_id='00000000-0000-4000-8000-000000000001';
 perform set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","session_id":"10000000-0000-4000-8000-000000000001"}',true);
 begin perform public.cit_ingest('session'); raise exception 'revoked session accessed'; exception when insufficient_privilege then null; end;
 perform pg_temp.check_ok((select count(*)=4 from public.dim_municipio) and (select count(*)=2 from public.dim_cep5),'geography unchanged');
 raise notice 'PASS: two-profile authorization, source integrity, idempotency, mixed batch, review and revocation assertions';
end $$;
rollback;
