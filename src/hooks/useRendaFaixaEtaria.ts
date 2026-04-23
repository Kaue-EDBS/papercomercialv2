import { useEffect, useState } from 'react';
import { RendaRow } from '@/lib/socioeconomico';

let cache: RendaRow[] | null = null;

export function useRendaFaixaEtaria() {
  const [data, setData] = useState<RendaRow[]>(cache || []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) { setData(cache); setLoading(false); return; }
    fetch('/data/renda_faixa_etaria.json')
      .then(r => r.json())
      .then((d: RendaRow[]) => { cache = d; setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return { data, loading };
}
