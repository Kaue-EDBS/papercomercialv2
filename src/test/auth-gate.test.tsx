import {render,screen,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
const auth=vi.hoisted(()=>({email:'consultor@editoradobrasil.com.br' as string,role:'viewer' as string|null,rpc:vi.fn(),signOut:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{
 auth:{
  getSession:async()=>({data:{session:{user:{id:'u1',email:auth.email}}}}),
  onAuthStateChange:()=>({data:{subscription:{unsubscribe:()=>undefined}}}),
  signOut:auth.signOut,
 },
 rpc:auth.rpc,
}}));
vi.mock('@/integrations/lovable/index',()=>({lovable:{auth:{signInWithOAuth:vi.fn()}}}));
import AuthGate from '../auth/AuthGate';
import {useAccess} from '../auth/access';
const Probe=()=>{const {role}=useAccess();return <p>Perfil {role}</p>;};
beforeEach(()=>{
 auth.email='consultor@editoradobrasil.com.br';auth.role='viewer';
 auth.rpc.mockReset();auth.rpc.mockImplementation(async()=>({data:{role:auth.role,authorized:auth.role!==null},error:null}));
 auth.signOut.mockReset();auth.signOut.mockResolvedValue({error:null});
});
afterEach(cleanup);
describe('AuthGate (F01)',()=>{
 it('exposes the server-provided profile to the app',async()=>{
  render(<AuthGate><Probe/></AuthGate>);
  expect(await screen.findByText('Perfil viewer')).toBeInTheDocument();
  expect(auth.rpc).toHaveBeenCalledWith('cit_ingest',{action:'session',payload:{}});
 });
 it('blocks an EDBS account without an active profile',async()=>{
  auth.role=null;render(<AuthGate><Probe/></AuthGate>);
  expect(await screen.findByText('Acesso nao liberado')).toBeInTheDocument();
  expect(screen.queryByText(/Perfil/)).not.toBeInTheDocument();
 });
 it('ends a session from another domain before asking for a profile',async()=>{
  auth.email='alguem@example.com';render(<AuthGate><Probe/></AuthGate>);
  expect(await screen.findByText(/Acesso nao autorizado/)).toBeInTheDocument();
  expect(auth.signOut).toHaveBeenCalled();
  expect(auth.rpc).not.toHaveBeenCalled();
 });
});
