import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe,it,expect,vi } from 'vitest';
import { AppRoutes } from '../App';
import { AccessContext, type Role } from '../auth/access';
vi.mock('../features/ingestion/IngestionConsole',()=>({default:()=> <p>Console autenticado</p>}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{auth:{signOut:async()=>({error:null})}}}));
const renderAt=(role:Role,path:string)=>render(<AccessContext.Provider value={{role,email:`${role}@editoradobrasil.com.br`}}><MemoryRouter initialEntries={[path]}><AppRoutes/></MemoryRouter></AccessContext.Provider>);
describe('foundation screen',()=>{
 it('shows loaded geography without pretending to be live',async()=>{renderAt('admin','/');expect(screen.getByText(/Fundacao geografica carregada/)).toBeInTheDocument();expect(screen.getByText(/snapshot, nao uma consulta/)).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Abrir console administrativo'}));expect(await screen.findByText('Console autenticado')).toBeInTheDocument();});
});
describe('routes by profile (F01)',()=>{
 it('admin reaches every route',()=>{renderAt('admin','/analise-geografica');expect(screen.getByRole('heading',{name:'Analise geografica'})).toBeInTheDocument();expect(screen.getByRole('link',{name:'Fundacao e ingestao'})).toBeInTheDocument();});
 it('viewer lands on the geographic analysis',()=>{renderAt('viewer','/');expect(screen.getByRole('heading',{name:'Analise geografica'})).toBeInTheDocument();});
 it('viewer is redirected away from the foundation and never sees the console',()=>{renderAt('viewer','/fundacao');expect(screen.getByRole('heading',{name:'Analise geografica'})).toBeInTheDocument();expect(screen.queryByText(/Fundacao geografica carregada/)).not.toBeInTheDocument();expect(screen.queryByRole('link',{name:'Fundacao e ingestao'})).not.toBeInTheDocument();expect(screen.queryByRole('button',{name:'Abrir console administrativo'})).not.toBeInTheDocument();});
});
