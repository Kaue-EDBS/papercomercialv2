"""Two real disposable PostgreSQL databases; no production credentials."""
import os
import pathlib
import sys
sys.path.insert(0,str(pathlib.Path(__file__).parents[1]/'scripts'))
import psycopg
from replication import replicate
src=os.environ['CIT_TEST_DB_URL']
dst=src.rsplit('/',1)[0]+'/cit_ci_replica'
def run(**kwargs):return replicate(src,dst,ci=True,**kwargs)
def scalar(dsn,q):
 with psycopg.connect(dsn,autocommit=True) as c:return c.execute(q).fetchone()[0]
def write(dsn,q):
 with psycopg.connect(dsn,autocommit=True) as c:c.execute(q)
def main():
 try:run(apply=True,fail_after_pages=2)
 except RuntimeError as e:assert str(e)=='CI_INJECTED_PAGE_FAILURE'
 else:raise AssertionError('Failure injection did not run')
 assert scalar(dst,'select count(*) from public.dim_municipio')==0
 assert scalar(dst,'select count(*) from cit_private.replication_pages')==2
 print('PASS: partial transfer persisted privately, business data unchanged')
 report=run(apply=True)
 assert report['parity'] and report['pages_reused']==2
 assert scalar(dst,'select count(*) from public.dim_cep5')==1005
 assert scalar(dst,'select count(*) from cit_private.replication_items')==0
 assert scalar(src,'select count(*) from public.audit_replication_runs')==4
 assert scalar(dst,'select count(*) from public.audit_replication_runs')==4
 print('PASS: paginated resume, source/replica hashes, mirrored current audit')
 assert run(apply=True)['parity']
 assert scalar(dst,'select count(*) from public.dim_cep5')==1005
 print('PASS: repeated full replication does not duplicate business rows')
 write(dst,"update public.dim_municipio set municipio='incorrect replica name' where cod_municipal='3550308'")
 assert not run()['parity']
 assert scalar(dst,"select municipio from public.dim_municipio where cod_municipal='3550308'")=='incorrect replica name'
 assert scalar(src,"select municipio from public.dim_municipio where cod_municipal='3550308'")=='Sao Paulo'
 print('PASS: comparison detects divergence without reverse repair')
 assert run(apply=True)['parity']
 write(dst,"insert into public.dim_cep5 select cod_municipal,'99999',municipio_origem,uf_origem,metodo_resolucao,ativo,carga_id,atualizado_em from public.dim_cep5 limit 1")
 try:run(apply=True)
 except ValueError as e:assert 'deletion approval' in str(e)
 else:raise AssertionError('Unapproved deletion happened')
 assert scalar(dst,'select count(*) from public.dim_cep5')==1006
 assert run(apply=True,allow_deletions=True)['parity']
 assert scalar(dst,'select count(*) from public.dim_cep5')==1005
 print('PASS: deletions require an explicit flag and converge atomically')
 try:run(apply=True,fail_after_commit=True)
 except RuntimeError as e:assert str(e)=='CI_INJECTED_AUDIT_DELIVERY_FAILURE'
 else:raise AssertionError('Postcommit failure not injected')
 assert scalar(dst,"select count(*) from cit_private.replication_jobs where status='PROMOTED'")>=1
 assert run(apply=True)['parity']
 assert scalar(dst,"select count(*) from cit_private.replication_jobs where status='PROMOTED'")==0
 print('PASS: postcommit audit delivery resumes without reloading or duplicating')
 assert run()['parity']
 assert scalar(src,'select count(*) from public.audit_replication_runs')==scalar(dst,'select count(*) from public.audit_replication_runs')
 print('PASS: final data parity and current event parity')
if __name__=='__main__':main()
