import { Consultor } from '@/lib/types';

/** Fonte de dados zerada — os consultores passarão a vir do banco. */
export function useConsultores() {
  const consultores: Consultor[] = [];
  return { consultores, loading: false };
}
