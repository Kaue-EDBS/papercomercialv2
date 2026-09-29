-- CIT/Paper V2: EDBS-only access with exactly two profiles (admin, viewer).
-- Decision: docs/requirements/fluxos-principais.md, F01 (29/09/2026).
-- Runs after the Lovable auth migrations in supabase/migrations/20260929141947_* and 20260929142006_*;
-- their objects are handled only when present, so the file also applies where they never ran.
begin;

-- # Profiles: only admin and viewer. Fails instead of silently remapping any legacy grant.
do $$ begin
 if exists(select 1 from cit_private.access_grants where role not in ('admin','viewer')) then
  raise exception 'LEGACY_ROLE_GRANTS_PRESENT: revoke or convert operator/reviewer grants before applying 0008';
 end if;
end $$;
alter table cit_private.access_grants drop constraint access_grants_role_check;
alter table cit_private.access_grants add constraint access_grants_role_check check (role in ('admin','viewer'));

-- # allowed_email_domains / admin_allowlist: versioned here, never hardcoded in the UI.
create table cit_private.allowed_email_domains (
 domain text primary key check (domain = lower(domain) and domain ~ '^[a-z0-9.-]+$'),
 reason text not null check (length(reason) >= 8)
);
insert into cit_private.allowed_email_domains(domain, reason) values
 ('editoradobrasil.com.br', 'Dominio corporativo EDBS - F01 29/09/2026'),
 ('editoradobrasil1.onmicrosoft.com', 'Dominio Microsoft EDBS - F01 29/09/2026');
create table cit_private.admin_allowlist (
 email text primary key check (email = lower(email) and email ~ '^[^@]+@[^@]+$'),
 reason text not null check (length(reason) >= 8),
 added_at timestamptz not null default now()
);
insert into cit_private.admin_allowlist(email, reason) values
 ('vinicius.moraes@editoradobrasil.com.br', 'Time tecnico - F01 29/09/2026'),
 ('ana.kretli@editoradobrasil.com.br', 'Time tecnico - F01 29/09/2026'),
 ('joao.jurado@editoradobrasil.com.br', 'Time tecnico - F01 29/09/2026'),
 ('amanda.bueno@editoradobrasil.com.br', 'Time tecnico - F01 29/09/2026'),
 ('kaue.pastrello@editoradobrasil.com.br', 'Time tecnico - F01 29/09/2026');
alter table cit_private.allowed_email_domains enable row level security;
alter table cit_private.admin_allowlist enable row level security;
revoke all on cit_private.allowed_email_domains, cit_private.admin_allowlist from public, anon, authenticated;

-- Confirmed EDBS email of a live account, or null. Reads auth.users only, never user_metadata.
create function cit_private.edbs_email(uid uuid) returns text
language sql stable security definer set search_path=pg_catalog as $$
 select lower(btrim(au.email)) from auth.users au
 where au.id = uid and au.deleted_at is null and not coalesce(au.is_anonymous, false)
   and au.email_confirmed_at is not null
   and lower(btrim(au.email)) ~ '^[^@]+@[^@]+$'
   and exists(select 1 from cit_private.allowed_email_domains d where d.domain = split_part(lower(btrim(au.email)), '@', 2))
$$;

-- Creates or syncs the grant: admin when allowlisted, otherwise viewer. Never reactivates a revoked grant.
-- Returns the active role, or null when the account is not an EDBS account or its grant is revoked.
create function cit_private.provision_grant(uid uuid) returns text
language plpgsql security definer set search_path=pg_catalog as $$
declare mail text := cit_private.edbs_email(uid); wanted text; result text;
begin
 if mail is null then return null; end if;
 wanted := case when exists(select 1 from cit_private.admin_allowlist a where a.email = mail) then 'admin' else 'viewer' end;
 insert into cit_private.access_grants(user_id, role, reason)
  values(uid, wanted, 'Provisionamento automatico F01: ' || wanted)
 on conflict(user_id) do update set role = excluded.role, reason = excluded.reason
  where cit_private.access_grants.role is distinct from excluded.role;
 select role into result from cit_private.access_grants where user_id = uid and active;
 return result;
end $$;

-- # ingest_api: admin-only ingestion; viewer keeps session and municipality lookup for geographic analysis.
-- Body otherwise identical to 0003; operator/reviewer branches removed.
create or replace function cit_private.ingest_api(action text, p jsonb) returns jsonb
language plpgsql security definer set search_path=pg_catalog as $$
declare uid uuid:=auth.uid(); role_name text; b cit_private.ingestion_batches%rowtype; r cit_private.ingestion_rows%rowtype;
 id uuid; content bytea; source_rows jsonb; hash text; item jsonb; res jsonb; idx integer; count_rows integer; pending integer; off integer;
 code text; cp text; note text; old_alias text; m public.dim_municipio%rowtype; version_wanted integer;
begin
 if uid is null or not exists(select 1 from auth.users au where au.id=uid and au.deleted_at is null and not coalesce(au.is_anonymous,false) and (au.banned_until is null or au.banned_until<now())) then raise sqlstate '42501' using message='AUTH_REQUIRED'; end if;
 if not exists(select 1 from auth.sessions ss where ss.user_id=uid and ss.id::text=auth.jwt()->>'session_id') then raise sqlstate '42501' using message='SESSION_REVOKED'; end if;
 -- Every call re-derives the role from the live email and allowlist; a non-EDBS account has no role even with an old grant.
 role_name:=cit_private.provision_grant(uid);
 if action='session' then return jsonb_build_object('role',role_name,'authorized',role_name is not null); end if;
 if role_name is null then raise sqlstate '42501' using message='ACCESS_NOT_APPROVED'; end if;
 if jsonb_typeof(p) is distinct from 'object' then raise exception 'PAYLOAD_OBJECT_REQUIRED'; end if;
 if action='lookup' then
  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into res from
   (select cod_municipal,municipio,cod_uf from public.dim_municipio where ativo
    and (nullif(p->>'cod_uf','') is null or cod_uf=p->>'cod_uf')
    and (cod_municipal= p->>'query' or strpos(cit_private.norm(municipio),cit_private.norm(p->>'query'))>0)
    order by municipio,cod_municipal limit 30) x;
  return res;
 end if;
 if role_name<>'admin' then raise sqlstate '42501' using message='ADMIN_ONLY'; end if;
 if action='list' then
  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into res from
   (select batch_id,dataset,filename,expected_rows,status,version,created_at from cit_private.ingestion_batches
    order by created_at desc limit 50) x;
  return res;
 elsif action='start' then
  if length(p->>'source_base64')>11184816 then raise exception 'SOURCE_TOO_LARGE'; end if;
  content:=decode(p->>'source_base64','base64'); hash:=encode(extensions.digest(content,'sha256'),'hex');
  if hash is distinct from p->>'source_sha256' then raise exception 'SOURCE_HASH_MISMATCH'; end if;
  source_rows:=cit_private.parse_source(p->>'filename',content);
  if jsonb_array_length(source_rows) is distinct from (p->>'expected_rows')::integer then raise exception 'SOURCE_ROW_COUNT_MISMATCH'; end if;
  insert into cit_private.ingestion_batches(actor,dataset,source_system,filename,source_bytes,input_rows,source_sha256,expected_rows,require_cep5)
   values(uid,p->>'dataset',p->>'source_system',p->>'filename',content,source_rows,hash,(p->>'expected_rows')::integer,coalesce((p->>'require_cep5')::boolean,false))
   on conflict(actor,dataset,source_system,source_sha256) do nothing returning batch_id into id;
  if id is null then
   select * into b from cit_private.ingestion_batches where actor=uid and dataset=p->>'dataset' and source_system=p->>'source_system' and source_sha256=hash;
   if b.expected_rows is distinct from (p->>'expected_rows')::integer or b.require_cep5 is distinct from coalesce((p->>'require_cep5')::boolean,false) then raise exception 'IDEMPOTENCY_METADATA_CONFLICT'; end if;
   id:=b.batch_id;
  end if;
  return jsonb_build_object('batch_id',id);
 end if;
 id:=(p->>'batch_id')::uuid;
 select * into b from cit_private.ingestion_batches where batch_id=id for update;
 if b.batch_id is null then raise sqlstate '42501' using message='BATCH_NOT_ACCESSIBLE'; end if;
 if action='inspect' then
  off:=greatest(coalesce((p->>'offset')::integer,0),0);
  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into res from
   (select row_index,raw,normalized,status,resolution from cit_private.ingestion_rows where batch_id=id order by row_index offset off limit 100) x;
  select count(*),count(*) filter(where status='AGUARDANDO_REVISAO') into count_rows,pending from cit_private.ingestion_rows where batch_id=id;
  return jsonb_build_object('batch_id',id,'dataset',b.dataset,'filename',b.filename,'status',b.status,'version',b.version,'expected_rows',b.expected_rows,'received_rows',count_rows,'pending',pending,'rows',res,'next_offset',case when off+100<count_rows then off+100 else null end);
 end if;
 if action='append' then
  if b.status not in ('UPLOADING','REVIEW','READY') then raise exception 'BATCH_NOT_WRITABLE'; end if;
  if jsonb_typeof(p->'rows') is distinct from 'array' or jsonb_array_length(p->'rows') not between 1 and 500 then raise exception 'CHUNK_REQUIRES_1_TO_500_ROWS'; end if;
  off:=(p->>'offset')::integer;
  if off is null or off<0 or off+jsonb_array_length(p->'rows')>b.expected_rows then raise exception 'CHUNK_OUT_OF_RANGE'; end if;
  for item,idx in select value,ordinality::integer+off from jsonb_array_elements(p->'rows') with ordinality loop
   hash:=encode(extensions.digest(convert_to(item::text,'UTF8'),'sha256'),'hex');
   select * into r from cit_private.ingestion_rows where batch_id=id and row_index=idx;
   if found then
    if r.raw_sha256<>hash then raise exception 'IDEMPOTENCY_ROW_CONFLICT'; end if;
    continue;
   end if;
   if item is distinct from b.input_rows->(idx-1) then raise exception 'SOURCE_ROW_MISMATCH'; end if;
   res:=cit_private.resolve_row(item,b.source_system,b.require_cep5);
   insert into cit_private.ingestion_rows values(id,idx,item,hash,res->'normalized',res,res->>'status');
  end loop;
 elsif action='review' then
  if b.status<>'REVIEW' then raise exception 'BATCH_NOT_IN_REVIEW'; end if;
  version_wanted:=(p->>'version')::integer;
  if version_wanted is distinct from b.version then raise exception 'VERSION_CONFLICT_RELOAD'; end if;
  note:=btrim(p->>'reason'); if note is null or length(note)<8 then raise exception 'REVIEW_REASON_REQUIRED'; end if;
  idx:=(p->>'row_index')::integer; code:=p->>'cod_municipal'; cp:=nullif(btrim(p->>'cep5'),'');
  select * into r from cit_private.ingestion_rows where batch_id=id and row_index=idx for update;
  if r.row_index is null or r.status<>'AGUARDANDO_REVISAO' then raise exception 'ROW_NOT_PENDING'; end if;
  select * into m from public.dim_municipio where cod_municipal=code and ativo;
  if m.cod_municipal is null then raise exception 'CANONICAL_MUNICIPALITY_REQUIRED'; end if;
  if r.resolution->>'cod_uf' is not null and m.cod_uf<>r.resolution->>'cod_uf' and not coalesce((p->>'confirm_uf_change')::boolean,false) then raise exception 'CONFIRM_UF_CHANGE_REQUIRED'; end if;
  if ((b.require_cep5 or (cit_private.pick(r.raw,array['CEP5','CEP 5','CEP'])->>'value') is not null) and cp is null) or (cp is not null and not exists(select 1 from public.dim_cep5 where cod_municipal=code and cep5=cp and ativo)) then raise exception 'CANONICAL_MUNICIPAL_CEP5_REQUIRED'; end if;
  res:=jsonb_build_object('status','CORRIGIDO','method','REVISAO_MANUAL','normalized',cit_private.canonical(r.raw,code,cp),'reason',note,'candidates','[]'::jsonb);
  if coalesce((p->>'memorize')::boolean,false) then
   if r.resolution->>'name_key' is null or r.resolution->>'cod_uf' is distinct from m.cod_uf or r.resolution->>'reason'='AMBIGUIDADE_DE_COLUNA' then raise exception 'ALIAS_SCOPE_NOT_SAFE'; end if;
   insert into cit_private.municipality_aliases(source_system,cod_uf,name_key,cod_municipal,approved_by,reason)
    values(b.source_system,m.cod_uf,r.resolution->>'name_key',code,uid,note) on conflict do nothing;
   select cod_municipal into old_alias from cit_private.municipality_aliases where source_system=b.source_system and cod_uf=m.cod_uf and name_key=r.resolution->>'name_key';
   if old_alias<>code then raise exception 'ALIAS_ALREADY_MAPS_TO_ANOTHER_MUNICIPALITY'; end if;
  end if;
  insert into cit_private.review_events(batch_id,row_index,actor,action,before_state,after_state,reason) values(id,idx,uid,'REVIEW',r.resolution,res,note);
  update cit_private.ingestion_rows set normalized=res->'normalized',resolution=res,status='CORRIGIDO' where batch_id=id and row_index=idx;
 elsif action='reject' then
  if b.status in ('VALIDATED','REJECTED') or length(btrim(coalesce(p->>'reason','')))<8 then raise exception 'INVALID_REJECTION'; end if;
  update cit_private.ingestion_batches set status='REJECTED',version=version+1,updated_at=now() where batch_id=id;
  insert into cit_private.review_events(batch_id,actor,action,reason) values(id,uid,'REJECT',p->>'reason');
  return jsonb_build_object('batch_id',id,'status','REJECTED');
 elsif action='finalize' then
  if b.status='VALIDATED' then return jsonb_build_object('batch_id',id,'status',b.status,'carga_id',b.carga_id); end if;
  select count(*),count(*) filter(where status='AGUARDANDO_REVISAO') into count_rows,pending from cit_private.ingestion_rows where batch_id=id;
  if b.status<>'READY' or count_rows<>b.expected_rows or pending<>0 then raise exception 'INCOMPLETE_OR_UNRESOLVED_DATASET'; end if;
  select encode(extensions.digest(convert_to(string_agg(normalized::text,E'\n' order by row_index),'UTF8'),'sha256'),'hex') into hash from cit_private.ingestion_rows where batch_id=id;
  insert into public.etl_cargas(dataset,fonte_sistema,arquivo_nome,arquivo_sha256,status,linhas_recebidas,linhas_validas,linhas_gravadas,observacoes)
   values(b.dataset,b.source_system,b.filename,b.source_sha256,'validada',count_rows,count_rows,0,'Geographic gate only. Staging sealed; no thematic business-table promotion. Protocol normalized-json-lines-v1; hash='||hash) returning carga_id into b.carga_id;
  insert into public.audit_data_quality(carga_id,dataset,nome_check,severidade,passou,detalhes)
   values(b.carga_id,b.dataset,'geographic_gate_v1','critical',true,jsonb_build_object('batch_id',id,'rows',count_rows,'rows_sha256',hash));
  update cit_private.ingestion_batches set status='VALIDATED',rows_sha256=hash,carga_id=b.carga_id,version=version+1,updated_at=now() where batch_id=id;
  return jsonb_build_object('batch_id',id,'status','VALIDATED','rows_sha256',hash,'carga_id',b.carga_id,'business_promoted',false);
 else raise exception 'UNSUPPORTED_ACTION'; end if;
 select count(*),count(*) filter(where status='AGUARDANDO_REVISAO') into count_rows,pending from cit_private.ingestion_rows where batch_id=id;
 update cit_private.ingestion_batches set status=case when count_rows<expected_rows then 'UPLOADING' when pending>0 then 'REVIEW' else 'READY' end,version=version+1,updated_at=now() where batch_id=id returning * into b;
 return jsonb_build_object('batch_id',id,'status',b.status,'version',b.version,'received_rows',count_rows,'pending',pending);
end $$;
revoke all on function cit_private.edbs_email(uuid), cit_private.provision_grant(uuid) from public, anon, authenticated;
revoke all on function cit_private.ingest_api(text,jsonb) from public, anon;
grant execute on function cit_private.ingest_api(text,jsonb) to authenticated;

-- # Sign-up gate on auth.users: rejects non-EDBS domains and provisions the grant at creation.
-- Replaces the Lovable function of the same name, which wrote to public.user_roles.
create or replace function public.handle_new_corporate_user() returns trigger
language plpgsql security definer set search_path=pg_catalog as $$
begin
 if lower(btrim(coalesce(new.email,''))) !~ '^[^@]+@[^@]+$' or not exists(
   select 1 from cit_private.allowed_email_domains d where d.domain = split_part(lower(btrim(new.email)), '@', 2)) then
  raise exception 'Acesso negado: dominio nao autorizado a acessar o CIT.';
 end if;
 if to_regclass('public.profiles') is not null then
  insert into public.profiles(id, email, nome)
   values(new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
 end if;
 perform cit_private.provision_grant(new.id);
 return new;
end $$;
revoke all on function public.handle_new_corporate_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created_corporate_check on auth.users;
create trigger on_auth_user_created_corporate_check
 after insert on auth.users for each row execute function public.handle_new_corporate_user();

-- # Lovable parallel role model: removed; cit_private.access_grants is the only permission source.
-- public.profiles stays as identity data only: readable by its owner, not writable from the browser.
do $$ begin
 if to_regclass('public.profiles') is not null then
  execute 'drop policy if exists "Admins leem todos os perfis" on public.profiles';
  execute 'drop policy if exists "Usuario atualiza seu proprio perfil" on public.profiles';
  execute 'revoke insert, update, delete on public.profiles from authenticated';
 end if;
end $$;
drop table if exists public.user_roles;
do $$ begin
 if to_regtype('public.app_role') is not null then
  execute 'drop function if exists public.has_role(uuid, public.app_role)';
  execute 'drop type public.app_role';
 end if;
end $$;

comment on table cit_private.admin_allowlist is 'Time tecnico (perfil admin). Alterar somente por migration versionada - F01.';
commit;
