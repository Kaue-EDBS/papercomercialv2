import { RendaRow } from '@/lib/socioeconomico';

/** Fonte de dados zerada — renda por faixa etária virá do banco. */
export function useRendaFaixaEtaria() {
  const data: RendaRow[] = [];
  return { data, loading: false };
}
