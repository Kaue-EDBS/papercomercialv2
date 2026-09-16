-- CIT/Paper V2: exclusive CEP5 fallback for Boa Esperanca do Norte/MT.
-- Business decision: COD_MUNICIPAL 5101837 has no approved CEP5 cut.
-- Never invent or borrow CEP5; use the whole municipality when CEP5 scope is requested.
begin;

create or replace function cit_private.cep5_scope(code text) returns jsonb
language sql immutable
set search_path = pg_catalog as $$
  select case
    when code = '5101837' then jsonb_build_object(
      'mode', 'MUNICIPIO_INTEIRO',
      'label', 'Município inteiro — sem recorte CEP5 na fonte aprovada'
    )
    else jsonb_build_object(
      'mode', 'CEP5',
      'label', 'Recorte CEP5'
    )
  end
$$;

-- Internal helper only. It is consumed by the ingestion resolver and future
-- server-side CEP5 functions, not exposed as a direct browser RPC.
revoke all on function cit_private.cep5_scope(text) from public, anon, authenticated;

create or replace function cit_private.resolve_row(p jsonb, src text, cep_required boolean) returns jsonb
language plpgsql stable set search_path=pg_catalog as $$
declare c jsonb; n jsonb; u jsonb; z jsonb; code text; nm text; uf text; cp text; method text; reason text;
 m public.dim_municipio%rowtype; named public.dim_municipio%rowtype; candidates jsonb := '[]'; resolved text; scope jsonb;
begin
 if jsonb_typeof(p) is distinct from 'object' or octet_length(p::text)>65536 then raise exception 'INVALID_ROW_SIZE_OR_TYPE'; end if;
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

 if cp is not null and jsonb_array_length(z->'keys')=1 and cit_private.norm(z->'keys'->>0)='CEP' and cp ~ '^[0-9]{5}-?[0-9]{3}$' then cp:=left(cp,5); end if;

 if reason is null then
  scope:=cit_private.cep5_scope(resolved);
  if resolved='5101837' then
   -- The raw payload remains stored by ingestion_rows.raw, but CEP/CEP5 must
   -- not become a normalized territorial filter for this municipality.
   cp:=null;
  elsif cep_required and cp is null then reason:='CEP5_OBRIGATORIO';
  elsif cp is not null and cp !~ '^[0-9]{5}$' then reason:='CEP5_FORMATO_INVALIDO';
  elsif cp is not null and not exists(select 1 from public.dim_cep5 where cod_municipal=resolved and cep5=cp and ativo) then reason:='CEP5_NAO_PERTENCE_AO_MUNICIPIO'; end if;
 end if;

 if reason is not null then
  if uf is not null and nm is not null then
   select coalesce(jsonb_agg(to_jsonb(x)),'[]') into candidates from
    (select cod_municipal,municipio,cod_uf,extensions.similarity(cit_private.norm(municipio),nm) score from public.dim_municipio
     where cod_uf=uf and ativo and extensions.similarity(cit_private.norm(municipio),nm)>=0.25 order by score desc,cod_municipal limit 5) x;
  end if;
  return jsonb_build_object('status','AGUARDANDO_REVISAO','reason',reason,'candidates',candidates,'cod_uf',uf,'name_key',nm,'normalized',null,
    'cep5_scope',null,'cep5_label',null);
 end if;

 if scope is null then scope:=cit_private.cep5_scope(resolved); end if;
 return jsonb_build_object(
   'status',case when method='CODIGO_EXATO' then 'VALIDO' else 'CORRIGIDO' end,
   'method',method,
   'reason',null,
   'cod_uf',(select cod_uf from public.dim_municipio where cod_municipal=resolved),
   'candidates','[]'::jsonb,
   'normalized',cit_private.canonical(p,resolved,cp),
   'cep5_scope',scope->>'mode',
   'cep5_label',scope->>'label'
 );
end $$;

commit;
