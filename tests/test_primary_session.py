import importlib.util
from pathlib import Path
import unittest
from urllib.parse import urlparse

MODULE = Path(__file__).resolve().parents[1] / 'scripts' / 'primary_session.py'
spec = importlib.util.spec_from_file_location('primary_session', MODULE)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class PrimarySessionTests(unittest.TestCase):
    def dsn(self, host='aws-0-us-east-1.pooler.supabase.com', port='5432', password='unit-test-only'):
        return f'postgresql://{module.PRIMARY_USER}:{password}@{host}:{port}/postgres?sslmode=verify-full'

    def test_old_host_is_corrected(self):
        result = urlparse(module.primary_session_dsn(self.dsn()))
        self.assertEqual(result.hostname, module.PRIMARY_HOST)
        self.assertEqual(result.port, 5432)

    def test_correct_endpoint_is_idempotent(self):
        original = self.dsn(host=module.PRIMARY_HOST)
        self.assertEqual(module.primary_session_dsn(original), original)

    def test_transaction_port_is_normalized_to_session(self):
        self.assertEqual(urlparse(module.primary_session_dsn(self.dsn(port='6543'))).port, 5432)

    def test_encoded_password_is_preserved_exactly(self):
        original = self.dsn(password='unit%40test%3A%2F%25%23%3F%2Bonly')
        result = module.primary_session_dsn(original)
        self.assertEqual(urlparse(original).password, urlparse(result).password)

    def test_tls_and_supported_options_are_preserved(self):
        original = self.dsn() + '&connect_timeout=10&sslrootcert=%2Ftmp%2Froot.crt'
        self.assertEqual(urlparse(module.primary_session_dsn(original)).query, urlparse(original).query)

    def test_no_port_defaults_to_session(self):
        original = self.dsn().replace(':5432/postgres', '/postgres')
        self.assertEqual(urlparse(module.primary_session_dsn(original)).port, 5432)

    def test_wrong_project_rejected(self):
        with self.assertRaisesRegex(ValueError, '^PRIMARY_SESSION_CONNECTION_CONTRACT_INVALID$'):
            module.primary_session_dsn(self.dsn().replace('chwsmkdkgdgocnbcyvmq', 'vevmnoxbjdkibdwfygfn'))

    def test_privileged_user_rejected(self):
        with self.assertRaises(ValueError):
            module.primary_session_dsn(self.dsn().replace('cit_replication_source_login', 'postgres'))

    def test_unsupported_hosts_rejected(self):
        for host in ('example.com', 'aws-2-us-east-1.pooler.supabase.com', module.PRIMARY_HOST + '.example.com'):
            with self.subTest(host=host), self.assertRaises(ValueError):
                module.primary_session_dsn(self.dsn(host=host))

    def test_query_cannot_override_destination_credentials_or_tls(self):
        for extra in ('host=example.com', 'hostaddr=127.0.0.1', 'user=postgres', 'password=x', 'dbname=other', 'port=6543', 'sslmode=require', 'options=-csearch_path=public'):
            with self.subTest(extra=extra), self.assertRaises(ValueError):
                module.primary_session_dsn(self.dsn() + '&' + extra)

    def test_tls_downgrade_rejected(self):
        for mode in ('require', 'prefer', 'disable', ''):
            with self.subTest(mode=mode), self.assertRaises(ValueError):
                module.primary_session_dsn(self.dsn().replace('verify-full', mode))

    def test_invalid_inputs_do_not_echo_credentials(self):
        secret = 'SYNTHETIC_TEST_CREDENTIAL'
        for value in ('', None, 'bad-url', self.dsn(password=secret).replace('/postgres?', '/other?'), self.dsn(password=secret) + '#fragment', self.dsn(password='%XY')):
            with self.subTest(value_type=type(value).__name__):
                with self.assertRaises(ValueError) as error:
                    module.primary_session_dsn(value)
                self.assertNotIn(secret, str(error.exception))
                self.assertEqual(str(error.exception), 'PRIMARY_SESSION_CONNECTION_CONTRACT_INVALID')

    def test_embedded_userinfo_or_whitespace_rejected(self):
        for password in ('unencoded@value', 'has space', 'has\nnewline'):
            with self.subTest(password=password), self.assertRaises(ValueError):
                module.primary_session_dsn(self.dsn(password=password))

    def test_unexpected_port_rejected(self):
        with self.assertRaises(ValueError):
            module.primary_session_dsn(self.dsn(port='443'))


if __name__ == '__main__':
    unittest.main()
