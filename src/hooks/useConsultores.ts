import { useState, useEffect } from 'react';
import { Consultor } from '@/lib/types';

let cache: Consultor[] | null = null;

export function useConsultores() {
  const [data, setData] = useState<Consultor[]>(cache || []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) { setData(cache); setLoading(false); return; }
    fetch('/data/base_consultores.json')
      .then(r => r.json())
      .then((d: Consultor[]) => {
        cache = d;
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { consultores: data, loading };
}
