import { lazy, Suspense, useState } from 'react';
const IngestionConsole = lazy(() => import('./features/ingestion/IngestionConsole'));
const App = () => {
 const [admin, setAdmin] = useState(false);
 return <main className="min-h-screen bg-background text-foreground px-6 py-12"><section className="mx-auto w-full max-w-5xl rounded-2xl border bg-card p-8 shadow-sm">
 <p className="text-sm font-semibold uppercase tracking-widest text-primary">CIT / Paper Comercial V2</p><h1 className="mt-3 text-3xl font-bold">Fundacao geografica carregada</h1>
 <p className="mt-4 leading-7 text-muted-foreground">DTB 2025 e associacoes Municipio + CEP5 estao carregados. Os modulos comerciais permanecem em reconstrucao, sem recuperar regras legadas.</p>
 <p className="mt-4 text-sm">Referencia da carga homologada de 15/09/2026: 5.571 municipios, 10.751 distritos, 646 subdistritos e 24.905 associacoes CEP5. Estes numeros sao um snapshot, nao uma consulta em tempo real.</p>
 <div className="mt-6 grid gap-4 md:grid-cols-3"><article className="rounded border p-4"><strong>GitHub</strong><p>Codigo, contratos e mudancas versionadas.</p></article><article className="rounded border p-4"><strong>PRIMARY</strong><p>Banco operacional no Lovable Cloud.</p></article><article className="rounded border p-4"><strong>REPLICA</strong><p>Copia independente; reconciliacao exige verificacao.</p></article></div>
 <button className="my-6 rounded border px-4 py-2" onClick={()=>setAdmin(x=>!x)}>{admin?'Fechar console':'Abrir console administrativo'}</button>
 {admin&&<Suspense fallback={<p>Carregando console...</p>}><IngestionConsole/></Suspense>}
 </section></main>;
};
export default App;
