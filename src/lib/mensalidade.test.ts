import { describe, it, expect } from 'vitest';
import { getMensalidadeFaixa, isMensalidadeCompativel, MENSALIDADE_ORDER } from './mensalidade';

describe('mensalidade', () => {
  it('mapeia faixas conhecidas', () => {
    expect(getMensalidadeFaixa('0')).toBe(0);
    expect(getMensalidadeFaixa('até 399')).toBe(1);
    expect(getMensalidadeFaixa('400 a 799')).toBe(2);
    expect(getMensalidadeFaixa('acima de R$ 2.400')).toBe(5);
  });

  it('devolve -1 para faixas desconhecidas', () => {
    expect(getMensalidadeFaixa('xpto')).toBe(-1);
    expect(getMensalidadeFaixa('')).toBe(-1);
  });

  it('compatibilidade: mesma faixa = compatível', () => {
    expect(isMensalidadeCompativel('400 a 799', '400 a 799')).toBe(true);
  });

  it('compatibilidade: faixas adjacentes = compatível', () => {
    expect(isMensalidadeCompativel('400 a 799', '800 a 1.399')).toBe(true);
    expect(isMensalidadeCompativel('800 a 1.399', '400 a 799')).toBe(true);
  });

  it('compatibilidade: faixas distantes = incompatível', () => {
    expect(isMensalidadeCompativel('0', '800 a 1.399')).toBe(false);
    expect(isMensalidadeCompativel('até 399', 'acima de R$ 2.400')).toBe(false);
  });

  it('compatibilidade: faixa desconhecida = permissiva', () => {
    expect(isMensalidadeCompativel('xpto', '400 a 799')).toBe(true);
  });

  it('ordem das faixas é monotônica crescente', () => {
    const values = Object.values(MENSALIDADE_ORDER);
    const sorted = [...values].sort((a, b) => a - b);
    expect(values).toEqual(sorted);
  });
});