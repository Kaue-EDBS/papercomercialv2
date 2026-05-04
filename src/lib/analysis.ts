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

/**
 * Reconstrói a lista de concorrentes para uma escola, permitindo:
 * - injeção de "concorrentes essenciais" (selecionados manualmente pelo usuário) que SEMPRE entram;
 * - completar até 15 vagas com candidatos elegíveis priorizados por:
 *   1) maior proximidade geográfica dentro do raio (ou estimativa por CEP);
 *   2) mesma faixa de mensalidade;
 *   3) maior número de segmentos em comum;
 *   4) maior alunado total.
 * - sobrescrita opcional do raio (em km).
 */
export function rebuildConcorrentes(
  base: AnalysisResult,
  censoData: EscolaData[],
  options: { essenciaisInep?: string[]; raioKm?: number; max?: number } = {}
): AnalysisResult {
  const { escola, escolasMunicipio } = base;
  const max = options.max ?? 15;
  const raio = options.raioKm ?? base.raioOperacional;
  const essenciaisSet = new Set((options.essenciaisInep || []).map(String));

  const escolaSegmentos = getSegmentos(escola);
  const escolaCEP = String(escola.CEP || '').slice(0, 3);
  const escolaLat = parseFloat(String(escola.Latitude));
  const escolaLon = parseFloat(String(escola.Longitude));
  const hasCoords = !isNaN(escolaLat) && !isNaN(escolaLon);

  type Cand = ConcorrenteInfo & { _proxRank: number; _faixaMatch: number; _segCount: number; _alunado: number; _essencial: boolean };

  // Pool: município + qualquer essencial fora do município (busca em censoData)
  const pool: EscolaData[] = [...escolasMunicipio];
  for (const inep of essenciaisSet) {
    if (!pool.some(e => String(e['Código Inep']) === inep)) {
      const ext = censoData.find(e => String(e['Código Inep']) === inep);
      if (ext) pool.push(ext);
    }
  }

  const candidates: Cand[] = [];
  for (const e of pool) {
    const inep = String(e['Código Inep']);
    if (inep === String(escola['Código Inep'])) continue;
    const isEssencial = essenciaisSet.has(inep);

    const eSegmentos = getSegmentos(e);
    const segComum = escolaSegmentos.filter(s => eSegmentos.includes(s));

    const eLat = parseFloat(String(e.Latitude));
    const eLon = parseFloat(String(e.Longitude));
    const eHasCoords = !isNaN(eLat) && !isNaN(eLon);
    let distancia: number | null = null;
    let proximidadeCEP = false;
    if (hasCoords && eHasCoords) {
      distancia = haversine(escolaLat, escolaLon, eLat, eLon);
    } else {
      const eCEP = String(e.CEP || '').slice(0, 3);
      proximidadeCEP = eCEP === escolaCEP;
    }

    if (!isEssencial) {
      // Filtros de elegibilidade (apenas para preenchimento automático)
      if (segComum.length === 0) continue;
      if (!isMensalidadeCompativel(escola.Mensalidade, e.Mensalidade)) continue;
      // Dentro do raio quando há distância real
      if (distancia !== null && distancia > raio) continue;
    }

    // Ranking por proximidade: menor distância primeiro; CEP-match depois; o resto por último
    let proxRank: number;
    if (distancia !== null) proxRank = distancia;            // km — menor é melhor
    else if (proximidadeCEP) proxRank = 9000;                // bucket "estimado por CEP"
    else proxRank = 9999;                                    // bucket "sem proximidade conhecida"

    candidates.push({
      escola: e,
      distancia,
      proximidadeCEP,
      segmentosComum: segComum,
      _proxRank: proxRank,
      _faixaMatch: getMensalidadeFaixa(escola.Mensalidade) === getMensalidadeFaixa(e.Mensalidade) ? 1 : 0,
      _segCount: segComum.length,
      _alunado: num(e['Alunado Total']),
      _essencial: isEssencial,
    });
  }

  // 1) essenciais sempre primeiro; 2) proximidade asc; 3) mesma faixa desc; 4) seg em comum desc; 5) alunado desc
  candidates.sort((a, b) => {
    if (a._essencial !== b._essencial) return a._essencial ? -1 : 1;
    if (a._proxRank !== b._proxRank) return a._proxRank - b._proxRank;
    if (a._faixaMatch !== b._faixaMatch) return b._faixaMatch - a._faixaMatch;
    if (a._segCount !== b._segCount) return b._segCount - a._segCount;
    return b._alunado - a._alunado;
  });

  const concorrentes: ConcorrenteInfo[] = candidates.slice(0, max).map(c => ({
    escola: c.escola, distancia: c.distancia, proximidadeCEP: c.proximidadeCEP, segmentosComum: c.segmentosComum,
  }));

  // Recalcula market share
  const escolaTotal = num(escola['Alunado Total']);
  const concTotal = concorrentes.reduce((s, c) => s + num(c.escola['Alunado Total']), 0);
  const universo = escolaTotal + concTotal;
  const calcMS = (field: keyof EscolaData) => {
    const ev = num(escola[field] as string);
    const cv = concorrentes.reduce((s, c) => s + num(c.escola[field] as string), 0);
    const t = ev + cv;
    return t > 0 ? (ev / t) * 100 : 0;
  };
  const marketShare: MarketShareData = {
    geral: universo > 0 ? (escolaTotal / universo) * 100 : 0,
    ei: calcMS('qt_mat_educacao_infantil'),
    efi: calcMS('qt_mat_ensino_fundamental_anos_iniciais'),
    efii: calcMS('qt_mat_ensino_fundamental_anos_finais'),
    em: calcMS('qt_mat_ensino_medio'),
  };

  return { ...base, concorrentes, raioOperacional: raio, marketShare };
}

export function runAnalysis(
  codigoInep: string,
  censoData: EscolaData[],
  demoData: DemograficaData[],
  coordsOverride?: { lat: number; lng: number } | null,
): AnalysisResult | null {
  const found = censoData.find(e => String(e['Código Inep']) === String(codigoInep));
  if (!found) return null;
  // Aplica fallback de coordenadas (origem: lookup por Protheus) APENAS se faltarem no censo.
  let escola = found;
  if (coordsOverride) {
    const lat = parseFloat(String(found.Latitude));
    const lon = parseFloat(String(found.Longitude));
    const semCoords = isNaN(lat) || isNaN(lon);
    if (semCoords) {
      escola = { ...found, Latitude: String(coordsOverride.lat), Longitude: String(coordsOverride.lng) };
    }
  }

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
  const raioOperacional = calcRaioOperacional(densidadeEscolar);

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

/**
 * Devolve o próximo concorrente elegível para preencher uma vaga liberada,
 * respeitando os mesmos critérios usados pelo `rebuildConcorrentes` e
 * excluindo INEPs já presentes na lista atual ou descartados pelo consultor.
 */
export function pickReplacement(
  base: AnalysisResult,
  censoData: EscolaData[],
  options: { essenciaisInep?: string[]; raioKm?: number; excludeInep: string[] } = { excludeInep: [] }
): EscolaData | null {
  const max = (base.concorrentes?.length ?? 0) + 1 + (options.excludeInep?.length ?? 0) + 5;
  const enlarged = rebuildConcorrentes(base, censoData, {
    essenciaisInep: options.essenciaisInep,
    raioKm: options.raioKm,
    max,
  });
  const skip = new Set(options.excludeInep.map(String));
  const presentes = new Set(base.concorrentes.map(c => String(c.escola['Código Inep'])));
  for (const c of enlarged.concorrentes) {
    const inep = String(c.escola['Código Inep']);
    if (skip.has(inep)) continue;
    if (presentes.has(inep)) continue;
    return c.escola;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Fallback resolver: localizar uma escola no censo quando o COD_INEP da
// carteira está vazio. Usa nome + município + UF (com normalização) e,
// quando disponível, prioriza o candidato mais próximo geograficamente.
// ---------------------------------------------------------------------------
function normalizeName(s: string): string {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenOverlap(a: string, b: string): number {
  const A = new Set(a.split(' ').filter(t => t.length > 2));
  const B = new Set(b.split(' ').filter(t => t.length > 2));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach(t => { if (B.has(t)) inter++; });
  return inter / Math.max(A.size, B.size);
}

export interface CarteiraEscolaHint {
  nome: string;
  municipio?: string;
  uf?: string;
  codMunicipio?: string | number;
  latitude?: number | string;
  longitude?: number | string;
  /** Código Protheus — usado para rastreabilidade quando o INEP está ausente. */
  codProtheus?: string | number;
}

/**
 * Tenta localizar a escola no censo a partir dos dados da carteira (Protheus).
 * REGRA: sempre que uma escola não tiver Código INEP, este resolver usa os dados
 * vinculados ao Código Protheus da carteira (nome, município, UF, coords) para
 * localizá-la no censo e devolver o INEP correspondente. Retorna null se não
 * houver match confiável.
 */
export function resolveInepFromCarteira(
  hint: CarteiraEscolaHint,
  censoData: EscolaData[],
): string | null {
  const target = normalizeName(hint.nome);
  if (!target && !hint.codProtheus) return null;
  const ufHint = String(hint.uf || '').trim().toUpperCase();
  const munHint = normalizeName(hint.municipio || '');
  const codMun = hint.codMunicipio != null ? String(hint.codMunicipio).replace(/\D/g, '') : '';
  const lat = parseFloat(String(hint.latitude ?? ''));
  const lon = parseFloat(String(hint.longitude ?? ''));
  const hasCoords = !isNaN(lat) && !isNaN(lon);

  // Pré-filtra por município (código) ou (nome + UF)
  const pool = censoData.filter(e => {
    if (codMun) {
      const c = String(e['Código Município'] || '').replace(/\D/g, '');
      if (c === codMun) return true;
      if (codMun.length === 7 && c === codMun.slice(0, 6)) return true;
      if (c.length === 7 && c.slice(0, 6) === codMun) return true;
    }
    if (munHint && ufHint) {
      return normalizeName(String(e.Município || '')) === munHint && String(e.UF || '').toUpperCase() === ufHint;
    }
    return false;
  });
  if (!pool.length) return null;

  let best: { e: EscolaData; score: number } | null = null;
  for (const e of pool) {
    const nome = normalizeName(String(e.Escola || ''));
    if (!nome) continue;
    let score = 0;
    if (nome === target) score = 100;
    else if (nome.includes(target) || target.includes(nome)) score = 80;
    else score = tokenOverlap(nome, target) * 70;

    if (hasCoords) {
      const eLat = parseFloat(String(e.Latitude));
      const eLon = parseFloat(String(e.Longitude));
      if (!isNaN(eLat) && !isNaN(eLon)) {
        const d = haversine(lat, lon, eLat, eLon);
        // bônus por proximidade (até +20)
        if (d < 0.2) score += 20;
        else if (d < 1) score += 12;
        else if (d < 3) score += 6;
      }
    }
    if (!best || score > best.score) best = { e, score };
  }
  // Limiar mínimo para evitar match espúrio
  if (!best || best.score < 45) return null;
  return String(best.e['Código Inep']);
}
