import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
const api=vi.hoisted(()=>({role:'admin' as string|null,status:'REVIEW',rpc:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{
 auth:{getSession:async()=>({data:{session:{user:{id:'test-user'}}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe:()=>undefined}}}),signOut:async()=>({error:null})},
 rpc:api.rpc
}}));
import IngestionConsole from '../features/ingestion/IngestionConsole';
beforeEach(()=>{
 api.role='admin';api.status='REVIEW';api.rpc.mockReset();
 api.rpc.mockImplementation(async(_name:string,{action}:{action:string})=>{
  const b={batch_id:'test-batch',dataset:'fixture',filename:'mixed.csv',status:api.status,version:3,expected_rows:1};
  if(action==='session')return {data:{role:api.role},error:null};
  if(action==='list')return {data:[b],error:null};
  if(action==='review'){api.status='READY';return {data:{status:'READY'},error:null};}
  if(action==='inspect')return {data:{...b,received_rows:1,pending:api.status==='REVIEW'?1:0,next_offset:null,rows:[{row_index:1,raw:{MUNICIPIO:'Sta Barbara',UF:'SP',extra:'preservado'},normalized:null,status:api.status==='REVIEW'?'AGUARDANDO_REVISAO':'CORRIGIDO',resolution:{reason:'MUNICIPIO_NAO_RESOLVIDO',cod_uf:'35',candidates:[{cod_municipal:'3545803',municipio:'Santa Barbara',cod_uf:'35',score:0.8}]}}]},error:null};
  return {data:{},error:null};
 });
});
afterEach(cleanup);
describe('administrative review UI (mocked transport)',()=>{
 it('requires a selection and reason, preserves raw display, defaults alias off',async()=>{
  render(<IngestionConsole/>);
  fireEvent.click(await screen.findByRole('button',{name:'fixture / mixed.csv / REVIEW'}));
  fireEvent.click(await screen.findByRole('button',{name:'Revisar'}));
  expect(await screen.findByRole('dialog')).toHaveTextContent('preservado');
  expect(screen.getByRole('button',{name:'Confirmar correcao'})).toBeDisabled();
  expect(screen.getByLabelText('Memorizar alias municipal somente para esta fonte')).not.toBeChecked();
  fireEvent.click(screen.getByRole('radio'));
  fireEvent.change(screen.getByLabelText('Justificativa'),{target:{value:'Confirmacao humana para o teste'}});
  fireEvent.click(screen.getByRole('button',{name:'Confirmar correcao'}));
  await waitFor(()=>expect(api.rpc).toHaveBeenCalledWith('cit_ingest',expect.objectContaining({action:'review',payload:expect.objectContaining({cod_municipal:'3545803',memorize:false,version:3})})));
  expect(await screen.findByText('mixed.csv: READY')).toBeInTheDocument();
 });
 it('an account without a profile receives no controls',async()=>{
  api.role=null;render(<IngestionConsole/>);
  expect(await screen.findByText(/exclusiva do perfil tecnico/)).toBeInTheDocument();
  expect(screen.queryByRole('button',{name:'Enviar e validar'})).not.toBeInTheDocument();
  expect(api.rpc.mock.calls.some(c=>c[1].action==='list')).toBe(false);
 });
 it('a viewer receives no import controls and never lists batches',async()=>{
  api.role='viewer';render(<IngestionConsole/>);
  expect(await screen.findByText(/exclusiva do perfil tecnico/)).toBeInTheDocument();
  expect(screen.queryByRole('button',{name:'Enviar e validar'})).not.toBeInTheDocument();
  expect(api.rpc.mock.calls.some(c=>c[1].action==='list')).toBe(false);
 });
});
