#!/usr/bin/env bash
set -euo pipefail
: "${CIT_TEST_DB_URL:?Only a disposable localhost cit_ci database is accepted}"
case "$CIT_TEST_DB_URL" in
 postgresql://*@localhost:*/cit_ci|postgresql://*@127.0.0.1:*/cit_ci) ;;
 *) echo 'Refusing non-local/non-CI database' >&2; exit 2 ;;
esac
psql "$CIT_TEST_DB_URL" -X -v ON_ERROR_STOP=1 -f database/tests/bootstrap.sql
for file in database/v2/0001_foundation.sql database/v2/0002_geografia_dtb_2025_cep5.sql database/v2/0003_cit_ingestion_access.sql database/v2/0004_replication_control.sql; do
 psql "$CIT_TEST_DB_URL" -X -v ON_ERROR_STOP=1 -f "$file"
done
psql "$CIT_TEST_DB_URL" -X -v ON_ERROR_STOP=1 -f database/tests/ingestion.sql
