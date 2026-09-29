#!/usr/bin/env bash
set -euo pipefail
: "${CIT_TEST_DB_URL:?Only a disposable localhost cit_ci database is accepted}"
case "$CIT_TEST_DB_URL" in
 postgresql://*@localhost:*/cit_ci|postgresql://*@127.0.0.1:*/cit_ci) ;;
 *) echo 'Refusing non-local/non-CI database' >&2; exit 2 ;;
esac
psql "$CIT_TEST_DB_URL" -X -v ON_ERROR_STOP=1 -f database/tests/bootstrap.sql
# Same order as the PRIMARY: V2 0001-0007, the Lovable auth migrations of 29/09/2026, then 0008 and 0009.
for file in database/v2/0001_foundation.sql database/v2/0002_geografia_dtb_2025_cep5.sql database/v2/0003_cit_ingestion_access.sql database/v2/0004_replication_control.sql database/v2/0005_replication_roles.sql database/v2/0006_replication_login_principals.sql database/v2/0007_boa_esperanca_cep5_scope.sql supabase/migrations/20260929141947_ab038421-d603-4c76-8fc4-d6bdfbd6825e.sql supabase/migrations/20260929142006_0f278b1d-84ab-4b14-bf48-94476cf74b14.sql database/v2/0008_edbs_access_profiles.sql database/v2/0009_disable_replication_logins.sql; do
 psql "$CIT_TEST_DB_URL" -X -v ON_ERROR_STOP=1 -f "$file"
done
psql "$CIT_TEST_DB_URL" -X -v ON_ERROR_STOP=1 -f database/tests/ingestion.sql
psql "$CIT_TEST_DB_URL" -X -v ON_ERROR_STOP=1 -f database/tests/boa-esperanca-cep5.sql
result="$(psql "$CIT_TEST_DB_URL" -X -Atqc "select count(*) from pg_roles where rolname in ('cit_replication_source_login','cit_replication_target_login') and not rolcanlogin and not rolsuper and not rolbypassrls")"
test "$result" = "2" || { echo "Replication login principals failed closed: expected 2 safe NOLOGIN roles, got $result" >&2; exit 1; }
