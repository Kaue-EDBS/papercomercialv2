export interface CarteiraManifestEntry {
  arquivo: string;
  consultor: string;
  totalEscolas: number;
  gerente: string;
  codConsultor: string | number;
}

export type CarteiraManifest = Record<string, CarteiraManifestEntry>;

function norm(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

/** Fonte de dados zerada — as carteiras passarão a vir do banco. */
export function useCarteiraManifest() {
  const manifest: CarteiraManifest = {};
  const consultores: CarteiraManifestEntry[] = [];
  const findByCodigo = (_codigo: string): CarteiraManifestEntry | null => null;
  const findByNome = (_nome: string): CarteiraManifestEntry | null => null;
  return { manifest, consultores, loading: false, findByCodigo, findByNome };
}

export { norm as normalizeConsultorKey };
