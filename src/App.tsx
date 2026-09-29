import { lazy, Suspense, useState, type ReactNode } from 'react';
import { BrowserRouter, Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAccess } from './auth/access';
import GeographicAnalysis from './features/geographic-analysis/GeographicAnalysis';
const IngestionConsole = lazy(() => import('./features/ingestion/IngestionConsole'));

// F01: admin reaches every route; viewer only the geographic analysis. The server enforces the same rule.
export const ROUTES = { geographicAnalysis: '/analise-geografica', foundation: '/fundacao' } as const;

const Shell = ({ children }: { children: ReactNode }) => {
 const { role, email } = useAccess();
 const link = ({ isActive }: { isActive: boolean }) => `rounded px-3 py-2 text-sm ${isActive ? 'bg-muted font-semibold' : ''}`;
 return <main className="min-h-screen bg-background text-foreground px-6 py-12"><section className="mx-auto w-full max-w-5xl rounded-2xl border bg-card p-8 shadow-sm">
 <header className="mb-8 flex flex-wrap items-center justify-between gap-3"><nav className="flex gap-2" aria-label="Principal"><NavLink className={link} to={ROUTES.geographicAnalysis}>Analise geografica</NavLink>{role==='admin'&&<NavLink className={link} to={ROUTES.foundation}>Fundacao e ingestao</NavLink>}</nav>
 <div className="flex items-center gap-3 text-sm text-muted-foreground"><span>{email}</span><button className="rounded border px-3 py-2" onClick={()=>void supabase.auth.signOut()}>Sair</button></div></header>
 {children}
 </section></main>;
};

const Foundation = () => {
 const [admin, setAdmin] = useState(false);
 return <>
 <p className="text-sm font-semibold uppercase tracking-widest text-primary">CIT / Paper Comercial V2</p><h1 className="mt-3 text-3xl font-bold">Fundacao geografica carregada</h1>
 <p className="mt-4 leading-7 text-muted-foreground">DTB 2025 e associacoes Municipio + CEP5 estao carregados. Os modulos comerciais permanecem em reconstrucao, sem recuperar regras legadas.</p>
 <p className="mt-4 text-sm">Referencia da carga homologada de 15/09/2026: 5.571 municipios, 10.751 distritos, 646 subdistritos e 24.905 associacoes CEP5. Estes numeros sao um snapshot, nao uma consulta em tempo real.</p>
 <div className="mt-6 grid gap-4 md:grid-cols-3"><article className="rounded border p-4"><strong>GitHub</strong><p>Codigo, contratos e mudancas versionadas.</p></article><article className="rounded border p-4"><strong>PRIMARY</strong><p>Banco operacional no Lovable Cloud.</p></article><article className="rounded border p-4"><strong>REPLICA</strong><p>Copia independente; reconciliacao exige verificacao.</p></article></div>
 <button className="my-6 rounded border px-4 py-2" onClick={()=>setAdmin(x=>!x)}>{admin?'Fechar console':'Abrir console administrativo'}</button>
 {admin&&<Suspense fallback={<p>Carregando console...</p>}><IngestionConsole/></Suspense>}
 </>;
};

export const AppRoutes = () => {
 const { role } = useAccess();
 const home = role==='admin' ? ROUTES.foundation : ROUTES.geographicAnalysis;
 return <Routes>
  <Route path={ROUTES.geographicAnalysis} element={<Shell><GeographicAnalysis/></Shell>}/>
  <Route path={ROUTES.foundation} element={role==='admin' ? <Shell><Foundation/></Shell> : <Navigate to={ROUTES.geographicAnalysis} replace/>}/>
  <Route path="*" element={<Navigate to={home} replace/>}/>
 </Routes>;
};

const App = () => <BrowserRouter><AppRoutes/></BrowserRouter>;
export default App;
