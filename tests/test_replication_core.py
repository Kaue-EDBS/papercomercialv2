import importlib.util
import pathlib
import unittest
p=pathlib.Path(__file__).parents[1]/'scripts/replication.py'
s=importlib.util.spec_from_file_location('replication',p);replication=importlib.util.module_from_spec(s);s.loader.exec_module(replication)
class ReplicationCore(unittest.TestCase):
 def test_targets_reject_reversed_projects(self):
  with self.assertRaises(ValueError): replication.validate_target('postgresql://postgres:x@vevmnoxbjdkibdwfygfn.supabase.co/postgres?sslmode=verify-full','chwsmkdkgdgocnbcyvmq')
 def test_target_requires_tls_verification(self):
  with self.assertRaises(ValueError): replication.validate_target('postgresql://postgres:x@chwsmkdkgdgocnbcyvmq.supabase.co/postgres?sslmode=require','chwsmkdkgdgocnbcyvmq')
 def test_ci_never_remote(self):
  with self.assertRaises(ValueError): replication.validate_target('postgresql://postgres:x@example.com/cit_ci','unused',True)
 def test_allowlist(self):
  with self.assertRaises(ValueError): replication.fingerprint('auth.users',[])
 def test_order_and_zero(self):
  a={'cod_municipal':'3550308','cep5':'01001','municipio_origem':'Sao Paulo','uf_origem':'SP','metodo_resolucao':'EXATO','ativo':True}
  b=dict(a,cep5='01002')
  self.assertEqual(replication.fingerprint('dim_cep5',[a,b]),replication.fingerprint('dim_cep5',[b,a]))
  self.assertNotEqual(replication.fingerprint('dim_cep5',[a]),replication.fingerprint('dim_cep5',[dict(a,cep5='1001')]))
 def test_duplicate_key_rejected(self):
  a={'cod_municipal':'3550308','cep5':'01001','municipio_origem':'Sao Paulo','uf_origem':'SP','metodo_resolucao':'EXATO','ativo':True}
  with self.assertRaises(ValueError): replication.fingerprint('dim_cep5',[a,a])
if __name__=='__main__':unittest.main()
