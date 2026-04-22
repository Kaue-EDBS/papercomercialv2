import { useState, useEffect } from 'react';
import { SetorizacaoRow } from '@/lib/types';

let cache: SetorizacaoRow[] | null = null;
let pending: Promise<SetorizacaoRow[]> | null = null;

export function useSetorizacao(load: boolean) {
  const [data, setData] = useState<SetorizacaoRow[]>(cache || []);
  const [loading, setLoading] = useState(load && !cache);

  useEffect(() => {
    if (!load) return;
    if (cache) { setData(cache); setLoading(false); return; }
    setLoading(true);
    if (!pending) {
      pending = fetch('/data/setorizacao_2026.json').then(r => r.json());
    }
    pending.then((d: SetorizacaoRow[]) => {
      cache = d;
      setData(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [load]);

  return { rows: data, loading };
}
