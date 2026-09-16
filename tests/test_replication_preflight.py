import importlib.util
import pathlib
import unittest

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
            "tenant not found": "POOLER_TENANT",
            "no pg_hba.conf entry": "PG_HBA",
            "server closed the connection unexpectedly": "SERVER_CLOSED",
            "connection refused": "NETWORK_REFUSED",
            "connection timed out": "NETWORK_TIMEOUT",
        }
        for message, expected in cases.items():
            with self.subTest(message=message):
                self.assertEqual(module.classify_error(Exception(message)), expected)


if __name__ == "__main__":
    unittest.main()
