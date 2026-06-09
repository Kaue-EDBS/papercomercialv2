import { describe, it, expect } from 'vitest';
import { runAnalysis, formatNumber, formatPercent, formatDistance, getSegmentosLabel } from './analysis';
import type { EscolaData, DemograficaData } from './types';

function esc(over: Partial<EscolaData> = {}): EscolaData {
  return {
    Ano: '2024', UF: 'SP', Município: 'São Paulo', 'Código Município': '3550308',
    Escola: 'Escola Teste', 'Código Inep': '11111111',
    Latitude: '-23.55', Longitude: '-46.63',
    'Tipo de Adoção': '', Mensalidade: '400 a 799', 'Perfil Socioeconômico': '',
    Endereço: '', Número: '', Complemento: '', Bairro: '', CEP: '01000000',
    qt_mat_educacao_infantil: '100',
    qt_mat_ensino_fundamental_anos_iniciais: '200',
    qt_mat_ensino_fundamental_anos_finais: '0',
    qt_mat_ensino_medio: '0',
    'Alunado Total': '300', 'Adota Brasil': '',
    ...over,
  };
}

const demo: DemograficaData[] = [{
  'Código IBGE': '3550308', 'Municípios': 'São Paulo', 'Estado': 'SP',
  'Microrregião': '', 'Mesorregião': '', 'Região Geográfica': '',
  'Área KM²': '1521,11', 'População': '12000000', 'Densidade Demográfica': '',
  'Domicílios por Faixa de Renda': '', 'Domicílios': '',
  'PIB Total (R$ mil)': '', 'PIB per Capita Total': '',
  'IDH - Índice de Desenv. Humano': '', 'Renda Média': '',
  'IDH - Dimensão Educação Classificação': '', 'IDH - Dimensão Renda Classificação': '',
  'População por Faixa Etária (2025) - 0 a 4 anos': '',
  'População por Faixa Etária (2025) - 5 a 9 anos': '',
  'População por Faixa Etária (2025) - 10 a 14 anos': '',
  'População por Faixa Etária (2025) - 15 a 19 anos': '',
  'População por Faixa Etária (2024) - 0 a 4 anos': '',
  'População por Faixa Etária (2024) - 5 a 9 anos': '',
  'População por Faixa Etária (2024) - 10 a 14 anos': '',
  'População por Faixa Etária (2024) - 15 a 19 anos': '',
  'Faixa Pop. Trabalha': '',
}];

describe('runAnalysis', () => {
  const escola = esc();
  const concSim = esc({ 'Código Inep': '22222222', Escola: 'Conc A', Latitude: '-23.56', Longitude: '-46.64', 'Alunado Total': '100', qt_mat_educacao_infantil: '50', qt_mat_ensino_fundamental_anos_iniciais: '50' });
  const concIncompat = esc({ 'Código Inep': '33333333', Escola: 'Conc Caro', Mensalidade: 'acima de R$ 2.400', Latitude: '-23.555', Longitude: '-46.635', 'Alunado Total': '999' });
  const censo: EscolaData[] = [escola, concSim, concIncompat];

  it('encontra a escola e calcula concorrentes elegíveis', () => {
    const r = runAnalysis('11111111', censo, demo, null);
    expect(r).not.toBeNull();
    expect(r!.escola['Código Inep']).toBe('11111111');
    // só concSim entra (concIncompat é incompatível por mensalidade)
    expect(r!.concorrentes.length).toBe(1);
    expect(r!.concorrentes[0].escola['Código Inep']).toBe('22222222');
  });

  it('calcula market share geral coerente', () => {
    const r = runAnalysis('11111111', censo, demo, null)!;
    // escola=300, conc=100 → 75%
    expect(r.marketShare.geral).toBeCloseTo(75, 1);
  });

  it('retorna null quando INEP não existe', () => {
    expect(runAnalysis('99999999', censo, demo, null)).toBeNull();
  });

  it('cacheia resultados idênticos (mesma referência)', () => {
    const a = runAnalysis('11111111', censo, demo, null);
    const b = runAnalysis('11111111', censo, demo, null);
    expect(a).toBe(b);
  });
});

describe('formatters', () => {
  it('formatNumber usa pt-BR', () => {
    expect(formatNumber(1234567)).toBe('1.234.567');
  });
  it('formatPercent usa vírgula', () => {
    expect(formatPercent(12.34)).toBe('12,3%');
  });
  it('formatDistance usa km com vírgula', () => {
    expect(formatDistance(3.456)).toBe('3,5 km');
  });
  it('getSegmentosLabel lista segmentos com matrícula', () => {
    expect(getSegmentosLabel(esc())).toBe('EI, EFI');
    expect(getSegmentosLabel(esc({
      qt_mat_educacao_infantil: '0',
      qt_mat_ensino_fundamental_anos_iniciais: '0',
    }))).toBe('Nenhum');
  });
});