import importlib.util
import pathlib
import unittest
p=pathlib.Path(__file__).parents[1]/'scripts/geography_fingerprint.py'
s=importlib.util.spec_from_file_location('geography_fingerprint',p);gf=importlib.util.module_from_spec(s);s.loader.exec_module(gf)
class GeographyFingerprint(unittest.TestCase):
 def test_allowlist(self):
  with self.assertRaises(ValueError): gf.fingerprint('auth.users',[])
 def test_order_and_zero(self):
  a={'cod_municipal':'3550308','cep5':'01001','municipio_origem':'Sao Paulo','uf_origem':'SP','metodo_resolucao':'EXATO','ativo':True}
  b=dict(a,cep5='01002')
  self.assertEqual(gf.fingerprint('dim_cep5',[a,b]),gf.fingerprint('dim_cep5',[b,a]))
  self.assertNotEqual(gf.fingerprint('dim_cep5',[a]),gf.fingerprint('dim_cep5',[dict(a,cep5='1001')]))
 def test_duplicate_key_rejected(self):
  a={'cod_municipal':'3550308','cep5':'01001','municipio_origem':'Sao Paulo','uf_origem':'SP','metodo_resolucao':'EXATO','ativo':True}
  with self.assertRaises(ValueError): gf.fingerprint('dim_cep5',[a,a])
if __name__=='__main__':unittest.main()
