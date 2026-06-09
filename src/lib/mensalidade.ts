/**
 * Helpers centralizados para faixas de mensalidade.
 * Antes estavam espalhados em analysis.ts; agora ficam num módulo único
 * para facilitar manutenção (alterar regra em um lugar só).
 */

export const MENSALIDADE_ORDER: Record<string, number> = {
  '0': 0,
  'até 399': 1,
  '400 a 799': 2,
  '800 a 1.399': 3,
  '1.400 a 2.399': 4,
  'acima de R$ 2.400': 5,
};

export function getMensalidadeFaixa(m: string): number {
  return MENSALIDADE_ORDER[m] ?? -1;
}

export function isMensalidadeCompativel(escolaM: string, concM: string): boolean {
  const eF = getMensalidadeFaixa(escolaM);
  const cF = getMensalidadeFaixa(concM);
  if (eF < 0 || cF < 0) return true;
  return Math.abs(eF - cF) <= 1;
}