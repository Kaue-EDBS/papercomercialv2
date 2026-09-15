import { render, screen, fireEvent } from '@testing-library/react';
import { describe,it,expect,vi } from 'vitest';
import App from '../App';
vi.mock('../features/ingestion/IngestionConsole',()=>({default:()=> <p>Console autenticado</p>}));
describe('foundation screen',()=>{
 it('shows loaded geography without pretending to be live',async()=>{render(<App/>);expect(screen.getByText(/Fundacao geografica carregada/)).toBeInTheDocument();expect(screen.getByText(/snapshot, nao uma consulta/)).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Abrir console administrativo'}));expect(await screen.findByText('Console autenticado')).toBeInTheDocument();});
});
