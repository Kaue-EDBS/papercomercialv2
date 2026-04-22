import { useMemo } from 'react';
import { useSetorizacao } from './useSetorizacao';

export interface ConsultorSetor {
  codigos: string[];      // todos os códigos protheus (1+) atribuídos a esse consultor
  nome: string;
  gestor: string;
  carteiraSize: number;   // total de escolas
}

/**
 * Lista de consultores extraída diretamente da Setorização 2026
 * (fonte da verdade da carteira). Agrupa códigos pelo NOME do consultor.
 */
export function useConsultoresFromSetor() {
  const { rows, loading } = useSetorizacao(true);

  const consultores = useMemo<ConsultorSetor[]>(() => {
    if (!rows.length) return [];
    const map = new Map<string, ConsultorSetor>();
    for (const r of rows) {
      const cod = String(r['COD CONSULTOR'] ?? '').trim();
      const nome = String(r['CONSULTOR'] ?? '').trim();
      const gestor = String(r['GERENTE'] ?? '').trim();
      if (!cod || !nome || cod.toLowerCase() === 'nan') continue;
      const key = nome.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        if (!existing.codigos.includes(cod)) existing.codigos.push(cod);
        existing.carteiraSize += 1;
      } else {
        map.set(key, { codigos: [cod], nome, gestor, carteiraSize: 1 });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [rows]);

  /** Procura um consultor por código (qualquer um dos códigos atribuídos a ele). */
  const findByCodigo = (codigo: string): ConsultorSetor | null => {
    const c = codigo.trim().toUpperCase();
    if (!c) return null;
    return consultores.find(x => x.codigos.some(k => k.toUpperCase() === c)) || null;
  };

  return { consultores, loading, findByCodigo };
}