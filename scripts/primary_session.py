#!/usr/bin/env python3
"""Use the approved PRIMARY session endpoint without rewriting any secret.

The existing URL supplies credentials. Only its pooler host/port are replaced,
inside this process, after a strict project/user/TLS contract check.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
import re
import runpy
import sys
from urllib.parse import parse_qs, unquote, urlparse, urlunparse

PRIMARY_HOST = 'aws-1-us-east-1.pooler.supabase.com'
PRIMARY_USER = 'cit_replication_source_login.chwsmkdkgdgocnbcyvmq'
ACCEPTED_HOSTS = {'aws-0-us-east-1.pooler.supabase.com', PRIMARY_HOST}
ALLOWED_QUERY = {'sslmode', 'sslrootcert', 'connect_timeout', 'application_name'}
TARGETS = {
    'preflight': 'replication_preflight.py',
    'snapshot': 'connection_snapshot_readonly.py',
    'replicate': 'replication.py',
}


def primary_session_dsn(value: str) -> str:
    """Preserve encoded credentials byte-for-byte; never include them in errors."""
    try:
        if not isinstance(value, str) or not value or any(c.isspace() for c in value):
            raise ValueError
        u = urlparse(value)
        query = parse_qs(u.query, keep_blank_values=True, strict_parsing=True)
        if (u.scheme not in ('postgres', 'postgresql')
                or u.hostname not in ACCEPTED_HOSTS
                or u.port not in (None, 5432, 6543)
                or unquote(u.username or '') != PRIMARY_USER
                or not u.password or u.path != '/postgres'
                or u.params or u.fragment
                or query.get('sslmode') != ['verify-full']
                or not set(query).issubset(ALLOWED_QUERY)
                or any(len(v) != 1 or not v[0] for v in query.values())
                or re.search(r'%(?![0-9a-fA-F]{2})', u.netloc)):
            raise ValueError
        credentials, separator, _ = u.netloc.rpartition('@')
        if not separator or credentials.count('@'):
            raise ValueError
        return urlunparse(u._replace(netloc=f'{credentials}@{PRIMARY_HOST}:5432'))
    except (ValueError, TypeError, AttributeError):
        raise ValueError('PRIMARY_SESSION_CONNECTION_CONTRACT_INVALID') from None


def main() -> None:
    if len(sys.argv) < 2 or sys.argv[1] not in TARGETS:
        raise SystemExit('Usage: primary_session.py preflight|snapshot|replicate [worker flags]')
    mode = sys.argv[1]
    if mode != 'replicate' and len(sys.argv) != 2:
        raise SystemExit('Preflight and snapshot accept no arguments')
    original = os.environ.get('CIT_PRIMARY_DATABASE_URL', '')
    try:
        effective = primary_session_dsn(original)
    except ValueError:
        print(json.dumps({'primary_endpoint': {'ok': False, 'category': 'DSN_CONTRACT'}}))
        raise SystemExit(2) from None
    print(json.dumps({'primary_endpoint': {
        'stored_host': urlparse(original).hostname,
        'effective_host': PRIMARY_HOST,
        'effective_port': 5432,
        'sslmode': 'verify-full',
        'credentials_preserved': True,
        'secret_modified': False,
    }}), flush=True)
    os.environ['CIT_PRIMARY_DATABASE_URL'] = effective
    target = Path(__file__).resolve().parent / TARGETS[mode]
    sys.argv = [str(target), *sys.argv[2:]]
    runpy.run_path(str(target), run_name='__main__')


if __name__ == '__main__':
    main()
