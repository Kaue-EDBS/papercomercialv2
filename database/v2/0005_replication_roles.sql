-- CIT/Paper: dedicated NOLOGIN groups; no passwords and no user enrollment.
-- Requires PostgreSQL 17+ for scoped MAINTAIN permission used by source locks.
begin;
do $$ begin
 if current_setting('server_version_num')::integer < 170000 then raise exception 'POSTGRES_17_REQUIRED_FOR_MAINTAIN'; end if;
 if not exists(select 1 from pg_roles where rolname='cit_replication_source') then create role cit_replication_source nologin nosuperuser nocreatedb nocreaterole noinherit nobypassrls; end if;
 if not exists(select 1 from pg_roles where rolname='cit_replication_target') then create role cit_replication_target nologin nosuperuser nocreatedb nocreaterole noinherit nobypassrls; end if;
 if exists(select 1 from pg_roles where rolname in ('cit_replication_source','cit_replication_target') and (rolcanlogin or rolsuper or rolbypassrls)) then raise exception 'UNSAFE_REPLICATION_GROUP'; end if;
end $$;
grant usage on schema public to cit_replication_source,cit_replication_target;
grant usage on schema cit_private to cit_replication_target;
-- Source: geographic data are read-only. MAINTAIN permits explicit SHARE locks
-- without granting UPDATE/DELETE/TRUNCATE on the authoritative business tables.
grant select, maintain on public.dim_municipio,public.dim_distrito,public.dim_subdistrito,public.dim_cep5 to cit_replication_source;
grant select on public.etl_cargas,public.audit_data_quality,public.audit_replication_runs to cit_replication_source;
grant insert,update on public.audit_replication_runs to cit_replication_source;
-- Target: writes are limited to the versioned allowlist and audit/checkpoint data.
grant select,insert,update,delete on public.dim_municipio,public.dim_distrito,public.dim_subdistrito,public.dim_cep5,public.etl_cargas,public.audit_data_quality,public.audit_replication_runs to cit_replication_target;
grant select,insert,update,delete on cit_private.replication_jobs,cit_private.replication_pages,cit_private.replication_items to cit_replication_target;
do $$ declare t text; begin
 foreach t in array array['dim_municipio','dim_distrito','dim_subdistrito','dim_cep5','etl_cargas','audit_data_quality','audit_replication_runs'] loop
  execute format('create policy cit_replication_source_select on public.%I for select to cit_replication_source using (true)',t);
  execute format('create policy cit_replication_target_all on public.%I for all to cit_replication_target using (true) with check (true)',t);
 end loop;
 foreach t in array array['replication_jobs','replication_pages','replication_items'] loop
  execute format('create policy cit_replication_target_all on cit_private.%I for all to cit_replication_target using (true) with check (true)',t);
 end loop;
end $$;
create policy cit_replication_source_insert on public.audit_replication_runs for insert to cit_replication_source
 with check (origem='CIT/Paper PRIMARY');
create policy cit_replication_source_update on public.audit_replication_runs for update to cit_replication_source
 using (origem='CIT/Paper PRIMARY') with check (origem='CIT/Paper PRIMARY');
-- No LOGIN role receives these groups in this migration. Configure separate
-- restricted server logins only after an operator approves the credentials.
commit;
