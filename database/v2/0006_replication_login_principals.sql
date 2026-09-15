-- CIT/Paper V2: dormant login principals for server-side replication.
-- Passwords and LOGIN activation are operational secrets and MUST NOT be committed.
begin;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'cit_replication_source_login') then
    create role cit_replication_source_login
      nologin inherit nosuperuser nocreatedb nocreaterole noreplication nobypassrls
      connection limit 2;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'cit_replication_target_login') then
    create role cit_replication_target_login
      nologin inherit nosuperuser nocreatedb nocreaterole noreplication nobypassrls
      connection limit 2;
  end if;

  if exists (
    select 1 from pg_roles
    where rolname in ('cit_replication_source_login','cit_replication_target_login')
      and (rolsuper or rolcreatedb or rolcreaterole or rolreplication or rolbypassrls)
  ) then
    raise exception 'UNSAFE_REPLICATION_LOGIN_PRINCIPAL';
  end if;
end $$;

grant cit_replication_source to cit_replication_source_login;
grant cit_replication_target to cit_replication_target_login;

alter role cit_replication_source_login set statement_timeout = '120s';
alter role cit_replication_source_login set lock_timeout = '10s';
alter role cit_replication_source_login set idle_in_transaction_session_timeout = '60s';
alter role cit_replication_target_login set statement_timeout = '120s';
alter role cit_replication_target_login set lock_timeout = '10s';
alter role cit_replication_target_login set idle_in_transaction_session_timeout = '60s';

comment on role cit_replication_source_login is 'CIT/Paper server-side origin credential. Activate LOGIN/password only on PRIMARY; never expose to browser.';
comment on role cit_replication_target_login is 'CIT/Paper server-side destination credential. Activate LOGIN/password only on REPLICA; never expose to browser.';

commit;
