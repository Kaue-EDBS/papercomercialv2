// Helpers para análise socioeconômica baseada em Renda × Faixa Etária por município.
export interface RendaRow {
  'Código IBGE': string | number;
  [key: string]: string | number;
}

export const FAIXAS_RENDA = ['A++', 'A+', 'B1', 'B2', 'C1', 'C2', 'D', 'E'] as const;
export type FaixaRenda = typeof FAIXAS_RENDA[number];
export const FAIXAS_ETARIAS = ['até 4', 'de 5 a 14', 'de 15 a 19'] as const;
export type FaixaEtaria = typeof FAIXAS_ETARIAS[number];

// Mapeamento de mensalidade da escola → faixas de renda aderentes (poder de compra educacional).
const MENSALIDADE_TO_FAIXAS: Record<string, FaixaRenda[]> = {
  'até 399':           ['C1', 'C2', 'D'],
  '400 a 799':         ['B2', 'C1', 'C2'],
  '800 a 1.399':       ['B1', 'B2', 'C1'],
  '1.400 a 2.399':     ['A+', 'B1', 'B2'],
  'acima de R$ 2.400': ['A++', 'A+', 'B1'],
};

export function findRendaByIBGE(rendaData: RendaRow[], codMunicipio: string): RendaRow | null {
  const cod = String(codMunicipio).replace(/\D/g, '');
  const cod6 = cod.length === 7 ? cod.slice(0, 6) : cod;
  return rendaData.find(r => {
    const ibge = String(r['Código IBGE']).replace(/\D/g, '');
    const ibge6 = ibge.length === 7 ? ibge.slice(0, 6) : ibge;
    return ibge6 === cod6;
  }) || null;
}

/** Matriz Renda × Faixa Etária (valores em milhares conforme base). */
export function buildMatrix(row: RendaRow): { faixa: FaixaRenda; total: number; ate4: number; de5a14: number; de15a19: number }[] {
  return FAIXAS_RENDA.map(f => ({
    faixa: f,
    total:    Number(row[`${f}_total`]) || 0,
    ate4:     Number(row[`${f}_até 4`]) || 0,
    de5a14:   Number(row[`${f}_de 5 a 14`]) || 0,
    de15a19:  Number(row[`${f}_de 15 a 19`]) || 0,
  }));
}

/** Faixas aderentes ao ticket atual da escola. */
export function getFaixasAderentes(mensalidade: string): FaixaRenda[] {
  return MENSALIDADE_TO_FAIXAS[mensalidade] || [];
}

/** Indicador sintético de aderência econômica (0–100): % do volume populacional 0-19 nas faixas aderentes. */
export function calcAderenciaEconomica(matrix: ReturnType<typeof buildMatrix>, mensalidade: string): number {
  const aderentes = new Set(getFaixasAderentes(mensalidade));
  if (aderentes.size === 0) return 0;
  let total = 0, aderente = 0;
  for (const r of matrix) {
    const pop = r.ate4 + r.de5a14 + r.de15a19;
    total += pop;
    if (aderentes.has(r.faixa)) aderente += pop;
  }
  return total > 0 ? (aderente / total) * 100 : 0;
}

export function classificarAderencia(pct: number): { label: string; tone: 'teal' | 'lime' | 'navy' } {
  if (pct >= 30) return { label: 'Alta aderência', tone: 'teal' };
  if (pct >= 15) return { label: 'Aderência moderada', tone: 'lime' };
  return { label: 'Baixa aderência', tone: 'navy' };
}
