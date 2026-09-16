#!/usr/bin/env python3
"""Verify both geographic snapshots with READ ONLY transactions; no audit writes.

Only counts, hashes and booleans leave the process. No rows, users' identities,
credentials, exception messages, schema changes or replication repairs.
"""
from __future__ import annotations

from datetime import datetime, timezone
import json
import os
import sys

from replication import BASE, ORDER, fingerprint, read_rows, validate_target

SIDES = {
    'PRIMARY': ('CIT_PRIMARY_DATABASE_URL', 'chwsmkdkgdgocnbcyvmq', 'cit_replication_source_login'),
    'REPLICA': ('CIT_REPLICA_DATABASE_URL', 'vevmnoxbjdkibdwfygfn', 'cit_replication_target_login'),
}
FUNCTION_HASHES = {
    'cep5_scope': '1850592d6b4bcd018bf3932ea794edf2',
    'resolve_row': '28f9126ca364ab2deb0fe27d79fcf0dd',
}


def inspect_side(label: str, config: tuple[str, str, str]) -> dict:
    import psycopg

    env_name, project_ref, role = config
    result = {'side': label, 'ok': False}
    try:
        dsn = os.environ[env_name]
        validate_target(dsn, project_ref)
        with psycopg.connect(dsn, connect_timeout=10, autocommit=False) as conn:
            conn.execute('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY')
            conn.execute("SET LOCAL statement_timeout = '120s'")
            conn.execute("SET LOCAL lock_timeout = '5s'")
            identity = conn.execute("SELECT current_user, current_database(), current_setting('transaction_read_only')").fetchone()
            result['identity_ok'] = identity[0] == role and identity[1] == 'postgres'
            result['read_only'] = identity[2] == 'on'
            tables = {}
            for table in ORDER:
                rows = read_rows(conn, table)
                checksum = fingerprint(table, rows)
                tables[table] = {
                    'rows': len(rows), 'sha256': checksum,
                    'matches_approved_baseline': len(rows) == BASE[table]['source_rows']
                    and checksum == BASE[table]['source_primary_replica_sha256'],
                }
            result['tables'] = tables
            definitions = conn.execute("""
                SELECT p.proname, md5(pg_get_functiondef(p.oid))
                FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
                WHERE n.nspname = 'cit_private' AND p.proname IN ('cep5_scope', 'resolve_row')
                ORDER BY p.proname
            """).fetchall()
            result['migration_0007_ok'] = len(definitions) == 2 and dict(definitions) == FUNCTION_HASHES
            result['ok'] = (result['identity_ok'] and result['read_only']
                            and result['migration_0007_ok']
                            and all(t['matches_approved_baseline'] for t in tables.values()))
            conn.rollback()
    except Exception as exc:
        result['error_type'] = type(exc).__name__
        result['sqlstate'] = getattr(exc, 'sqlstate', None)
        result['category'] = 'READONLY_SNAPSHOT_FAILED'
        # Deliberately omit str(exc): it can contain credentials or row values.
    return result


def main() -> None:
    checks = [inspect_side(label, config) for label, config in SIDES.items()]
    ok = all(check['ok'] for check in checks)
    report = {
        'observed_at_utc': datetime.now(timezone.utc).isoformat(),
        'mode': 'read_only_snapshot', 'persistent_writes': False,
        'fingerprint_protocol': 'sha256-json-array-lines-v1',
        'connection_snapshots': checks, 'ok': ok,
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if not ok:
        sys.exit(2)


if __name__ == '__main__':
    main()
