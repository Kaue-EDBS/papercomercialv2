import { describe, expect, it } from 'vitest';
import { getCep5Scope } from '../lib/cep5-scope';

describe('CEP5 presentation scope', () => {
  it('shows Boa Esperanca do Norte as the whole municipality', () => {
    expect(getCep5Scope('5101837')).toEqual({
      mode: 'MUNICIPIO_INTEIRO',
      label: 'Município inteiro — sem recorte CEP5 na fonte aprovada',
    });
  });

  it('keeps ordinary municipalities on CEP5 scope', () => {
    expect(getCep5Scope('3550308')).toEqual({
      mode: 'CEP5',
      label: 'Recorte CEP5',
    });
  });
});
