import { EscolaData, DemograficaData } from '@/lib/types';

/** Fonte de dados zerada — censo e base demográfica passarão a vir do banco. */
export function useDataLoader() {
  const censo: EscolaData[] = [];
  const demo: DemograficaData[] = [];
  return { censo, demo, loading: false };
}
