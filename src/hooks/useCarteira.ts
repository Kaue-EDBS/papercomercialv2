export interface CarteiraFile {
  consultor: string;
  headers: string[];
  rows: Record<string, string | number | boolean | null>[];
}

/** Fonte de dados zerada — a carteira passará a vir do banco. */
export function prefetchCarteira(_arquivo: string | null | undefined) {
  /* no-op enquanto não há fonte de dados */
}

export function useCarteira(_arquivo: string | null) {
  const data: CarteiraFile | null = null;
  return { data, loading: false, error: null as string | null };
}
