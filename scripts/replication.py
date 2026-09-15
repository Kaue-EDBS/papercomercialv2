#!/usr/bin/env python3
"""CIT-only geographic replication. Credentials are server-side environment variables.
Default is compare and audit, never repair. Canonical dimensions are not reloaded
from another project. See docs/replication/operations.md for deployment prerequisites.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path
import sys
import uuid
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse, parse_qs, unquote

ROOT = Path(__file__).resolve().parents[1]
BASE = json.loads((ROOT / 'docs/testing/cit-paper-snapshot-2026-09-15.json').read_text())['business_data']['tables']
ORDER = ['dim_municipio', 'dim_distrito', 'dim_subdistrito', 'dim_cep5']
PK = {t: BASE[t]['primary_key'] for t in ORDER}
COLS = {t: BASE[t]['checksum_columns'] for t in ORDER}
META = ['etl_cargas', 'audit_data_quality', 'audit_replication_runs']
META_PK = {'etl_cargas': ['carga_id'], 'audit_data_quality': ['check_id'], 'audit_replication_runs': ['run_id']}


def digest(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def dump(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(', ', ': '), allow_nan=False)


def fingerprint(table: str, rows: list[dict]) -> str:
    if table not in ORDER:
        raise ValueError('Table not allowlisted')
    ordered = sorted(rows, key=lambda r: tuple(r[k] for k in PK[table]))
    if len({tuple(r[k] for k in PK[table]) for r in rows}) != len(rows):
        raise ValueError('Duplicate primary keys in source')
    return digest('\n'.join(dump([r[c] for c in COLS[table]]) for r in ordered).encode())


def validate_target(dsn: str, expected_ref: str, ci: bool = False) -> None:
    u = urlparse(dsn)
    if u.scheme not in ('postgresql', 'postgres'):
        raise ValueError('PostgreSQL connection URL required')
    if ci:
        if u.hostname not in ('localhost', '127.0.0.1') or u.path not in ('/cit_ci', '/cit_ci_replica'):
            raise ValueError('CI mode restricted to localhost/cit_ci*')
    else:
        host = u.hostname or ''
        direct = host in (f'db.{expected_ref}.supabase.co', f'{expected_ref}.supabase.co')
        pooler = host.endswith('.pooler.supabase.com') and unquote(u.username or '').endswith('.' + expected_ref)
        if not (direct or pooler) or parse_qs(u.query).get('sslmode') != ['verify-full']:
            raise ValueError('Unexpected project or missing sslmode=verify-full')


def read_rows(conn, table: str, *, where: str = '', args: tuple = ()) -> list[dict]:
    from psycopg import sql
    if table not in ORDER + META:
        raise ValueError('Table not allowlisted')
    keys = PK.get(table, META_PK.get(table))
    query = sql.SQL('select to_jsonb(t) from public.{} t {} order by {}').format(
        sql.Identifier(table), sql.SQL(where), sql.SQL(',').join(sql.Identifier(k) for k in keys))
    result: list[dict] = []
    with conn.cursor(name='export_' + uuid.uuid4().hex) as cur:
        cur.execute(query, args)
        while page := cur.fetchmany(500):
            result.extend(r[0] for r in page)
            if len(result) > 2_000_000:
                raise ValueError('Snapshot row safety limit exceeded')
    return result


def upsert(conn, table: str, rows: list[dict], keys: list[str]) -> None:
    from psycopg import sql
    from psycopg.types.json import Jsonb
    if not rows:
        return
    if table not in ORDER + META:
        raise ValueError('Table not allowlisted')
    allowed = set(COLS[table] + ['carga_id', 'atualizado_em']) if table in ORDER else set(rows[0])
    actual = {r[0] for r in conn.execute('select column_name from information_schema.columns where table_schema=%s and table_name=%s', ('public', table))}
    if allowed != actual or any(set(r) != allowed for r in rows):
        raise ValueError('Schema or column contract mismatch')
    cols = sorted(allowed)
    stmt = sql.SQL('insert into public.{} ({}) select {} from jsonb_populate_recordset(null::public.{},%s) on conflict ({}) do update set {}').format(
        sql.Identifier(table), sql.SQL(',').join(map(sql.Identifier, cols)), sql.SQL(',').join(map(sql.Identifier, cols)),
        sql.Identifier(table), sql.SQL(',').join(map(sql.Identifier, keys)),
        sql.SQL(',').join(sql.SQL('{}=excluded.{}').format(sql.Identifier(c), sql.Identifier(c)) for c in cols if c not in keys))
    for start in range(0, len(rows), 500):
        conn.execute(stmt, (Jsonb(rows[start:start+500]),))


def write_events(conn, events: list[dict]) -> None:
    # Current reconciliation events are not fabricated historical load events.
    from psycopg import sql
    for ev in events:
        cols = list(ev)
        q = sql.SQL('insert into public.audit_replication_runs ({}) values ({}) on conflict (run_id) do update set {}').format(
            sql.SQL(',').join(map(sql.Identifier, cols)), sql.SQL(',').join(sql.Placeholder() for _ in cols),
            sql.SQL(',').join(sql.SQL('{}=excluded.{}').format(sql.Identifier(c), sql.Identifier(c)) for c in cols if c != 'run_id'))
        conn.execute(q, tuple(ev[c] for c in cols))


def replicate(primary_dsn: str, replica_dsn: str, *, apply: bool = False, allow_deletions: bool = False,
              ci: bool = False, fail_after_pages: int | None = None, fail_after_commit: bool = False) -> dict:
    import psycopg
    from psycopg import sql
    from psycopg.types.json import Jsonb
    validate_target(primary_dsn, 'chwsmkdkgdgocnbcyvmq', ci)
    validate_target(replica_dsn, 'vevmnoxbjdkibdwfygfn', ci)
    if primary_dsn == replica_dsn:
        raise ValueError('Origin and destination must differ')
    with psycopg.connect(primary_dsn, autocommit=True) as src, psycopg.connect(replica_dsn, autocommit=True) as dst:
        for conn in (src, dst):
            conn.execute("set timezone='UTC'")
            conn.execute("set lock_timeout='10s'")
            conn.execute("set statement_timeout='120s'")
        # Fail closed on column/type/nullability drift before reporting parity.
        for table in ORDER:
            expected = set(COLS[table] + ['carga_id', 'atualizado_em'])
            signature = []
            for conn in (src, dst):
                spec = conn.execute("select column_name,data_type,is_nullable from information_schema.columns where table_schema='public' and table_name=%s order by column_name", (table,)).fetchall()
                if {r[0] for r in spec} != expected:
                    raise ValueError('Schema does not match the versioned allowlist')
                signature.append(spec)
            if signature[0] != signature[1]:
                raise ValueError('Source/destination schema mismatch')
        dst.execute("select pg_advisory_lock(hashtext('cit-geography-replication-v1'))")
        with src.transaction():
            src.execute('set transaction isolation level repeatable read')
            if apply:
                src.execute(sql.SQL('lock table {} in share mode').format(sql.SQL(',').join(sql.Identifier('public', t) for t in ORDER)))
            source = {t: read_rows(src, t) for t in ORDER}
            if not source['dim_municipio'] or not source['dim_cep5']:
                raise ValueError('Empty canonical source is not promotable')
            load_ids = sorted({r['carga_id'] for rows in source.values() for r in rows})
            loads = read_rows(src, 'etl_cargas', where='where carga_id::text = any(%s)', args=(load_ids,))
            if len(loads) != len(load_ids) or any(r['status'] != 'concluida' for r in loads):
                raise ValueError('Canonical source requires completed load records')
            quality = read_rows(src, 'audit_data_quality', where='where carga_id::text = any(%s)', args=(load_ids,))
            if any(not r['passou'] and r['severidade'] == 'critical' for r in quality):
                raise ValueError('Source has a failed critical quality check')
            historical_events = read_rows(src, 'audit_replication_runs', where='where tabela = any(%s) and (carga_id is null or carga_id::text = any(%s))', args=(ORDER, load_ids))
            snapshot_hash = digest(dump(source).encode())
            hashes = {t: fingerprint(t, rows) for t, rows in source.items()}
            skipped = 0; pages_written = 0
            job_id = str(uuid.uuid4())
            if apply:
                old = dst.execute("select job_id,status,result from cit_private.replication_jobs where snapshot_sha256=%s and (status='STAGING' or (status='PROMOTED' and result->>'mode'='apply')) order by created_at limit 1", (snapshot_hash,)).fetchone()
                if old:
                    job_id = str(old[0])
                else:
                    dst.execute("insert into cit_private.replication_jobs(job_id,snapshot_sha256,status) values(%s,%s,'STAGING')", (job_id, snapshot_hash))
                if not old or old[1] == 'STAGING':
                    for table, rows in source.items():
                        for page_no, start in enumerate(range(0, len(rows), 500)):
                            page = rows[start:start+500]; ph = digest(dump(page).encode())
                            existing = dst.execute('select sha256,row_count from cit_private.replication_pages where job_id=%s and table_name=%s and page_no=%s', (job_id, table, page_no)).fetchone()
                            if existing:
                                if tuple(existing) != (ph, len(page)):
                                    raise ValueError('Changed replay rejected')
                                skipped += 1; continue
                            with dst.transaction():
                                with dst.cursor() as cur:
                                    cur.executemany('insert into cit_private.replication_items(job_id,table_name,row_key,payload) values(%s,%s,%s,%s)',
                                        [(job_id,table,'|'.join(r[k] for k in PK[table]),Jsonb(r)) for r in page])
                                dst.execute('insert into cit_private.replication_pages values(%s,%s,%s,%s,%s)', (job_id,table,page_no,ph,len(page)))
                            pages_written += 1
                            if ci and fail_after_pages == pages_written:
                                raise RuntimeError('CI_INJECTED_PAGE_FAILURE')
                    with dst.transaction():
                        dst.execute(sql.SQL('lock table {} in share row exclusive mode').format(sql.SQL(',').join(sql.Identifier('public', t) for t in ORDER)))
                        for table in ORDER:
                            staged = [r[0] for r in dst.execute('select payload from cit_private.replication_items where job_id=%s and table_name=%s order by row_key',(job_id,table))]
                            if len(staged) != len(source[table]) or fingerprint(table, staged) != hashes[table]:
                                raise ValueError('Staged content verification failed')
                        before = {t: read_rows(dst, t) for t in ORDER}
                        extras = {t: {tuple(r[k] for k in PK[t]) for r in before[t]} - {tuple(r[k] for k in PK[t]) for r in source[t]} for t in ORDER}
                        if any(extras.values()) and not allow_deletions:
                            raise ValueError('Destination extras detected; explicit deletion approval required')
                        for table in reversed(ORDER):
                            condition = sql.SQL(' and ').join(sql.SQL('{}=%s').format(sql.Identifier(k)) for k in PK[table])
                            for key in sorted(extras[table]):
                                dst.execute(sql.SQL('delete from public.{} where {}').format(sql.Identifier(table),condition), key)
                        upsert(dst, 'etl_cargas', loads, META_PK['etl_cargas'])
                        for table in ORDER:
                            upsert(dst,table,source[table],PK[table])
                        upsert(dst,'audit_data_quality',quality,META_PK['audit_data_quality'])
                        upsert(dst,'audit_replication_runs',historical_events,META_PK['audit_replication_runs'])
                        final = {t: read_rows(dst,t) for t in ORDER}
                        if any(fingerprint(t,final[t]) != hashes[t] for t in ORDER):
                            raise ValueError('Destination content did not converge; transaction rolled back')
                        report = {'job_id':job_id,'mode':'apply','snapshot_sha256':snapshot_hash,'tables':{
                            t:{'source':len(source[t]),'destination':len(final[t]),'source_sha256':hashes[t],
                               'destination_sha256':fingerprint(t,final[t]),'deleted':len(extras[t])} for t in ORDER}}
                        dst.execute("update cit_private.replication_jobs set status='PROMOTED',result=%s where job_id=%s", (Jsonb(report),job_id))
                    if ci and fail_after_commit:
                        raise RuntimeError('CI_INJECTED_AUDIT_DELIVERY_FAILURE')
                else:
                    report = old[2]
                    with dst.transaction():
                        final = {t: read_rows(dst,t) for t in ORDER}
                    if any(fingerprint(t,final[t]) != hashes[t] for t in ORDER):
                        raise ValueError('Destination changed after promotion; start a fresh reconciliation')
            else:
                with dst.transaction():
                    dst.execute('set transaction isolation level repeatable read')
                    final = {t: read_rows(dst,t) for t in ORDER}
                report = {'job_id':job_id,'mode':'check','snapshot_sha256':snapshot_hash,'tables':{
                    t:{'source':len(source[t]),'destination':len(final[t]),'source_sha256':hashes[t],
                       'destination_sha256':fingerprint(t,final[t]),'deleted':0} for t in ORDER}}
            now = datetime.now(timezone.utc).isoformat()
            events=[]
            for table, data in report['tables'].items():
                equal = data['source'] == data['destination'] and data['source_sha256'] == data['destination_sha256']
                events.append({'run_id':str(uuid.uuid5(uuid.UUID(job_id),table)),'carga_id':None,'tabela':table,
                    'origem':'CIT/Paper PRIMARY','destino':'CIT/Paper REPLICA','status':'concluida' if equal else 'divergente',
                    'linhas_origem':data['source'],'linhas_destino':data['destination'],
                    'checksum_origem':data['source_sha256'],'checksum_destino':data['destination_sha256'],
                    'iniciada_em':now,'finalizada_em':now,'erro':None if equal else 'Current reconciliation mismatch; not a historical load event'})
            report['events']=events
            with dst.transaction():
                dst.execute("insert into cit_private.replication_jobs(job_id,snapshot_sha256,status,result) values(%s,%s,'PROMOTED',%s) on conflict(job_id) do update set result=excluded.result",(job_id,snapshot_hash,Jsonb(report)))
                write_events(dst,events)
            write_events(src,events)
        # Source audit has committed. Only now acknowledge the durable outbox.
        with dst.transaction():
            dst.execute("update cit_private.replication_jobs set status='AUDITED',completed_at=now() where job_id=%s",(job_id,))
            dst.execute('delete from cit_private.replication_items where job_id=%s',(job_id,))
            dst.execute('delete from cit_private.replication_pages where job_id=%s',(job_id,))
        report['pages_reused']=skipped
        report['parity']=all(v['source']==v['destination'] and v['source_sha256']==v['destination_sha256'] for v in report['tables'].values())
        report.pop('events',None)
        return report


def main() -> None:
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply',action='store_true')
    parser.add_argument('--allow-deletions',action='store_true')
    args=parser.parse_args()
    try:
        report=replicate(os.environ['CIT_PRIMARY_DATABASE_URL'],os.environ['CIT_REPLICA_DATABASE_URL'],apply=args.apply,allow_deletions=args.allow_deletions)
        print(json.dumps(report,ensure_ascii=False,indent=2))
        if not report['parity']: sys.exit(3)
    except Exception as exc:
        print(json.dumps({'ok':False,'error_type':type(exc).__name__,'message':'Replication stopped safely. Inspect restricted server logs and retained checkpoint.'}),file=sys.stderr)
        sys.exit(2)

if __name__=='__main__': main()
