import { EscolaData, DemograficaData, AnalysisResult, ConcorrenteInfo, MarketShareData } from './types';

const MENSALIDADE_ORDER: Record<string, number> = {
  '0': 0,
  'até 399': 1,
  '400 a 799': 2,
  '800 a 1.399': 3,
  '1.400 a 2.399': 4,
  'acima de R$ 2.400': 5,
};

function parseBrNumber(val: string): number {
  if (!val) return 0;
  return parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
}

function getSegmentos(e: EscolaData): string[] {
  const s: string[] = [];
  if (num(e.qt_mat_educacao_infantil) > 0) s.push('EI');
  if (num(e.qt_mat_ensino_fundamental_anos_iniciais) > 0) s.push('EFI');
  if (num(e.qt_mat_ensino_fundamental_anos_finais) > 0) s.push('EFII');
  if (num(e.qt_mat_ensino_medio) > 0) s.push('EM');
  return s;
}

function num(v: string | number | undefined): number {
  if (v === undefined || v === null || v === '') return 0;
  return typeof v === 'number' ? v : (parseInt(String(v), 10) || 0);
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getMensalidadeFaixa(m: string): number {
  return MENSALIDADE_ORDER[m] ?? -1;
}

function isMensalidadeCompativel(escolaM: string, concM: string): boolean {
  const eF = getMensalidadeFaixa(escolaM);
  const cF = getMensalidadeFaixa(concM);
  if (eF < 0 || cF < 0) return true; // if unknown, include
  return Math.abs(eF - cF) <= 1;
}

function calcDensidadeEscolar(escolasMunicipio: number, areaKm2: number): number {
  if (areaKm2 <= 0) return 0;
  return escolasMunicipio / areaKm2;
}

function calcRaioOperacional(densidade: number): number {
  if (densidade >= 10) return 2;
  if (densidade >= 5) return 4;
  if (densidade >= 2) return 6;
  if (densidade >= 0.8) return 8;
  return 10;
}

export function runAnalysis(
  codigoInep: string,
  censoData: EscolaData[],
  demoData: DemograficaData[],
  customRadiusKm?: number | null
): AnalysisResult | null {
  const escola = censoData.find(e => String(e['Código Inep']) === String(codigoInep));
  if (!escola) return null;

  const codMun = String(escola['Código Município']);
  const escolasMunicipio = censoData.filter(e => String(e['Código Município']) === codMun);

  // Relacionamento entre bases exclusivamente pelo código do município
  const codMunClean = codMun.replace(/\D/g, '');
  const demografica = demoData.find(d => {
    const ibge = String(d['Código IBGE']).replace(/\D/g, '');
    // Normaliza para 6 dígitos (remove dígito verificador se houver)
    const ibge6 = ibge.length === 7 ? ibge.slice(0, 6) : ibge;
    const cod6 = codMunClean.length === 7 ? codMunClean.slice(0, 6) : codMunClean;
    return ibge6 === cod6;
  }) || null;

  const areaKm2 = demografica ? parseBrNumber(demografica['Área KM²']) : 0;
  const densidadeEscolar = calcDensidadeEscolar(escolasMunicipio.length, areaKm2);
  const raioOperacional = customRadiusKm && customRadiusKm > 0 ? customRadiusKm : calcRaioOperacional(densidadeEscolar);
  const raioCustom = customRadiusKm && customRadiusKm > 0 ? customRadiusKm : null;

  // Get school segments and mensalidade
  const escolaSegmentos = getSegmentos(escola);
  const escolaCEP = String(escola.CEP || '').slice(0, 3);
  const escolaLat = parseFloat(String(escola.Latitude));
  const escolaLon = parseFloat(String(escola.Longitude));
  const hasCoords = !isNaN(escolaLat) && !isNaN(escolaLon);

  // Filter eligible competitors
  type ScoredCompetitor = {
    escola: EscolaData;
    distancia: number | null;
    proximidadeCEP: boolean;
    segmentosComum: string[];
    score: number;
  };

  const candidates: ScoredCompetitor[] = [];

  for (const e of escolasMunicipio) {
    if (String(e['Código Inep']) === String(codigoInep)) continue;

    // Check mensalidade compatibility
    if (!isMensalidadeCompativel(escola.Mensalidade, e.Mensalidade)) continue;

    // Check at least 1 segment in common
    const eSegmentos = getSegmentos(e);
    const segComum = escolaSegmentos.filter(s => eSegmentos.includes(s));
    if (segComum.length === 0) continue;

    // Calculate distance or CEP proximity
    const eLat = parseFloat(String(e.Latitude));
    const eLon = parseFloat(String(e.Longitude));
    const eHasCoords = !isNaN(eLat) && !isNaN(eLon);

    let distancia: number | null = null;
    let proximidadeCEP = false;

    if (hasCoords && eHasCoords) {
      distancia = haversine(escolaLat, escolaLon, eLat, eLon);
    } else {
      // CEP proxy
      const eCEP = String(e.CEP || '').slice(0, 3);
      proximidadeCEP = eCEP === escolaCEP;
    }

    // Score for prioritization
    let geoScore = 0;
    if (distancia !== null) {
      geoScore = Math.max(0, 100 - distancia * 5);
    } else if (proximidadeCEP) {
      geoScore = 50;
    } else {
      geoScore = 10;
    }

    const mensalidadeMatch = getMensalidadeFaixa(escola.Mensalidade) === getMensalidadeFaixa(e.Mensalidade) ? 30 : 0;
    const segScore = segComum.length * 15;
    const alunadoScore = Math.min(num(e['Alunado Total']) / 50, 20);

    candidates.push({
      escola: e,
      distancia,
      proximidadeCEP,
      segmentosComum: segComum,
      score: geoScore + mensalidadeMatch + segScore + alunadoScore,
    });
  }

  // Sort and take top 15
  candidates.sort((a, b) => b.score - a.score);
  const concorrentes: ConcorrenteInfo[] = candidates.slice(0, 15).map(c => ({
    escola: c.escola,
    distancia: c.distancia,
    proximidadeCEP: c.proximidadeCEP,
    segmentosComum: c.segmentosComum,
  }));

  // Calculate market share
  const escolaTotal = num(escola['Alunado Total']);
  const concTotal = concorrentes.reduce((sum, c) => sum + num(c.escola['Alunado Total']), 0);
  const universo = escolaTotal + concTotal;

  const calcMS = (field: keyof EscolaData) => {
    const escolaVal = num(escola[field] as string);
    const concVal = concorrentes.reduce((s, c) => s + num(c.escola[field] as string), 0);
    const total = escolaVal + concVal;
    return total > 0 ? (escolaVal / total) * 100 : 0;
  };

  const marketShare: MarketShareData = {
    geral: universo > 0 ? (escolaTotal / universo) * 100 : 0,
    ei: calcMS('qt_mat_educacao_infantil'),
    efi: calcMS('qt_mat_ensino_fundamental_anos_iniciais'),
    efii: calcMS('qt_mat_ensino_fundamental_anos_finais'),
    em: calcMS('qt_mat_ensino_medio'),
  };

  return {
    escola,
    demografica,
    densidadeEscolar,
    raioOperacional,
    raioCustom,
    concorrentes,
    escolasMunicipio,
    marketShare,
  };
}

export function formatNumber(n: number): string {
  return n.toLocaleString('pt-BR');
}

export function formatPercent(n: number): string {
  return n.toFixed(1).replace('.', ',') + '%';
}

export function formatDistance(d: number): string {
  return d.toFixed(1).replace('.', ',') + ' km';
}

export function getSegmentosLabel(e: EscolaData): string {
  return getSegmentos(e).join(', ') || 'Nenhum';
}

export { getSegmentos, num, parseBrNumber, getMensalidadeFaixa };
