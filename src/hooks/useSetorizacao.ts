import { SetorizacaoRow } from '@/lib/types';

/**
 * Fonte de dados zerada — a setorização passará a vir do banco (tabela de carteiras).
 * Assinatura mantida para as telas continuarem funcionando com estado vazio.
 */
export function useSetorizacao(_load: boolean) {
  const rows: SetorizacaoRow[] = [];
  return { rows, loading: false };
}
