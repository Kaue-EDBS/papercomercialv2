import { useEffect, useState } from 'react';

export interface PotencialMunicipio {
  municipio: string;
  domicilios_total: number;
  domicilios_classe: Record<string, number>;
  renda_classe: Record<string, number>;
  potencial: {
    matriculas_total: number;
    cursos_regulares: number;
    cursos_superiores: number;
    outros_cursos: number;
    livros_material_total: number;
    artigos_escolares: number;
    livros_didaticos: number;
    outros_livros: number;
  };
}

let cache: Record<string, PotencialMunicipio> | null = null;
let inflight: Promise<Record<string, PotencialMunicipio>> | null = null;

async function load(): Promise<Record<string, PotencialMunicipio>> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = fetch('/data/potencial_consumo.json')
    .then(r => r.json())
    .then((j: Record<string, PotencialMunicipio>) => { cache = j; inflight = null; return j; });
  return inflight;
}

/** Lookup por código IBGE (aceita 6 ou 7 dígitos). */
export function findPotencialByIBGE(data: Record<string, PotencialMunicipio> | null, codMunicipio: string): PotencialMunicipio | null {
  if (!data) return null;
  const cod = String(codMunicipio).replace(/\D/g, '');
  if (data[cod]) return data[cod];
  // fallback 6 dígitos
  const cod6 = cod.length === 7 ? cod.slice(0, 6) : cod;
  for (const k of Object.keys(data)) {
    const k6 = k.length === 7 ? k.slice(0, 6) : k;
    if (k6 === cod6) return data[k];
  }
  return null;
}

export function usePotencialConsumo() {
  const [data, setData] = useState<Record<string, PotencialMunicipio> | null>(cache);
  const [loading, setLoading] = useState(!cache);
  useEffect(() => {
    if (cache) { setData(cache); setLoading(false); return; }
    load().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);
  return { data, loading };
}
