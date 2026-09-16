#!/usr/bin/env python3
"""Sanitized production connection preflight for CIT/Paper replication.

Never prints passwords or full DSNs. It validates expected project/user shapes,
connects to each side independently, and reports only safe diagnostic metadata.
"""
from __future__ import annotations

import json
import os
import re
import socket
import sys
from urllib.parse import parse_qs, quote, unquote, urlparse, urlunparse

EXPECTED = {
    "PRIMARY": {
        "env": "CIT_PRIMARY_DATABASE_URL",
        "ref": "chwsmkdkgdgocnbcyvmq",
        "role": "cit_replication_source_login",
        "member_of": "cit_replication_source",
    },
    "REPLICA": {
        "env": "CIT_REPLICA_DATABASE_URL",
        "ref": "vevmnoxbjdkibdwfygfn",
        "role": "cit_replication_target_login",
        "member_of": "cit_replication_target",
    },
}


def classify_error(exc: Exception) -> str:
    msg = str(exc).lower()
    if any(x in msg for x in ("could not translate host name", "name or service not known", "nodename nor servname")):
        return "DNS"
    if any(x in msg for x in ("password authentication failed", "authentication failed", "sasl authentication failed", "invalid password")):
        return "AUTH"
    if any(x in msg for x in ("tenant/user", "tenant or user not found", "unsupported or invalid secret format")):
        return "POOLER_AUTH"
    if any(x in msg for x in ("tenant not found", "unknown tenant", "invalid tenant")):
        return "POOLER_TENANT"
    if any(x in msg for x in ("user not found", "unknown user")):
        return "POOLER_USER"
    if "no pg_hba.conf entry" in msg:
        return "PG_HBA"
    if any(x in msg for x in ("too many connections", "too many clients", "remaining connection slots")):
        return "CAPACITY"
    if any(x in msg for x in ("unsupported startup parameter", "invalid startup parameter")):
        return "POOLER_PROTOCOL"
    if any(x in msg for x in ("certificate", "ssl", "tls")):
        return "SSL"
    if "server closed the connection unexpectedly" in msg:
        return "SERVER_CLOSED"
    if "connection refused" in msg:
        return "NETWORK_REFUSED"
    if any(x in msg for x in ("timeout", "timed out")):
        return "NETWORK_TIMEOUT"
    if any(x in msg for x in ("no route to host", "network is unreachable")):
        return "NETWORK"
    return "CONNECT"


def sanitize_error(exc: Exception, cfg: dict, dsn: str) -> str:
    """Return a short diagnostic that cannot expose credentials or full DSNs."""
    text = " ".join(str(exc).split())
    parsed = urlparse(dsn)
    replacements = {
        dsn: "<dsn>",
        cfg.get("ref", ""): "<project_ref>",
        cfg.get("role", ""): "<role>",
        parsed.hostname or "": "<host>",
        unquote(parsed.username or ""): "<user>",
        unquote(parsed.password or ""): "<password>",
    }
    for value, replacement in sorted(replacements.items(), key=lambda item: len(item[0]), reverse=True):
        if value:
            text = text.replace(value, replacement)
    text = re.sub(r"(?i)(password\s*[=:]\s*)\S+", r"\1<redacted>", text)
    text = re.sub(r"(?i)postgres(?:ql)?://\S+", "<dsn>", text)
    return text[:320]


def inspect_dsn(dsn: str, expected_ref: str, expected_role: str) -> dict:
    u = urlparse(dsn)
    username = unquote(u.username or "")
    host = u.hostname or ""
    sslmode = parse_qs(u.query).get("sslmode", [None])[0]
    pooler_user = f"{expected_role}.{expected_ref}"
    direct_ok = host in (f"db.{expected_ref}.supabase.co", f"{expected_ref}.supabase.co") and username == expected_role
    pooler_ok = host.endswith(".pooler.supabase.com") and username == pooler_user
    return {
        "scheme_ok": u.scheme in ("postgres", "postgresql"),
        "host": host,
        "port": u.port or 5432,
        "database": (u.path or "/").lstrip("/"),
        "user_shape_ok": direct_ok or pooler_ok,
        "sslmode_ok": sslmode == "verify-full",
        "is_pooler": pooler_ok,
    }


def dns_families(host: str, port: int) -> list[str]:
    families: set[str] = set()
    try:
        for family, *_ in socket.getaddrinfo(host, port, type=socket.SOCK_STREAM):
            if family == socket.AF_INET:
                families.add("IPv4")
            elif family == socket.AF_INET6:
                families.add("IPv6")
    except socket.gaierror:
        return []
    return sorted(families)


def direct_probe_dsn(pooler_dsn: str, cfg: dict) -> str:
    """Build the canonical direct endpoint without logging credentials."""
    parsed = urlparse(pooler_dsn)
    password = quote(unquote(parsed.password or ""), safe="")
    netloc = f"{cfg['role']}:{password}@db.{cfg['ref']}.supabase.co:5432"
    return urlunparse((parsed.scheme, netloc, "/postgres", "", parsed.query, ""))


def probe_direct_primary(pooler_dsn: str, cfg: dict) -> dict:
    import psycopg

    dsn = direct_probe_dsn(pooler_dsn, cfg)
    host = f"db.{cfg['ref']}.supabase.co"
    probe = {
        "attempted": True,
        "host": host,
        "port": 5432,
        "dns_families": dns_families(host, 5432),
        "ok": False,
    }
    try:
        with psycopg.connect(dsn, autocommit=True, connect_timeout=10) as conn:
            row = conn.execute(
                "select current_user, current_database(), current_setting('server_version_num'), pg_has_role(current_user,%s,'member')",
                (cfg["member_of"],),
            ).fetchone()
            probe.update(
                {
                    "current_user_ok": row[0] == cfg["role"],
                    "database_ok": row[1] == "postgres",
                    "role_membership_ok": bool(row[3]),
                    "server_version_num": row[2],
                }
            )
            probe["ok"] = all((probe["current_user_ok"], probe["database_ok"], probe["role_membership_ok"]))
            probe["category"] = "OK" if probe["ok"] else "ROLE_CONTRACT"
    except Exception as exc:
        probe["category"] = classify_error(exc)
        probe["error_type"] = type(exc).__name__
        probe["sqlstate"] = getattr(exc, "sqlstate", None)
        probe["safe_detail"] = sanitize_error(exc, cfg, dsn)
    return probe


def check_side(label: str, cfg: dict) -> dict:
    import psycopg

    dsn = os.environ.get(cfg["env"], "")
    if not dsn:
        return {"side": label, "ok": False, "category": "MISSING_SECRET"}

    meta = inspect_dsn(dsn, cfg["ref"], cfg["role"])
    result = {
        "side": label,
        "ok": False,
        "host": meta["host"],
        "port": meta["port"],
        "database": meta["database"],
        "user_shape_ok": meta["user_shape_ok"],
        "sslmode_ok": meta["sslmode_ok"],
        "dns_families": dns_families(meta["host"], meta["port"]),
    }
    if not meta["scheme_ok"] or not meta["user_shape_ok"] or not meta["sslmode_ok"]:
        result["category"] = "DSN_CONTRACT"
        return result

    try:
        with psycopg.connect(dsn, autocommit=True, connect_timeout=10) as conn:
            row = conn.execute(
                "select current_user, current_database(), current_setting('server_version_num'), pg_has_role(current_user,%s,'member')",
                (cfg["member_of"],),
            ).fetchone()
            result.update(
                {
                    "current_user_ok": row[0] == cfg["role"],
                    "database_ok": row[1] == "postgres",
                    "role_membership_ok": bool(row[3]),
                    "server_version_num": row[2],
                }
            )
            result["ok"] = all((result["current_user_ok"], result["database_ok"], result["role_membership_ok"]))
            result["category"] = "OK" if result["ok"] else "ROLE_CONTRACT"
            return result
    except Exception as exc:
        result["category"] = classify_error(exc)
        result["error_type"] = type(exc).__name__
        result["sqlstate"] = getattr(exc, "sqlstate", None)
        result["safe_detail"] = sanitize_error(exc, cfg, dsn)
        if label == "PRIMARY" and meta["is_pooler"] and result["category"] == "POOLER_AUTH":
            result["direct_probe"] = probe_direct_primary(dsn, cfg)
        return result


def main() -> None:
    checks = [check_side(label, cfg) for label, cfg in EXPECTED.items()]
    print(json.dumps({"connection_preflight": checks}, ensure_ascii=False, indent=2))
    if not all(c["ok"] for c in checks):
        sys.exit(2)


if __name__ == "__main__":
    main()
