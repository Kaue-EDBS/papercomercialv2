import { useState, useMemo, useCallback, useEffect } from 'react';
import { AnalysisResult, EscolaData, ConcorrenteInfo } from '@/lib/types';
import { num, formatNumber, formatPercent, getSegmentos, getMensalidadeFaixa, rebuildConcorrentes } from '@/lib/analysis';
import { useDataLoader } from '@/hooks/useDataLoader';
import { MapPin, Users, Target, GitCompare, Filter, X, Ruler, Check, Crosshair, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import ConcorrenciaMap from './ConcorrenciaMap';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import ConcorrenciaTable from '@/components/concorrencia/ConcorrenciaTable';
import RaioSlider from '@/components/concorrencia/RaioSlider';

interface Props {
  analysis: AnalysisResult;
  /** INEPs marcados como essenciais na Etapa 2; sempre permanecem ao recalcular pelo raio. */
  essenciaisInep?: string[];
  /** Raio atualmente em vigor (vindo do pai). Permite preservar o ajuste ao sair e voltar à página. */
  raioAtual?: number;
  /** Notifica o pai sobre alteração ao vivo do raio na régua. */
  onRaioChange?: (raioKm: number) => void;
}

const SEGMENT_CHIP_COLORS: Record<string, { bg: string; text: string }> = {
  EI: { bg: 'hsl(174 50% 92%)', text: 'hsl(174 62% 28%)' },
  EFI: { bg: 'hsl(220 50% 92%)', text: 'hsl(220 70% 18%)' },
  EFII: { bg: 'hsl(78 60% 92%)', text: 'hsl(78 70% 30%)' },
  EM: { bg: 'hsl(174 40% 85%)', text: 'hsl(174 62% 22%)' },
};

function SegmentChips({ escola }: { escola: EscolaData }) {
  const segs = getSegmentos(escola);
  if (segs.length === 0) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <div className="flex gap-1 flex-wrap">
      {segs.map(s => (
        <span
          key={s}
          className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold"
          style={{ background: SEGMENT_CHIP_COLORS[s]?.bg, color: SEGMENT_CHIP_COLORS[s]?.text }}
        >
          {s}
        </span>
      ))}
    </div>
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

export default function PageConcorrencia({ analysis, essenciaisInep = [], raioAtual, onRaioChange }: Props) {
  const { censo } = useDataLoader();
  const [liveRaio, setLiveRaio] = useState<number>(raioAtual ?? analysis.raioOperacional);
  const [liveAnalysis, setLiveAnalysis] = useState<AnalysisResult>(analysis);

  // Sempre que a análise inicial mudar (nova escola), reseta o estado local.
  // Mantém o raio definido pelo pai (raioAtual) — assim, ao sair e voltar à página,
  // o último raio escolhido pelo usuário é preservado.
  useEffect(() => {
    setLiveRaio(raioAtual ?? analysis.raioOperacional);
    setLiveAnalysis(analysis);
  }, [analysis, raioAtual]);

  // Recalcula em tempo real quando o usuário arrasta a régua.
  // Reprocessamento total: tabela, mapa, cards e market share derivam de liveAnalysis.
  useEffect(() => {
    if (Math.abs(liveRaio - analysis.raioOperacional) < 0.001) {
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
  const [centerSignal, setCenterSignal] = useState(0);

  const filtered: ConcorrenteInfo[] = useMemo(() => {
    return concorrentes.filter(c => {
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
  }, [concorrentes, activeFilter, escola]);

  const totalConcorrentes = concorrentes.length;
  const mesmaFaixa = concorrentes.filter(c => getMensalidadeFaixa(escola.Mensalidade) === getMensalidadeFaixa(c.escola.Mensalidade)).length;
  const proximos = concorrentes.filter(c => c.distancia !== null && c.distancia <= 3).length;
  const comCoordenadas = concorrentes.filter(c => {
    const cLat = parseFloat(String(c.escola.Latitude));
    const cLng = parseFloat(String(c.escola.Longitude));
    return !isNaN(cLat) && !isNaN(cLng);
  }).length;
  const totalAlunos = num(escola['Alunado Total']) + concorrentes.reduce((s, c) => s + num(c.escola['Alunado Total']), 0);

  const toggleSelect = (inep: string) => {
    if (selected.includes(inep)) setSelected(selected.filter(s => s !== inep));
    else if (selected.length < 2) setSelected([...selected, inep]);
  };

  const handleMarkerClick = useCallback((inep: string) => {
    setHighlightedInep(prev => (prev === inep ? null : inep));
    setExpandedInep(prev => (prev === inep ? null : inep));
  }, []);

  const handleExpandedChange = useCallback((inep: string | null) => {
    setExpandedInep(inep);
    setHighlightedInep(inep);
  }, []);

  const selectedEscolas = selected
    .map(inep => concorrentes.find(c => String(c.escola['Código Inep']) === inep)?.escola)
    .filter(Boolean) as EscolaData[];

  const getCompetitorMS = (e: EscolaData) => {
    return totalAlunos > 0 ? (num(e['Alunado Total']) / totalAlunos) * 100 : 0;
  };

  const activeFilterLabel = FILTER_OPTIONS.find(f => f.key === activeFilter)?.label || 'Todos';
  const isCustomRaio = Math.abs(liveRaio - analysis.raioOperacional) > 0.001;

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-8 px-3 sm:px-4 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-3">
        <div>
          <h2 className="page-title text-xl sm:text-2xl">PAINEL DE CONCORRÊNCIA ESCOLAR</h2>
          <p className="page-subtitle text-xs sm:text-sm">
            Escola analisada e os principais concorrentes na área de influência
          </p>
        </div>
        <button
          onClick={() => { setCompareMode(!compareMode); setSelected([]); }}
          className="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors w-full sm:w-auto flex items-center gap-2 justify-center"
          style={{ background: compareMode ? 'hsl(var(--navy))' : 'hsl(var(--teal))', color: 'white' }}
        >
          <GitCompare className="w-4 h-4" />
          {compareMode ? 'Cancelar Comparação' : 'Comparar'}
        </button>
      </div>

      {/* Summary Cards — refletem o liveAnalysis */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
            <span className="card-indicator-label !mt-0">Mesma faixa</span>
          </div>
          <div className="card-indicator-value" style={{ color: 'hsl(var(--navy))' }}>{mesmaFaixa}</div>
        </div>
        <div className="card-indicator">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4" style={{ color: 'hsl(var(--teal))' }} />
            <span className="card-indicator-label !mt-0">Mais próximos</span>
          </div>
          <div className="card-indicator-value" style={{ color: 'hsl(var(--navy))' }}>{proximos}</div>
          <span className="text-[10px] text-muted-foreground">até 3 km</span>
        </div>
        <div className="card-indicator">
          <div className="flex items-center gap-2 mb-1">
            <Ruler className="w-4 h-4" style={{ color: 'hsl(var(--teal))' }} />
            <span className="card-indicator-label !mt-0">Total alunos da área</span>
          </div>
          <div className="card-indicator-value" style={{ color: 'hsl(var(--navy))' }}>{formatNumber(totalAlunos)}</div>
        </div>
      </div>

      {/* Compare mode bar */}
      {compareMode && (
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs p-3 rounded-lg border"
          style={{ background: 'hsl(var(--beige))', borderColor: 'hsl(var(--teal-light))' }}
        >
          <span className="font-semibold" style={{ color: 'hsl(var(--navy))' }}>
            Selecione até 2 concorrentes ({selected.length}/2)
          </span>
          {selected.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {selectedEscolas.map(e => (
                <span
                  key={String(e['Código Inep'])}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium"
                  style={{ background: 'hsl(var(--teal-light))', color: 'hsl(var(--navy))' }}
                >
                  {e.Escola?.slice(0, 20)}
                  <button onClick={() => toggleSelect(String(e['Código Inep']))} className="hover:opacity-70">×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mapa + painel lateral + régua premium */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-card rounded-xl border overflow-hidden">
            <div
              className="px-3 py-2 border-b flex items-center gap-2"
              style={{ background: 'hsl(var(--teal-light))' }}
            >
              <MapPin className="w-4 h-4" style={{ color: 'hsl(var(--teal))' }} />
              <span className="text-xs font-semibold" style={{ color: 'hsl(var(--navy))' }}>
                Mapa de concorrência
              </span>
            </div>
            <div className="p-3 border-b space-y-3">
              <RaioSlider
                value={liveRaio}
                defaultValue={analysis.raioOperacional}
                onChange={(km) => { setLiveRaio(km); onRaioChange?.(km); }}
                hint="Ao mover a régua, o sistema reprocessa a lista de concorrentes, o mapa, os indicadores e o market share desta página."
              />

              {/* Métricas vivas do raio */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="rounded-md border px-2.5 py-1.5" style={{ background: 'hsl(var(--beige) / 0.4)' }}>
                  <div className="text-muted-foreground uppercase tracking-wider text-[9px] font-bold">Raio atual</div>
                  <div className="font-bold tabular-nums" style={{ color: 'hsl(var(--navy))' }}>
                    {liveRaio < 1
                      ? `${Math.round(liveRaio * 1000).toLocaleString('pt-BR')} m`
                      : `${liveRaio.toFixed(1).replace('.', ',')} km`}
                  </div>
                </div>
                <div className="rounded-md border px-2.5 py-1.5" style={{ background: 'hsl(var(--beige) / 0.4)' }}>
                  <div className="text-muted-foreground uppercase tracking-wider text-[9px] font-bold">Padrão</div>
                  <div className="font-bold tabular-nums" style={{ color: 'hsl(var(--navy))' }}>
                    {analysis.raioOperacional.toFixed(1).replace('.', ',')} km
                  </div>
                </div>
                <div className="rounded-md border px-2.5 py-1.5" style={{ background: 'hsl(var(--beige) / 0.4)' }}>
                  <div className="text-muted-foreground uppercase tracking-wider text-[9px] font-bold">No raio</div>
                  <div className="font-bold tabular-nums" style={{ color: 'hsl(var(--navy))' }}>
                    {totalConcorrentes} <span className="text-muted-foreground font-medium">esc.</span>
                  </div>
                </div>
                <div className="rounded-md border px-2.5 py-1.5" style={{ background: 'hsl(var(--beige) / 0.4)' }}>
                  <div className="text-muted-foreground uppercase tracking-wider text-[9px] font-bold">No mapa</div>
                  <div className="font-bold tabular-nums" style={{ color: 'hsl(var(--navy))' }}>
                    {comCoordenadas}/{totalConcorrentes}
                  </div>
                </div>
              </div>

              {/* Barra de ações: centralizar, padrão, confirmar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCenterSignal(s => s + 1)}
                    className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-semibold border hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary"
                    style={{ borderColor: 'hsl(var(--teal-light))', color: 'hsl(var(--navy))' }}
                    aria-label="Centralizar mapa na escola em análise"
                    title="Centraliza o mapa na escola em análise"
                  >
                    <Crosshair className="w-3.5 h-3.5" style={{ color: 'hsl(var(--teal))' }} />
                    Centralizar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLiveRaio(analysis.raioOperacional);
                      onRaioChange?.(analysis.raioOperacional);
                      toast.info('Raio restaurado ao padrão da Etapa 2', {
                        description: `${analysis.raioOperacional.toFixed(1).replace('.', ',')} km`,
                      });
                    }}
                    disabled={!isCustomRaio}
                    className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-semibold border hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    style={{ borderColor: 'hsl(var(--teal-light))', color: 'hsl(var(--navy))' }}
                    aria-label="Restaurar raio padrão definido na Etapa 2"
                    title="Volta ao raio padrão definido na Etapa 2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" style={{ color: 'hsl(var(--teal))' }} />
                    Padrão
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onRaioChange?.(liveRaio);
                    const fmt = liveRaio < 1
                      ? `${Math.round(liveRaio * 1000).toLocaleString('pt-BR')} m`
                      : `${liveRaio.toFixed(1).replace('.', ',')} km`;
                    toast.success(`Raio confirmado: ${fmt}`, {
                      description: 'Mensalidade e Market Share foram atualizados.',
                    });
                  }}
                  className="inline-flex items-center gap-2 px-4 h-9 rounded-lg text-sm font-semibold text-white hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  style={{ background: 'hsl(var(--teal))' }}
                  aria-label="Confirmar raio atual"
                >
                  <Check className="w-4 h-4" />
                  Confirmar raio
                </button>
              </div>
            </div>
            {comCoordenadas > 0 ? (
              <ConcorrenciaMap
                escola={escola}
                concorrentes={concorrentes}
                highlightedInep={highlightedInep}
                onMarkerClick={handleMarkerClick}
                centerSignal={centerSignal}
              />
            ) : (
              <div
                className="px-4 py-8 text-center text-xs text-muted-foreground"
                style={{ background: 'hsl(var(--beige) / 0.4)' }}
              >
                Nenhum concorrente com coordenadas no raio atual. Aumente o raio para visualizar o mapa.
              </div>
            )}
          </div>

          {/* Painel lateral mais sofisticado */}
          <div className="lg:col-span-1 space-y-3">
            <div className="bg-card rounded-xl border p-3 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--navy))' }}>
                Legenda
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: 'hsl(174,62%,35%)' }} />
                <span className="text-muted-foreground">Escola em análise</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: 'hsl(220,70%,18%)' }} />
                <span className="text-muted-foreground">Concorrentes</span>
              </div>
            </div>

            <div className="bg-card rounded-xl border p-3 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--navy))' }}>
                Cobertura no mapa
              </div>
              <div className="grid grid-cols-2 gap-y-1 text-xs">
                <span className="text-muted-foreground">Plotados</span>
                <span className="font-semibold tabular-nums">{comCoordenadas} / {totalConcorrentes}</span>
                <span className="text-muted-foreground">Estimados por CEP</span>
                <span className="font-semibold tabular-nums">{totalConcorrentes - comCoordenadas}</span>
              </div>
            </div>

            <div className="bg-card rounded-xl border p-3 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--navy))' }}>
                Filtro ativo
              </div>
              <div className="grid grid-cols-2 gap-y-1 text-xs">
                <span className="text-muted-foreground">Critério</span>
                <span className="font-semibold">{activeFilterLabel}</span>
                <span className="text-muted-foreground">Exibidos</span>
                <span className="font-semibold tabular-nums">{filtered.length}</span>
                <span className="text-muted-foreground">Raio</span>
                <span className="font-semibold tabular-nums">
                  {liveRaio.toFixed(1).replace('.', ',')} km
                  {isCustomRaio && (
                    <span className="ml-1 text-[10px]" style={{ color: 'hsl(40 80% 35%)' }}>(ajustado)</span>
                  )}
                </span>
              </div>
            </div>
          </div>
      </div>

      {/* Filtros rápidos */}
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
                <span className="ml-1 w-2 h-2 rounded-full" style={{ background: 'hsl(var(--teal))' }} />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-52 p-2 space-y-1">
            {FILTER_OPTIONS.map(f => (
              <button
                key={f.key}
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
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-medium"
            style={{ background: 'hsl(var(--teal-light))', color: 'hsl(var(--navy))' }}
          >
            {activeFilterLabel}
            <button onClick={() => setActiveFilter('todos')} className="hover:opacity-70 ml-0.5">
              <X className="w-3 h-3" />
            </button>
          </span>
        )}

        <span className="text-[10px] text-muted-foreground ml-auto">
          {filtered.length} concorrente{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tabela unificada — mesmo padrão da Validação (Etapa 2) */}
      <ConcorrenciaTable
        escola={escola}
        concorrentes={filtered}
        essenciaisInep={essenciaisInep}
        mode="apresentacao"
        expandedInep={expandedInep}
        onExpandedChange={handleExpandedChange}
        caption={
          <>
            Dica: <strong>clique em uma linha</strong> para expandir os detalhes da escola.
          </>
        }
      />

      {/* Compare cards */}
      {compareMode && selected.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-base sm:text-lg" style={{ color: 'hsl(var(--navy))' }}>
            Comparativo Rápido
          </h3>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
            <CompareCard escola={escola} label="Escola em Análise" marketShare={marketShare.geral} />
            {selectedEscolas.map((e, idx) => (
              <CompareCard
                key={String(e['Código Inep'])}
                escola={e}
                label={`Concorrente ${idx + 1}`}
                marketShare={getCompetitorMS(e)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modo comparação: chips para selecionar concorrentes (lista compacta) */}
      {compareMode && (
        <div className="bg-card rounded-xl border p-3 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--navy))' }}>
            Toque para incluir/remover do comparativo
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filtered.map(c => {
              const inep = String(c.escola['Código Inep']);
              const isSel = selected.includes(inep);
              return (
                <button
                  key={inep}
                  onClick={() => toggleSelect(inep)}
                  disabled={!isSel && selected.length >= 2}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors disabled:opacity-40"
                  style={{
                    background: isSel ? 'hsl(var(--teal))' : 'hsl(var(--card))',
                    color: isSel ? 'white' : 'hsl(var(--navy))',
                    borderColor: isSel ? 'hsl(var(--teal))' : 'hsl(var(--border))',
                  }}
                >
                  {c.escola.Escola?.slice(0, 26)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
