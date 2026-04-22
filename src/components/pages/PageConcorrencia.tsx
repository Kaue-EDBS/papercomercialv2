import { useState, useMemo, useCallback, useEffect } from 'react';
import { AnalysisResult, EscolaData, ConcorrenteInfo } from '@/lib/types';
import { num, formatNumber, formatDistance, formatPercent, getSegmentos, getMensalidadeFaixa, rebuildConcorrentes } from '@/lib/analysis';
import { useDataLoader } from '@/hooks/useDataLoader';
import { MapPin, Users, Target, ChevronDown, ChevronUp, GitCompare, Filter, X } from 'lucide-react';
import ConcorrenciaMap from './ConcorrenciaMap';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

interface Props {
  analysis: AnalysisResult;
  /** INEPs marcados como essenciais na Etapa 2; sempre permanecem ao recalcular pelo raio. */
  essenciaisInep?: string[];
  /** Notifica o pai sobre alteração ao vivo do raio na régua. */
  onRaioChange?: (raioKm: number) => void;
}

function formatAdocao(tipo: string): string {
  if (!tipo) return 'Dado não disponível';
  const upper = tipo.toUpperCase().trim();
  if (upper === 'NÃO' || upper === 'NAO') return 'Sem Dados';
  if (upper === 'DID' || upper === 'DID/AP') return 'Didático';
  return tipo;
}

function formatAdotaBrasil(val: string): string {
  if (!val) return 'Dado não disponível';
  const upper = val.toUpperCase().trim();
  if (upper === 'NÃO' || upper === 'NAO') return 'Sem Dados';
  return val;
}

type Prioridade = 'Alta' | 'Média' | 'Baixa';

function calcPrioridade(c: ConcorrenteInfo, escola: EscolaData): Prioridade {
  let score = 0;
  if (c.distancia !== null && c.distancia <= 2) score += 3;
  else if (c.distancia !== null && c.distancia <= 5) score += 2;
  else if (c.proximidadeCEP) score += 1;
  if (getMensalidadeFaixa(escola.Mensalidade) === getMensalidadeFaixa(c.escola.Mensalidade)) score += 2;
  score += Math.min(c.segmentosComum.length, 3);
  if (num(c.escola['Alunado Total']) >= num(escola['Alunado Total']) * 0.5) score += 1;
  if (score >= 6) return 'Alta';
  if (score >= 3) return 'Média';
  return 'Baixa';
}

const SEGMENT_CHIP_COLORS: Record<string, { bg: string; text: string }> = {
  EI: { bg: 'hsl(174 50% 92%)', text: 'hsl(174 62% 28%)' },
  EFI: { bg: 'hsl(220 50% 92%)', text: 'hsl(220 70% 18%)' },
  EFII: { bg: 'hsl(78 60% 92%)', text: 'hsl(78 70% 30%)' },
  EM: { bg: 'hsl(174 40% 85%)', text: 'hsl(174 62% 22%)' },
};

const PRIORIDADE_COLORS: Record<Prioridade, { bg: string; text: string }> = {
  Alta: { bg: 'hsl(0 70% 95%)', text: 'hsl(0 70% 40%)' },
  Média: { bg: 'hsl(40 80% 92%)', text: 'hsl(40 80% 35%)' },
  Baixa: { bg: 'hsl(174 50% 92%)', text: 'hsl(174 62% 28%)' },
};

function SegmentChips({ escola }: { escola: EscolaData }) {
  const segs = getSegmentos(escola);
  if (segs.length === 0) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <div className="flex gap-1 flex-wrap">
      {segs.map(s => (
        <span key={s} className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold"
          style={{ background: SEGMENT_CHIP_COLORS[s]?.bg, color: SEGMENT_CHIP_COLORS[s]?.text }}>
          {s}
        </span>
      ))}
    </div>
  );
}

function PrioridadeBadge({ prioridade }: { prioridade: Prioridade }) {
  const c = PRIORIDADE_COLORS[prioridade];
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap"
      style={{ background: c.bg, color: c.text }}>
      {prioridade}
    </span>
  );
}

type FilterType = 'todos' | 'ate2km' | 'mesmaFaixa' | 'mesmoSegmento' | 'comEditora' | 'semEditora' | 'coordenadas' | 'estimadoCEP';

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'ate2km', label: 'Até 2 km' },
  { key: 'mesmaFaixa', label: 'Mesma faixa' },
  { key: 'mesmoSegmento', label: 'Mesmo segmento' },
  { key: 'comEditora', label: 'Com Ed. do Brasil' },
  { key: 'semEditora', label: 'Sem Ed. do Brasil' },
  { key: 'coordenadas', label: 'Coordenadas' },
  { key: 'estimadoCEP', label: 'Estimado por CEP' },
];

function CompareCard({ escola, label, marketShare }: { escola: EscolaData; label: string; marketShare?: number }) {
  return (
    <div className="bg-card rounded-xl border p-3 sm:p-4 space-y-2 flex-1 min-w-[160px] sm:min-w-[200px]">
      <div className="text-[10px] sm:text-xs font-semibold uppercase" style={{ color: 'hsl(var(--teal))' }}>{label}</div>
      <div className="font-bold text-xs sm:text-sm truncate" style={{ color: 'hsl(var(--navy))' }}>{escola.Escola}</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] sm:text-xs">
        <div className="text-muted-foreground">Matrículas Totais</div>
        <div className="font-semibold">{formatNumber(num(escola['Alunado Total']))}</div>
        <div className="text-muted-foreground">Segmentos</div>
        <div className="font-semibold"><SegmentChips escola={escola} /></div>
        <div className="text-muted-foreground">Mensalidade</div>
        <div className="font-semibold">{escola.Mensalidade === '0' ? 'N/D' : `R$ ${escola.Mensalidade}`}</div>
        {marketShare !== undefined && (
          <>
            <div className="text-muted-foreground">Market Share</div>
            <div className="font-semibold">{formatPercent(marketShare)}</div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PageConcorrencia({ analysis, essenciaisInep = [], onRaioChange }: Props) {
  const { censo } = useDataLoader();
  const [liveRaio, setLiveRaio] = useState<number>(analysis.raioOperacional);
  const [liveAnalysis, setLiveAnalysis] = useState<AnalysisResult>(analysis);

  // Sempre que a análise inicial mudar (nova escola), reseta o estado local.
  useEffect(() => {
    setLiveRaio(analysis.raioOperacional);
    setLiveAnalysis(analysis);
  }, [analysis]);

  // Recalcula em tempo real quando o usuário arrasta a régua.
  useEffect(() => {
    if (liveRaio === analysis.raioOperacional) {
      setLiveAnalysis(analysis);
      return;
    }
    const next = rebuildConcorrentes(analysis, censo, { essenciaisInep, raioKm: liveRaio });
    setLiveAnalysis(next);
  }, [liveRaio, analysis, censo, essenciaisInep]);

  const { escola, concorrentes, marketShare } = liveAnalysis;
  const [expandedInep, setExpandedInep] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('todos');
  const [highlightedInep, setHighlightedInep] = useState<string | null>(null);

  const enriched = useMemo(() =>
    concorrentes.map(c => ({ ...c, prioridade: calcPrioridade(c, escola) })),
    [concorrentes, escola]
  );

  const filtered = useMemo(() => {
    return enriched.filter(c => {
      switch (activeFilter) {
        case 'ate2km': return c.distancia !== null && c.distancia <= 2;
        case 'mesmaFaixa': return getMensalidadeFaixa(escola.Mensalidade) === getMensalidadeFaixa(c.escola.Mensalidade);
        case 'mesmoSegmento': return c.segmentosComum.length > 0;
        case 'comEditora': {
          const v = (c.escola['Adota Brasil'] || '').toUpperCase().trim();
          return v !== '' && v !== 'NÃO' && v !== 'NAO';
        }
        case 'semEditora': {
          const v = (c.escola['Adota Brasil'] || '').toUpperCase().trim();
          return v === '' || v === 'NÃO' || v === 'NAO';
        }
        case 'coordenadas': return c.distancia !== null;
        case 'estimadoCEP': return c.distancia === null;
        default: return true;
      }
    });
  }, [enriched, activeFilter, escola]);

  const totalConcorrentes = concorrentes.length;
  const mesmaFaixa = concorrentes.filter(c => getMensalidadeFaixa(escola.Mensalidade) === getMensalidadeFaixa(c.escola.Mensalidade)).length;
  const proximos = concorrentes.filter(c => c.distancia !== null && c.distancia <= 3).length;
  const comCoordenadas = concorrentes.filter(c => {
    const cLat = parseFloat(String(c.escola.Latitude));
    const cLng = parseFloat(String(c.escola.Longitude));
    return !isNaN(cLat) && !isNaN(cLng);
  }).length;

  const toggleExpand = (inep: string) => {
    if (compareMode) return;
    setExpandedInep(expandedInep === inep ? null : inep);
    setHighlightedInep(expandedInep === inep ? null : inep);
  };

  const toggleSelect = (inep: string) => {
    if (selected.includes(inep)) setSelected(selected.filter(s => s !== inep));
    else if (selected.length < 2) setSelected([...selected, inep]);
  };

  const handleMarkerClick = useCallback((inep: string) => {
    setHighlightedInep(prev => prev === inep ? null : inep);
    setExpandedInep(prev => prev === inep ? null : inep);
  }, []);

  const selectedEscolas = selected.map(inep => concorrentes.find(c => String(c.escola['Código Inep']) === inep)?.escola).filter(Boolean) as EscolaData[];

  const getCompetitorMS = (e: EscolaData) => {
    const total = num(escola['Alunado Total']) + concorrentes.reduce((s, c) => s + num(c.escola['Alunado Total']), 0);
    return total > 0 ? (num(e['Alunado Total']) / total) * 100 : 0;
  };

  const activeFilterLabel = FILTER_OPTIONS.find(f => f.key === activeFilter)?.label || 'Todos';

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-8 px-3 sm:px-4 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-3">
        <div>
          <h2 className="page-title text-xl sm:text-2xl">PAINEL DE CONCORRÊNCIA ESCOLAR</h2>
          <p className="page-subtitle text-xs sm:text-sm">Escola analisada e os principais concorrentes na área de influência</p>
        </div>
        <button
          onClick={() => { setCompareMode(!compareMode); setSelected([]); }}
          className="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors w-full sm:w-auto flex items-center gap-2 justify-center"
          style={{
            background: compareMode ? 'hsl(var(--navy))' : 'hsl(var(--teal))',
            color: 'white',
          }}
        >
          <GitCompare className="w-4 h-4" />
          {compareMode ? 'Cancelar Comparação' : 'Comparar'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card-indicator">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4" style={{ color: 'hsl(var(--teal))' }} />
            <span className="card-indicator-label !mt-0">Concorrentes</span>
          </div>
          <div className="card-indicator-value" style={{ color: 'hsl(var(--navy))' }}>{totalConcorrentes}</div>
        </div>
        <div className="card-indicator">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4" style={{ color: 'hsl(var(--teal))' }} />
            <span className="card-indicator-label !mt-0">Mesma Faixa</span>
          </div>
          <div className="card-indicator-value" style={{ color: 'hsl(var(--navy))' }}>{mesmaFaixa}</div>
        </div>
        <div className="card-indicator">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4" style={{ color: 'hsl(var(--teal))' }} />
            <span className="card-indicator-label !mt-0">Mais Próximos</span>
          </div>
          <div className="card-indicator-value" style={{ color: 'hsl(var(--navy))' }}>{proximos}</div>
          <span className="text-[10px] text-muted-foreground">até 3 km</span>
        </div>
      </div>

      {/* Compare mode bar */}
      {compareMode && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs p-3 rounded-lg border" style={{ background: 'hsl(var(--beige))', borderColor: 'hsl(var(--teal-light))' }}>
          <span className="font-semibold" style={{ color: 'hsl(var(--navy))' }}>
            Selecione até 2 concorrentes ({selected.length}/2)
          </span>
          {selected.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {selectedEscolas.map(e => (
                <span key={String(e['Código Inep'])} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium" style={{ background: 'hsl(var(--teal-light))', color: 'hsl(var(--navy))' }}>
                  {e.Escola?.slice(0, 20)}
                  <button onClick={() => toggleSelect(String(e['Código Inep']))} className="hover:opacity-70">×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mini Map + Info Panel — full width block */}
      {(() => {
        const hasAnyCoords = comCoordenadas > 0;
        if (!hasAnyCoords) return null;
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-card rounded-xl border overflow-hidden">
              <div className="px-3 py-2 border-b flex items-center gap-2" style={{ background: 'hsl(var(--teal-light))' }}>
                <MapPin className="w-4 h-4" style={{ color: 'hsl(var(--teal))' }} />
                <span className="text-xs font-semibold" style={{ color: 'hsl(var(--navy))' }}>Mapa de Concorrência</span>
              </div>
              <ConcorrenciaMap
                escola={escola}
                concorrentes={concorrentes}
                highlightedInep={highlightedInep}
                onMarkerClick={handleMarkerClick}
              />
            </div>

            {/* Info Panel beside map */}
            <div className="lg:col-span-1 space-y-3">
              <div className="bg-card rounded-xl border p-3 space-y-2">
                <div className="text-xs font-bold" style={{ color: 'hsl(var(--navy))' }}>Legenda</div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-block w-3 h-3 rounded-full" style={{ background: 'hsl(174,62%,35%)' }}></span>
                  <span className="text-muted-foreground">Escola em análise</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-block w-3 h-3 rounded-full" style={{ background: 'hsl(220,70%,18%)' }}></span>
                  <span className="text-muted-foreground">Concorrentes</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">{comCoordenadas} de {totalConcorrentes} com coordenadas no mapa</div>
              </div>

              <div className="bg-card rounded-xl border p-3 space-y-2">
                <div className="text-xs font-bold" style={{ color: 'hsl(var(--navy))' }}>Resumo</div>
                <div className="grid grid-cols-2 gap-y-1 text-xs">
                  <span className="text-muted-foreground">Filtro ativo</span>
                  <span className="font-semibold">{activeFilterLabel}</span>
                  <span className="text-muted-foreground">Exibidos</span>
                  <span className="font-semibold">{filtered.length}</span>
                  <span className="text-muted-foreground">Raio</span>
                  <span className="font-semibold">{liveRaio.toFixed(1).replace('.', ',')} km</span>
                </div>
              </div>

              {selected.length > 0 && (
                <div className="bg-card rounded-xl border p-3 space-y-2">
                  <div className="text-xs font-bold" style={{ color: 'hsl(var(--navy))' }}>Selecionadas</div>
                  {selectedEscolas.map(e => (
                    <div key={String(e['Código Inep'])} className="text-xs font-medium truncate" style={{ color: 'hsl(var(--teal))' }}>
                      • {e.Escola?.slice(0, 28)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Filter icon + active chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
              style={{
                borderColor: activeFilter !== 'todos' ? 'hsl(var(--teal))' : 'hsl(var(--border))',
                color: 'hsl(var(--navy))',
              }}
            >
              <Filter className="w-3.5 h-3.5" />
              Filtros
              {activeFilter !== 'todos' && (
                <span className="ml-1 w-2 h-2 rounded-full" style={{ background: 'hsl(var(--teal))' }}></span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-52 p-2 space-y-1">
            {FILTER_OPTIONS.map(f => (
              <button key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className="w-full text-left px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                style={{
                  background: activeFilter === f.key ? 'hsl(var(--teal))' : 'transparent',
                  color: activeFilter === f.key ? 'white' : 'hsl(var(--navy))',
                }}
              >
                {f.label}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {activeFilter !== 'todos' && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-medium"
            style={{ background: 'hsl(var(--teal-light))', color: 'hsl(var(--navy))' }}>
            {activeFilterLabel}
            <button onClick={() => setActiveFilter('todos')} className="hover:opacity-70 ml-0.5"><X className="w-3 h-3" /></button>
          </span>
        )}

        <span className="text-[10px] text-muted-foreground ml-auto">{filtered.length} concorrente{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table — full width */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-executive w-full">
            <thead>
              <tr>
                {compareMode && <th className="w-10"></th>}
                <th className="min-w-[200px]">Escola</th>
                <th className="w-24">Matr.</th>
                <th className="w-28 hidden sm:table-cell">Distância</th>
                <th className="w-32">Segmentos</th>
                <th className="w-24 hidden sm:table-cell">Prioridade</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {/* Escola analisada - fixed on top */}
              <tr style={{ background: 'hsl(var(--teal-light))' }} className="font-semibold">
                {compareMode && (
                  <td className="text-center">
                    <span className="text-[10px] text-muted-foreground">REF</span>
                  </td>
                )}
                <td className="text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <span className="truncate max-w-[180px] sm:max-w-[260px]">{escola.Escola}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap shrink-0"
                      style={{ background: 'hsl(var(--teal))', color: 'white' }}>
                      EM ANÁLISE
                    </span>
                  </div>
                </td>
                <td className="text-xs sm:text-sm font-bold">{formatNumber(num(escola['Alunado Total']))}</td>
                <td className="hidden sm:table-cell text-xs">—</td>
                <td><SegmentChips escola={escola} /></td>
                <td className="hidden sm:table-cell">—</td>
                <td></td>
              </tr>

              {/* Concorrentes */}
              {filtered.map((row) => {
                const inep = String(row.escola['Código Inep']);
                const isExpanded = expandedInep === inep;
                const isSelected = selected.includes(inep);
                const isHighlighted = highlightedInep === inep;
                const e = row.escola;
                return (
                  <>
                    <tr key={inep}
                      onClick={() => compareMode ? toggleSelect(inep) : toggleExpand(inep)}
                      className={`cursor-pointer transition-colors ${isSelected ? 'ring-2 ring-inset ring-primary' : ''}`}
                      style={{
                        background: isHighlighted
                          ? 'hsl(var(--teal-light))'
                          : isSelected ? 'hsl(var(--teal-light) / 0.5)' : undefined,
                      }}
                    >
                      {compareMode && (
                        <td className="text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(inep)}
                            disabled={!isSelected && selected.length >= 2}
                            className="w-4 h-4 accent-[hsl(var(--teal))]"
                          />
                        </td>
                      )}
                      <td className="text-xs sm:text-sm">
                        <span className="truncate block max-w-[180px] sm:max-w-[260px]">{e.Escola}</span>
                      </td>
                      <td className="text-xs sm:text-sm">{formatNumber(num(e['Alunado Total']))}</td>
                      <td className="hidden sm:table-cell text-xs">
                        {row.distancia !== null ? formatDistance(row.distancia) : 'Estimado por CEP'}
                      </td>
                      <td><SegmentChips escola={e} /></td>
                      <td className="hidden sm:table-cell"><PrioridadeBadge prioridade={row.prioridade} /></td>
                      <td className="text-center">
                        {!compareMode && (
                          isExpanded
                            ? <ChevronUp className="w-4 h-4 text-muted-foreground inline" />
                            : <ChevronDown className="w-4 h-4 text-muted-foreground inline" />
                        )}
                      </td>
                    </tr>
                    {isExpanded && !compareMode && (
                      <tr key={`${inep}-detail`}>
                        <td colSpan={7} className="!p-0">
                          <div className="px-4 sm:px-6 py-3 sm:py-4" style={{ background: 'hsl(var(--beige-dark))' }}>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="space-y-1.5">
                                <div className="text-xs font-bold mb-2" style={{ color: 'hsl(var(--navy))' }}>Localização e Perfil</div>
                                <div className="text-xs"><span className="text-muted-foreground">Endereço:</span> {e.Endereço || '—'}{e.Número ? `, ${e.Número}` : ''} — {e.Bairro || ''}</div>
                                <div className="text-xs"><span className="text-muted-foreground">Distância:</span> {row.distancia !== null ? formatDistance(row.distancia) : 'Estimado por CEP'}</div>
                                <div className="text-xs"><span className="text-muted-foreground">Mensalidade:</span> {e.Mensalidade === '0' ? 'N/D' : `R$ ${e.Mensalidade}`}</div>
                                <div className="text-xs sm:hidden"><span className="text-muted-foreground">Prioridade:</span> <PrioridadeBadge prioridade={row.prioridade} /></div>
                              </div>
                              <div className="space-y-1.5">
                                <div className="text-xs font-bold mb-2" style={{ color: 'hsl(var(--navy))' }}>Oferta Educacional</div>
                                <div className="text-xs"><span className="text-muted-foreground">Matrículas Totais:</span> {formatNumber(num(e['Alunado Total']))}</div>
                                <div className="text-xs"><span className="text-muted-foreground">Ed. Infantil:</span> {formatNumber(num(e.qt_mat_educacao_infantil))}</div>
                                <div className="text-xs"><span className="text-muted-foreground">Fund. Anos Iniciais:</span> {formatNumber(num(e.qt_mat_ensino_fundamental_anos_iniciais))}</div>
                                <div className="text-xs"><span className="text-muted-foreground">Fund. Anos Finais:</span> {formatNumber(num(e.qt_mat_ensino_fundamental_anos_finais))}</div>
                                <div className="text-xs"><span className="text-muted-foreground">Ensino Médio:</span> {formatNumber(num(e.qt_mat_ensino_medio))}</div>
                              </div>
                              <div className="space-y-1.5">
                                <div className="text-xs font-bold mb-2" style={{ color: 'hsl(var(--navy))' }}>Relação com a Editora</div>
                                <div className="text-xs"><span className="text-muted-foreground">Adoção Ed. do Brasil:</span> {formatAdotaBrasil(e['Adota Brasil'])}</div>
                                <div className="text-xs"><span className="text-muted-foreground">Tipo de Adoção:</span> {formatAdocao(e['Tipo de Adoção'])}</div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compare cards */}
      {compareMode && selected.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-base sm:text-lg" style={{ color: 'hsl(var(--navy))' }}>Comparativo Rápido</h3>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
            <CompareCard escola={escola} label="Escola em Análise" marketShare={marketShare.geral} />
            {selectedEscolas.map((e, idx) => (
              <CompareCard key={String(e['Código Inep'])} escola={e} label={`Concorrente ${idx + 1}`} marketShare={getCompetitorMS(e)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
