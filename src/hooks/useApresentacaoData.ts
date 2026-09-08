import { EscolaData, DemograficaData } from '@/lib/types';

export type ApresentacaoDataState =
  | { status: 'loading'; censo: EscolaData[]; demo: DemograficaData[] }
  | { status: 'not-found'; censo: EscolaData[]; demo: DemograficaData[] }
  | { status: 'ready'; censo: EscolaData[]; demo: DemograficaData[] };

/** Fonte de dados zerada — censo e demográfica passarão a vir do banco. */
export function useApresentacaoData(_inep: string): ApresentacaoDataState {
  return { status: 'not-found', censo: [], demo: [] };
}
