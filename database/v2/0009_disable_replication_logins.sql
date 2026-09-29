-- CIT/Paper V2: REPLICA discontinued (decision 29/09/2026, AGENTS.md rule 6).
-- Closes the external database access used by the replication worker. Apply on the PRIMARY only.
-- Keeps the NOLOGIN groups, grants, policies and replication tables as history; removal is a separate step.
begin;

-- No password, no LOGIN, zero connections, and no group membership: re-enabling LOGIN alone
-- would not restore any access. Sessions already open end on their own (statement/idle timeouts of 0006).
do $$
declare r text;
begin
 foreach r in array array['cit_replication_source_login','cit_replication_target_login'] loop
  if exists(select 1 from pg_roles where rolname = r) then
   execute format('alter role %I nologin password null connection limit 0', r);
  end if;
 end loop;
 if exists(select 1 from pg_auth_members m join pg_roles g on g.oid = m.roleid join pg_roles u on u.oid = m.member
           where g.rolname = 'cit_replication_source' and u.rolname = 'cit_replication_source_login') then
  revoke cit_replication_source from cit_replication_source_login;
 end if;
 if exists(select 1 from pg_auth_members m join pg_roles g on g.oid = m.roleid join pg_roles u on u.oid = m.member
           where g.rolname = 'cit_replication_target' and u.rolname = 'cit_replication_target_login') then
  revoke cit_replication_target from cit_replication_target_login;
 end if;
end $$;

do $$ begin
 -- pg_roles masks rolpassword, so only LOGIN is asserted; PASSWORD NULL above removes the secret.
 if exists(select 1 from pg_roles where rolname like 'cit\_replication\_%' and rolcanlogin) then
  raise exception 'REPLICATION_LOGIN_STILL_ENABLED';
 end if;
 if exists(select 1 from pg_auth_members m join pg_roles u on u.oid = m.member where u.rolname like 'cit\_replication\_%\_login') then
  raise exception 'REPLICATION_LOGIN_STILL_IN_GROUP';
 end if;
end $$;

comment on role cit_replication_source_login is 'Desativado em 29/09/2026 pela 0009: REPLICA descontinuada. Nao reativar.';
comment on role cit_replication_target_login is 'Desativado em 29/09/2026 pela 0009: REPLICA descontinuada. Nao reativar.';
commit;
