-- CIT/Paper V2: authenticated geographic gate and durable staging.
-- Does not update any canonical dimension or enroll existing users.
begin;
create schema if not exists cit_private;
revoke all on schema cit_private from public, anon;
grant usage on schema cit_private to authenticated;
create extension if not exists pg_trgm with schema extensions;

-- # access_grants: explicit live authorization, never user_metadata.
create table cit_private.access_grants (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null check (role in ('admin','operator','reviewer','viewer')),
 active boolean not null default true,
 granted_at timestamptz not null default now(),
 reason text not null check (length(reason) >= 8)
);
-- # ingestion_batches: immutable source bytes, identity, totals and state.
create table cit_private.ingestion_batches (
 batch_id uuid primary key default gen_random_uuid(),
 actor uuid not null,
 dataset text not null check (dataset ~ '^[a-z][a-z0-9_]{1,63}$'),
 source_system text not null check (length(source_system) between 1 and 120),
 filename text not null check (length(filename) between 1 and 255),
 source_bytes bytea not null check (octet_length(source_bytes) between 1 and 8388608),
 input_rows jsonb not null check(jsonb_typeof(input_rows)='array'),
 source_sha256 text not null check (source_sha256 ~ '^[a-f0-9]{64}$'),
 expected_rows integer not null check (expected_rows between 1 and 100000),
 require_cep5 boolean not null default false,
 status text not null default 'UPLOADING' check (status in ('UPLOADING','REVIEW','READY','VALIDATED','REJECTED')),
 version integer not null default 0,
 rows_sha256 text,
 carga_id uuid unique references public.etl_cargas(carga_id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(actor, dataset, source_system, source_sha256)
);
create index ingestion_actor_idx on cit_private.ingestion_batches(actor,created_at desc);
-- # ingestion_rows: raw payload is retained; normalized payload is separate.
create table cit_private.ingestion_rows (
 batch_id uuid not null references cit_private.ingestion_batches(batch_id),
 row_index integer not null check (row_index between 1 and 100000),
 raw jsonb not null check (jsonb_typeof(raw) = 'object'),
 raw_sha256 text not null,
 normalized jsonb,
 resolution jsonb not null,
 status text not null check (status in ('VALIDO','CORRIGIDO','AGUARDANDO_REVISAO')),
 primary key(batch_id,row_index)
);
create index ingestion_status_idx on cit_private.ingestion_rows(batch_id,status,row_index);
-- # review_events: append-only trace of decisions, with original payload intact.
create table cit_private.review_events (
 event_id uuid primary key default gen_random_uuid(),
 batch_id uuid not null references cit_private.ingestion_batches(batch_id),
 row_index integer,
 actor uuid not null,
 action text not null,
 before_state jsonb,
 after_state jsonb,
 reason text not null,
 created_at timestamptz not null default now()
);
create index review_batch_idx on cit_private.review_events(batch_id,created_at);
-- # municipality_aliases: source-scoped explicit human approvals only.
create table cit_private.municipality_aliases (
 source_system text not null,
 cod_uf text not null check(cod_uf ~ '^[0-9]{2}$'),
 name_key text not null,
 cod_municipal text not null references public.dim_municipio(cod_municipal),
 approved_by uuid not null,
 reason text not null,
 approved_at timestamptz not null default now(),
 primary key(source_system,cod_uf,name_key)
);
create index municipality_alias_code_idx on cit_private.municipality_aliases(cod_municipal);
alter table cit_private.access_grants enable row level security;
alter table cit_private.ingestion_batches enable row level security;
alter table cit_private.ingestion_rows enable row level security;
alter table cit_private.review_events enable row level security;
alter table cit_private.municipality_aliases enable row level security;
revoke all on all tables in schema cit_private from public,anon,authenticated;

-- Parse once on the server: chunk payloads must equal the preserved source.
create function cit_private.parse_source(filename text, bytes bytea) returns jsonb
language plpgsql immutable set search_path=pg_catalog as $$
declare t text:=convert_from(bytes,'UTF8'); answer jsonb:='[]'; fields text[]:='{}'; headers text[];
 cell text:=''; ch text; quoted boolean:=false; closed_quote boolean:=false; i integer:=1; j integer;
 delimiter text:=','; commas integer:=0; semicolons integer:=0; tabs integer:=0; item jsonb; row_no integer:=0;
begin
 if left(t,1)=chr(65279) then t:=substr(t,2); end if;
 if lower(filename) like '%.json' then
  answer:=t::jsonb;
  if jsonb_typeof(answer)<>'array' or exists(select 1 from jsonb_array_elements(answer) v where jsonb_typeof(v)<>'object') then raise exception 'JSON_ARRAY_OF_OBJECTS_REQUIRED'; end if;
  return answer;
 end if;
 if lower(filename) not like '%.csv' and lower(filename) not like '%.tsv' then raise exception 'USE_UTF8_CSV_OR_JSON'; end if;
 -- Count candidate delimiters on the first record, outside quotes.
 while i<=length(t) loop
  ch:=substr(t,i,1);
  if ch='"' then quoted:=not quoted;
  elsif not quoted then
   if ch in (chr(10),chr(13)) then exit; end if;
   if ch=',' then commas:=commas+1; elsif ch=';' then semicolons:=semicolons+1; elsif ch=chr(9) then tabs:=tabs+1; end if;
  end if;
  i:=i+1;
 end loop;
 if tabs>commas and tabs>semicolons then delimiter:=chr(9); elsif semicolons>commas then delimiter:=';'; end if;
 i:=1; quoted:=false; t:=t||chr(10);
 while i<=length(t) loop
  ch:=substr(t,i,1);
  if quoted then
   if ch='"' then
    if substr(t,i+1,1)='"' then cell:=cell||'"'; i:=i+1; else quoted:=false; closed_quote:=true; end if;
   else cell:=cell||ch; end if;
  elsif ch='"' then
   if cell<>'' or closed_quote then raise exception 'INVALID_CSV_QUOTE'; end if;
   quoted:=true;
  elsif ch=delimiter or ch in (chr(10),chr(13)) then
   fields:=array_append(fields,cell); cell:=''; closed_quote:=false;
   if ch<>delimiter then
    if ch=chr(13) and substr(t,i+1,1)=chr(10) then i:=i+1; end if;
    if not (cardinality(fields)=1 and fields[1]='') then
     if headers is null then
      select array_agg(btrim(v) order by ord) into headers from unnest(fields) with ordinality x(v,ord);
      if exists(select 1 from unnest(headers) h group by h having h='' or count(*)>1) then raise exception 'DUPLICATE_OR_EMPTY_HEADER'; end if;
     else
      if cardinality(headers)<>cardinality(fields) then raise exception 'CSV_COLUMN_COUNT_MISMATCH'; end if;
      item:='{}'; for j in 1..cardinality(headers) loop item:=item||jsonb_build_object(headers[j],fields[j]); end loop;
      answer:=answer||jsonb_build_array(item); row_no:=row_no+1;
      if row_no>100000 then raise exception 'SOURCE_ROW_LIMIT'; end if;
     end if;
    end if;
    fields:='{}';
   end if;
  else
   if closed_quote then raise exception 'INVALID_CSV_AFTER_QUOTE'; end if;
   cell:=cell||ch;
  end if;
  i:=i+1;
 end loop;
 if quoted then raise exception 'UNCLOSED_CSV_QUOTE'; end if;
 return answer;
end $$;

create function cit_private.norm(p text) returns text language sql immutable strict
set search_path = pg_catalog as $$
 select btrim(regexp_replace(translate(upper(p),
 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ', 'AAAAAEEEEIIIIOOOOOUUUUCN'), '[^A-Z0-9]+', ' ', 'g'))
$$;
create function cit_private.uf_sigla(p text) returns text language sql immutable
set search_path = pg_catalog as $$
 select (array['RO','AC','AM','RR','PA','AP','TO','MA','PI','CE','RN','PB','PE','AL','SE','BA','MG','ES','RJ','SP','PR','SC','RS','MS','MT','GO','DF'])[array_position(array['11','12','13','14','15','16','17','21','22','23','24','25','26','27','28','29','31','32','33','35','41','42','43','50','51','52','53'],p)]
$$;
create function cit_private.pick(p jsonb, names text[]) returns jsonb language sql immutable
set search_path = pg_catalog as $$
 select jsonb_build_object('value',min(nullif(btrim(v),'')), 'keys',coalesce(jsonb_agg(k order by k),'[]'::jsonb),
 'ambiguous',count(distinct nullif(btrim(v),'')) > 1)
 from jsonb_each_text(p) t(k,v) where cit_private.norm(k)=any(names)
$$;
create function cit_private.canonical(p jsonb, code text, cp text) returns jsonb language sql stable
set search_path = pg_catalog as $$
 select (p - array(select k from jsonb_object_keys(p) k where cit_private.norm(k)=any(array[
 'COD MUNICIPAL','COD MUNICIPIO','CODIGO MUNICIPAL','CODIGO MUNICIPIO','CODIGO MUNICIPIO COMPLETO','COD IBGE','CO MUNICIPIO',
 'MUNICIPIO','NOME MUNICIPIO','NOME DO MUNICIPIO','CIDADE','UF','ESTADO','COD UF','NOME UF','CEP5','CEP 5','CEP'])))
 || jsonb_build_object('COD_MUNICIPAL',m.cod_municipal,'MUNICIPIO',m.municipio,'UF',cit_private.uf_sigla(m.cod_uf))
 || case when cp is null then '{}'::jsonb else jsonb_build_object('CEP5',cp) end
 from public.dim_municipio m where m.cod_municipal=code
$$;
create function cit_private.resolve_row(p jsonb, src text, cep_required boolean) returns jsonb
language plpgsql stable set search_path=pg_catalog as $$
declare c jsonb; n jsonb; u jsonb; z jsonb; code text; nm text; uf text; cp text; method text; reason text;
 m public.dim_municipio%rowtype; named public.dim_municipio%rowtype; candidates jsonb := '[]'; resolved text;
begin
 if jsonb_typeof(p)<>'object' or octet_length(p::text)>65536 then raise exception 'INVALID_ROW_SIZE_OR_TYPE'; end if;
 c:=cit_private.pick(p,array['COD MUNICIPAL','COD MUNICIPIO','CODIGO MUNICIPAL','CODIGO MUNICIPIO','CODIGO MUNICIPIO COMPLETO','COD IBGE','CO MUNICIPIO']);
 n:=cit_private.pick(p,array['MUNICIPIO','NOME MUNICIPIO','NOME DO MUNICIPIO','CIDADE']);
 u:=cit_private.pick(p,array['UF','ESTADO','COD UF','NOME UF']);
 z:=cit_private.pick(p,array['CEP5','CEP 5','CEP']);
 code:=regexp_replace(c->>'value','^([0-9]{7})[.]0+$','\1'); nm:=cit_private.norm(n->>'value'); cp:=z->>'value';
 select x.cod_uf into uf from public.dim_municipio x
 where x.cod_uf=u->>'value' or cit_private.uf_sigla(x.cod_uf)=upper(u->>'value') or cit_private.norm(x.nome_uf)=cit_private.norm(u->>'value') limit 1;
 if (c->>'ambiguous')::boolean or (n->>'ambiguous')::boolean or (u->>'ambiguous')::boolean or (z->>'ambiguous')::boolean then
  reason:='AMBIGUIDADE_DE_COLUNA';
 else
  select * into m from public.dim_municipio where cod_municipal=code and ativo;
  if m.cod_municipal is not null then
   if ((u->>'value') is not null and uf is distinct from m.cod_uf) or
      (nm is not null and nm<>cit_private.norm(m.municipio) and not exists(select 1 from cit_private.municipality_aliases a where a.source_system=src and a.cod_uf=m.cod_uf and a.name_key=nm and a.cod_municipal=m.cod_municipal)) then
     reason:='CONFLITO_CODIGO_NOME_UF';
   else resolved:=m.cod_municipal; method:='CODIGO_EXATO'; end if;
  elsif uf is not null and nm is not null then
   if (select count(*) from public.dim_municipio where cod_uf=uf and cit_private.norm(municipio)=nm and ativo)=1 then
    select * into named from public.dim_municipio where cod_uf=uf and cit_private.norm(municipio)=nm and ativo;
    resolved:=named.cod_municipal; method:='NOME_UF_EXATO';
   else
    select a.cod_municipal into resolved from cit_private.municipality_aliases a join public.dim_municipio x using(cod_municipal)
      where a.source_system=src and a.cod_uf=uf and a.name_key=nm and x.cod_uf=uf and x.ativo;
    if resolved is not null then method:='ALIAS_HOMOLOGADO'; else reason:='MUNICIPIO_NAO_RESOLVIDO'; end if;
   end if;
  else reason:='CODIGO_INVALIDO_SEM_NOME_UF'; end if;
 end if;
 -- Only an explicit full CEP header permits deriving the 5-digit prefix.
 if cp is not null and jsonb_array_length(z->'keys')=1 and cit_private.norm(z->'keys'->>0)='CEP' and cp ~ '^[0-9]{5}-?[0-9]{3}$' then cp:=left(cp,5); end if;
 if reason is null then
  if cep_required and cp is null then reason:='CEP5_OBRIGATORIO';
  elsif cp is not null and cp !~ '^[0-9]{5}$' then reason:='CEP5_FORMATO_INVALIDO';
  elsif cp is not null and not exists(select 1 from public.dim_cep5 where cod_municipal=resolved and cep5=cp and ativo) then reason:='CEP5_NAO_PERTENCE_AO_MUNICIPIO'; end if;
 end if;
 if reason is not null then
  if uf is not null and nm is not null then
   select coalesce(jsonb_agg(to_jsonb(x)),'[]') into candidates from
    (select cod_municipal,municipio,cod_uf,extensions.similarity(cit_private.norm(municipio),nm) score from public.dim_municipio
     where cod_uf=uf and ativo and extensions.similarity(cit_private.norm(municipio),nm)>=0.25 order by score desc,cod_municipal limit 5) x;
  end if;
  return jsonb_build_object('status','AGUARDANDO_REVISAO','reason',reason,'candidates',candidates,'cod_uf',uf,'name_key',nm,'normalized',null);
 end if;
 return jsonb_build_object('status',case when method='CODIGO_EXATO' then 'VALIDO' else 'CORRIGIDO' end,'method',method,'reason',null,
 'cod_uf',(select cod_uf from public.dim_municipio where cod_municipal=resolved),'candidates','[]'::jsonb,'normalized',cit_private.canonical(p,resolved,cp));
end $$;

-- The privileged implementation is private and authenticates every request.
-- Public entrypoint below is SECURITY INVOKER, with no anonymous EXECUTE.
create function cit_private.ingest_api(action text, p jsonb) returns jsonb
language plpgsql security definer set search_path=pg_catalog as $$
declare uid uuid:=auth.uid(); role_name text; b cit_private.ingestion_batches%rowtype; r cit_private.ingestion_rows%rowtype;
 id uuid; content bytea; source_rows jsonb; hash text; item jsonb; res jsonb; idx integer; count_rows integer; pending integer; off integer;
 code text; cp text; note text; old_alias text; m public.dim_municipio%rowtype; ev jsonb; version_wanted integer;
begin
 if uid is null or not exists(select 1 from auth.users where id=uid and deleted_at is null and not coalesce(is_anonymous,false) and (banned_until is null or banned_until<now())) then raise sqlstate '42501' using message='AUTH_REQUIRED'; end if;
 if not exists(select 1 from auth.sessions where user_id=uid and id::text=auth.jwt()->>'session_id') then raise sqlstate '42501' using message='SESSION_REVOKED'; end if;
 select role into role_name from cit_private.access_grants where user_id=uid and active;
 if action='session' then return jsonb_build_object('role',role_name,'authorized',role_name is not null); end if;
 if role_name is null then raise sqlstate '42501' using message='ACCESS_NOT_APPROVED'; end if;
 if jsonb_typeof(p)<>'object' then raise exception 'PAYLOAD_OBJECT_REQUIRED'; end if;
 if action='lookup' then
  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into res from
   (select cod_municipal,municipio,cod_uf from public.dim_municipio where ativo
    and (nullif(p->>'cod_uf','') is null or cod_uf=p->>'cod_uf')
    and (cod_municipal= p->>'query' or strpos(cit_private.norm(municipio),cit_private.norm(p->>'query'))>0)
    order by municipio,cod_municipal limit 30) x;
  return res;
 elsif action='list' then
  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into res from
   (select batch_id,dataset,filename,expected_rows,status,version,created_at from cit_private.ingestion_batches
    where actor=uid or role_name in ('admin','reviewer') order by created_at desc limit 50) x;
  return res;
 elsif action='start' then
  if role_name not in ('admin','operator') then raise sqlstate '42501' using message='IMPORT_FORBIDDEN'; end if;
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
 if b.batch_id is null or not (b.actor=uid or role_name in ('admin','reviewer')) then raise sqlstate '42501' using message='BATCH_NOT_ACCESSIBLE'; end if;
 if action='inspect' then
  off:=greatest(coalesce((p->>'offset')::integer,0),0);
  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into res from
   (select row_index,raw,normalized,status,resolution from cit_private.ingestion_rows where batch_id=id order by row_index offset off limit 100) x;
  select count(*),count(*) filter(where status='AGUARDANDO_REVISAO') into count_rows,pending from cit_private.ingestion_rows where batch_id=id;
  return jsonb_build_object('batch_id',id,'dataset',b.dataset,'filename',b.filename,'status',b.status,'version',b.version,'expected_rows',b.expected_rows,'received_rows',count_rows,'pending',pending,'rows',res,'next_offset',case when off+100<count_rows then off+100 else null end);
 end if;
 if role_name='viewer' then raise sqlstate '42501' using message='READ_ONLY_ROLE'; end if;
 if action='append' then
  if role_name not in ('admin','operator') or b.status not in ('UPLOADING','REVIEW','READY') then raise exception 'BATCH_NOT_WRITABLE'; end if;
  if jsonb_typeof(p->'rows')<>'array' or jsonb_array_length(p->'rows') not between 1 and 500 then raise exception 'CHUNK_REQUIRES_1_TO_500_ROWS'; end if;
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
  if role_name not in ('admin','reviewer') then raise sqlstate '42501' using message='REVIEW_FORBIDDEN'; end if;
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
  if (b.require_cep5 and cp is null) or (cp is not null and not exists(select 1 from public.dim_cep5 where cod_municipal=code and cep5=cp and ativo)) then raise exception 'CANONICAL_MUNICIPAL_CEP5_REQUIRED'; end if;
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
  if role_name not in ('admin','operator','reviewer') or b.status in ('VALIDATED','REJECTED') or length(btrim(coalesce(p->>'reason','')))<8 then raise exception 'INVALID_REJECTION'; end if;
  update cit_private.ingestion_batches set status='REJECTED',version=version+1,updated_at=now() where batch_id=id;
  insert into cit_private.review_events(batch_id,actor,action,reason) values(id,uid,'REJECT',p->>'reason');
  return jsonb_build_object('batch_id',id,'status','REJECTED');
 elsif action='finalize' then
  if role_name not in ('admin','operator') then raise sqlstate '42501' using message='FINALIZE_FORBIDDEN'; end if;
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
revoke all on all functions in schema cit_private from public,anon,authenticated;
grant execute on function cit_private.ingest_api(text,jsonb) to authenticated;
create function public.cit_ingest(action text, payload jsonb default '{}'::jsonb) returns jsonb
language sql security invoker set search_path=pg_catalog as $$ select cit_private.ingest_api(action,payload) $$;
revoke all on function public.cit_ingest(text,jsonb) from public,anon;
grant execute on function public.cit_ingest(text,jsonb) to authenticated;
comment on function public.cit_ingest(text,jsonb) is 'Authenticated geographic gate. Live ACL/session checks; stages and seals data, never writes canonical or thematic dimensions.';
commit;
