import importlib.util
import pathlib
import unittest
from urllib.parse import urlparse

MODULE_PATH = pathlib.Path(__file__).resolve().parents[1] / "scripts" / "replication_preflight.py"
spec = importlib.util.spec_from_file_location("replication_preflight", MODULE_PATH)
module = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(module)


class FakeError(Exception):
    sqlstate = "28P01"


class ReplicationPreflightTests(unittest.TestCase):
    def test_sanitize_error_redacts_sensitive_dsn_parts(self):
        dsn = (
            "postgresql://cit_replication_source_login.chwsmkdkgdgocnbcyvmq:"
            "UltraSecret123@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=verify-full"
        )
        cfg = {
            "ref": "chwsmkdkgdgocnbcyvmq",
            "role": "cit_replication_source_login",
        }
        exc = FakeError(
            "password authentication failed for user "
            "cit_replication_source_login.chwsmkdkgdgocnbcyvmq at "
            "aws-0-us-east-1.pooler.supabase.com using UltraSecret123 " + dsn
        )
        safe = module.sanitize_error(exc, cfg, dsn)
        self.assertNotIn("UltraSecret123", safe)
        self.assertNotIn("chwsmkdkgdgocnbcyvmq", safe)
        self.assertNotIn("cit_replication_source_login", safe)
        self.assertNotIn("aws-0-us-east-1.pooler.supabase.com", safe)
        self.assertNotIn("postgresql://", safe)

    def test_classify_known_failures(self):
        cases = {
            "password authentication failed": "AUTH",
            "tenant or user not found": "POOLER_AUTH",
            "tenant/user foo not found": "POOLER_AUTH",
            "tenant not found": "POOLER_TENANT",
            "no pg_hba.conf entry": "PG_HBA",
            "server closed the connection unexpectedly": "SERVER_CLOSED",
            "connection refused": "NETWORK_REFUSED",
            "connection timed out": "NETWORK_TIMEOUT",
        }
        for message, expected in cases.items():
            with self.subTest(message=message):
                self.assertEqual(module.classify_error(Exception(message)), expected)

    def test_direct_probe_dsn_uses_direct_host_and_plain_role(self):
        pooler = (
            "postgresql://cit_replication_source_login.chwsmkdkgdgocnbcyvmq:"
            "AlphaNumeric123@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=verify-full"
        )
        cfg = {
            "ref": "chwsmkdkgdgocnbcyvmq",
            "role": "cit_replication_source_login",
        }
        direct = module.direct_probe_dsn(pooler, cfg)
        parsed = urlparse(direct)
        self.assertEqual(parsed.hostname, "db.chwsmkdkgdgocnbcyvmq.supabase.co")
        self.assertEqual(parsed.port, 5432)
        self.assertEqual(parsed.username, "cit_replication_source_login")
        self.assertEqual(parsed.password, "AlphaNumeric123")
        self.assertEqual(parsed.path, "/postgres")
        self.assertIn("sslmode=verify-full", parsed.query)

    def test_direct_probe_error_is_sanitized(self):
        dsn = (
            "postgresql://cit_replication_source_login:UltraSecret123@"
            "db.chwsmkdkgdgocnbcyvmq.supabase.co:5432/postgres?sslmode=verify-full"
        )
        cfg = {
            "ref": "chwsmkdkgdgocnbcyvmq",
            "role": "cit_replication_source_login",
        }
        exc = FakeError(
            "connection to db.chwsmkdkgdgocnbcyvmq.supabase.co failed for "
            "cit_replication_source_login password=UltraSecret123"
        )
        safe = module.sanitize_error(exc, cfg, dsn)
        for secret in (
            "UltraSecret123",
            "chwsmkdkgdgocnbcyvmq",
            "cit_replication_source_login",
            "db.chwsmkdkgdgocnbcyvmq.supabase.co",
        ):
            self.assertNotIn(secret, safe)


if __name__ == "__main__":
    unittest.main()
