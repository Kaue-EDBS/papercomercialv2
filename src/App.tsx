const App = () => (
  <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-12">
    <section className="w-full max-w-3xl rounded-2xl border bg-card p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Paper Comercial V2</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">Fundação técnica ativa</h1>
      <p className="mt-4 text-base leading-7 text-muted-foreground">
        A aplicação foi neutralizada para a reconstrução V2. Nenhuma regra de negócio, fórmula comercial,
        fluxo de decisão ou dataset de negócio está ativo nesta branch.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border p-4"><strong>GitHub</strong><p className="mt-1 text-sm text-muted-foreground">Fonte oficial de código, DDL, contratos e decisões versionadas.</p></div>
        <div className="rounded-xl border p-4"><strong>PRIMARY</strong><p className="mt-1 text-sm text-muted-foreground">Lovable Cloud, atualmente somente com a fundação técnica V2.</p></div>
        <div className="rounded-xl border p-4"><strong>REPLICA</strong><p className="mt-1 text-sm text-muted-foreground">Supabase externo para cópia e auditoria unidirecional.</p></div>
      </div>
      <p className="mt-8 text-sm text-muted-foreground">Próximo passo: definir o primeiro domínio somente após fonte, contrato, chaves e QA serem aprovados.</p>
    </section>
  </main>
);

export default App;
