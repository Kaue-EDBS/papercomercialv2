import { useEffect, useState } from 'react';

export interface CarteiraFile {
  consultor: string;
  headers: string[];
  rows: Record<string, string | number | boolean | null>[];
}

const cache = new Map<string, CarteiraFile>();
const inflight = new Map<string, Promise<CarteiraFile>>();

/** Dispara o download em background (sem montar componente). Idempotente. */
export function prefetchCarteira(arquivo: string | null | undefined) {
  if (!arquivo) return;
  if (cache.has(arquivo) || inflight.has(arquivo)) return;
  const p = fetch(`/data/carteiras/${arquivo}`)
    .then(r => { if (!r.ok) throw new Error('not found'); return r.json(); })
    .then((d: CarteiraFile) => { cache.set(arquivo, d); inflight.delete(arquivo); return d; })
    .catch(e => { inflight.delete(arquivo); throw e; });
  inflight.set(arquivo, p);
}

/**
 * Carrega o XLS individual (convertido para JSON) do consultor selecionado.
 * `arquivo` vem do manifest (ex.: "adailton_da_silva_angelim.json").
 */
export function useCarteira(arquivo: string | null) {
  const [data, setData] = useState<CarteiraFile | null>(arquivo ? cache.get(arquivo) ?? null : null);
  const [loading, setLoading] = useState(!!arquivo && !cache.has(arquivo));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!arquivo) { setData(null); setLoading(false); setError(null); return; }
    const cached = cache.get(arquivo);
    if (cached) { setData(cached); setLoading(false); setError(null); return; }
    setLoading(true); setError(null);
    fetch(`/data/carteiras/${arquivo}`)
      .then(r => {
        if (!r.ok) throw new Error('Arquivo não encontrado');
        return r.json();
      })
      .then((d: CarteiraFile) => {
        cache.set(arquivo, d);
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError('Não conseguimos abrir sua carteira. Fale com seu gestor para verificar o arquivo.');
        setLoading(false);
      });
  }, [arquivo]);

  return { data, loading, error };
}