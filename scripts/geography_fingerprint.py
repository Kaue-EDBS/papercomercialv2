"""Geographic content fingerprint, protocol sha256-json-array-lines-v1 (README, section 11).

Extracted unchanged from the former scripts/replication.py when the REPLICA was
discontinued (29/09/2026); reprocess-geography.py still verifies the approved
sources against the homologated baseline with it.
"""
from __future__ import annotations
import hashlib
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
BASE = json.loads((ROOT / 'docs/testing/cit-paper-snapshot-2026-09-15.json').read_text())['business_data']['tables']
ORDER = ['dim_municipio', 'dim_distrito', 'dim_subdistrito', 'dim_cep5']
PK = {t: BASE[t]['primary_key'] for t in ORDER}
COLS = {t: BASE[t]['checksum_columns'] for t in ORDER}


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
