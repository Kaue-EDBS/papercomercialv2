import { useState, useEffect } from 'react';
import { EscolaData, DemograficaData } from '@/lib/types';

let cachedCenso: EscolaData[] | null = null;
let cachedDemo: DemograficaData[] | null = null;

export function useDataLoader() {
  const [censo, setCenso] = useState<EscolaData[]>(cachedCenso || []);
  const [demo, setDemo] = useState<DemograficaData[]>(cachedDemo || []);
  const [loading, setLoading] = useState(!cachedCenso);

  useEffect(() => {
    if (cachedCenso && cachedDemo) {
      setCenso(cachedCenso);
      setDemo(cachedDemo);
      setLoading(false);
      return;
    }

    Promise.all([
      fetch('/data/censo_escolar.json').then(r => r.json()),
      fetch('/data/base_demografica.json').then(r => r.json()),
    ]).then(([c, d]) => {
      cachedCenso = c;
      cachedDemo = d;
      setCenso(c);
      setDemo(d);
      setLoading(false);
    });
  }, []);

  return { censo, demo, loading };
}
