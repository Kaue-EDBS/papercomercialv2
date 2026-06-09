/**
 * Skeleton mostrado enquanto o censo/demografia da rota /apresentacao/:inep
 * é baixado. Substitui o spinner vazio por blocos cinzas que dão sensação
 * de progresso e preservam o layout final (header + título + grid de KPIs).
 */
export default function ApresentacaoSkeleton() {
  return (
    <div className="flex-1 px-6 py-10 max-w-6xl mx-auto w-full animate-pulse">
      <div className="h-3 w-24 bg-muted rounded mb-3" />
      <div className="h-8 w-2/3 bg-muted rounded mb-4" />
      <div className="h-4 w-1/3 bg-muted/70 rounded mb-10" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
            <div className="h-3 w-20 bg-muted rounded" />
            <div className="h-7 w-24 bg-muted rounded" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border bg-card p-6 space-y-3 mb-6">
        <div className="h-4 w-1/4 bg-muted rounded" />
        <div className="h-3 w-full bg-muted/70 rounded" />
        <div className="h-3 w-11/12 bg-muted/70 rounded" />
        <div className="h-3 w-9/12 bg-muted/70 rounded" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="h-48 rounded-lg border bg-card" />
        <div className="h-48 rounded-lg border bg-card" />
      </div>
      <p className="text-center text-xs text-muted-foreground mt-8">Carregando apresentação…</p>
    </div>
  );
}