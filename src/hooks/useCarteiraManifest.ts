import { useEffect, useMemo, useState } from 'react';

export interface CarteiraManifestEntry {
  arquivo: string;
  consultor: string;
  totalEscolas: number;
  gerente: string;
  codConsultor: string | number;
}

export type CarteiraManifest = Record<string, CarteiraManifestEntry>;

let cache: CarteiraManifest | null = null;
let pending: Promise<CarteiraManifest> | null = null;

function norm(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

/**
 * Manifest dos arquivos individuais de carteira (um JSON por consultor).
 * Substitui o filtro amplo na base geral.
 */
export function useCarteiraManifest() {
  const [data, setData] = useState<CarteiraManifest>(cache || {});
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) { setData(cache); setLoading(false); return; }
    if (!pending) {
      pending = fetch('/data/carteiras/manifest.json').then(r => r.json());
    }
    pending
      .then((d: CarteiraManifest) => { cache = d; setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const consultores = useMemo(() => Object.values(data), [data]);

  /** Procura por código Protheus exato. */
  const findByCodigo = (codigo: string): CarteiraManifestEntry | null => {
    const c = String(codigo).trim().toUpperCase();
    if (!c) return null;
    return (
      consultores.find(x => String(x.codConsultor).trim().toUpperCase() === c) || null
    );
  };

  /** Procura por chave normalizada do nome (para uso pós-validação). */
  const findByNome = (nome: string): CarteiraManifestEntry | null => {
    const k = norm(nome);
    return data[k] || consultores.find(x => norm(x.consultor) === k) || null;
  };

  return { manifest: data, consultores, loading, findByCodigo, findByNome };
}

export { norm as normalizeConsultorKey };