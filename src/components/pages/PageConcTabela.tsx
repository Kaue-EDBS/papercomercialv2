import { useMemo, useState } from 'react';
import { AnalysisResult, EscolaData } from '@/lib/types';
import { num, formatNumber, formatDistance, getSegmentos, getMensalidadeFaixa } from '@/lib/analysis';
import { Check, Settings2, ChevronDown, ChevronRight, Info, X, Search, Trash2 } from 'lucide-react';

interface Props {
  analysis: AnalysisResult;
  essenciaisInep: string[];
  raioAtual: number;
  fromRaioAdjust?: boolean;
  censoData: EscolaData[];
  onRemoveConcorrente: (inep: string, mode: 'auto' | 'leave' | { manualInep: string }) => void;
  onConfirm: () => void;
  onChangeRaio: () => void;
}

/**
 * 2.2 — Tabela final de concorrentes (até 15).
 * Essenciais sempre presentes; restante completado pela priorização automática.
 */
export default function PageConcTabela({ analysis, essenciaisInep, raioAtual, fromRaioAdjust, censoData, onRemoveConcorrente, onConfirm, onChangeRaio }: Props) {
  const { escola, concorrentes } = analysis;
  const essenciaisSet = new Set(essenciaisInep.map(String));
  const [expandedInep, setExpandedInep] = useState<string | null>(null);
  const [askRemove, setAskRemove] = useState<{ inep: string; nome: string } | null>(null);
  const [pickReplaceFor, setPickReplaceFor] = useState<{ inep: string; nome: string } | null>(null);

  return (
    <div className="max-w-5xl mx-auto py-8 sm:py-10 px-3 sm:px-4 space-y-5">
      <header className="space-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--teal))' }}>
          Etapa 2 · Validação de Concorrência (2/3)
        </span>
        <h2 className="page-title text-xl sm:text-2xl">Tabela de concorrentes</h2>
        <p className="page-subtitle text-sm">
          Lista final com até 15 concorrentes. Os <strong>essenciais</strong> escolhidos por você entram obrigatoriamente; o sistema completa as demais vagas com candidatos elegíveis.
        </p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Indicator label="Total" value={String(concorrentes.length)} />
        <Indicator label="Essenciais" value={String(essenciaisInep.length)} />
        <Indicator label="Automáticos" value={String(Math.max(0, concorrentes.length - essenciaisInep.length))} />
        <Indicator label="Raio atual" value={`${raioAtual} km`} />
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto max-h-[65vh] overflow-y-auto overscroll-contain" tabIndex={0} aria-label="Tabela de concorrentes (rolagem própria)">
          <table className="table-premium">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="w-8" aria-label="Expandir"></th>
                <th className="min-w-[240px]">Escola</th>
                <th className="w-28" title="Como esta escola entrou na lista de concorrentes">Origem</th>
                <th className="w-24">Matr.</th>
                <th className="w-28">Distância</th>
                <th className="w-32">Segmentos</th>
                <th className="w-28">Mensalidade</th>
                <th className="w-10" aria-label="Ações"></th>
              </tr>
            </thead>
            <tbody>
              {concorrentes.map(c => {
                const inep = String(c.escola['Código Inep']);
                const isEss = essenciaisSet.has(inep);
                const segs = getSegmentos(c.escola);
                const mesmaFaixa = getMensalidadeFaixa(escola.Mensalidade) === getMensalidadeFaixa(c.escola.Mensalidade);
                const isOpen = expandedInep === inep;
                const segsComum = c.segmentosComum || [];
                const distanciaTipo = c.distancia !== null ? 'real' : (c.proximidadeCEP ? 'cep' : 'sem');
                const criterio = isEss
                  ? 'Incluída manualmente pelo consultor (essencial).'
                  : (distanciaTipo === 'real'
                      ? 'Selecionada por proximidade geográfica e segmentos em comum.'
                      : distanciaTipo === 'cep'
                        ? 'Selecionada automaticamente por proximidade estimada (CEP) e segmentos em comum.'
                        : 'Selecionada automaticamente pelo critério da área de influência.');
                const semMensalidade = !c.escola.Mensalidade || c.escola.Mensalidade === '0';
                return (
                  <>
                  <tr
                    key={inep}
                    onClick={() => setExpandedInep(isOpen ? null : inep)}
                    className={`cursor-pointer ${isOpen ? 'row-selected' : ''}`}
                    aria-expanded={isOpen}
                    aria-selected={isOpen}
                    title="Clique para ver os critérios desta seleção"
                  >
                    <td className="text-center align-middle">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setExpandedInep(isOpen ? null : inep); }}
                        aria-label={isOpen ? 'Recolher detalhes' : 'Expandir detalhes'}
                        className="p-1 rounded hover:bg-background/60 focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </td>
                    <td>
                      <div className="font-semibold text-sm leading-snug" style={{ color: 'hsl(var(--navy))' }}>{c.escola.Escola}</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground tabular-nums mt-0.5">Inep · {inep}</div>
                    </td>
                    <td>
                      <span
                        className={`chip ${isEss ? 'chip-essencial' : 'chip-automatico'}`}
                        title={isEss ? 'Selecionada manualmente pelo consultor' : 'Selecionada automaticamente pelo sistema'}
                      >
                        {isEss ? '★ Essencial' : 'Automático'}
                      </span>
                    </td>
                    <td className="font-semibold tabular-nums">{formatNumber(num(c.escola['Alunado Total']))}</td>
                    <td>
                      {c.distancia !== null ? (
                        <span className="text-sm tabular-nums font-medium" style={{ color: 'hsl(var(--navy))' }}>{formatDistance(c.distancia)}</span>
                      ) : c.proximidadeCEP ? (
                        <span className="text-[11px] inline-flex items-center gap-1 text-muted-foreground" title="Distância estimada com base no CEP — sem coordenadas precisas">
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" aria-hidden /> estimado por CEP
                        </span>
                      ) : (
                        <span className="text-[11px] italic text-muted-foreground">Sem distância</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-1 flex-wrap">
                        {segs.map(s => <span key={s} className="chip chip-segmento">{s}</span>)}
                      </div>
                    </td>
                    <td>
                      {semMensalidade ? (
                        <span className="text-[11px] italic text-muted-foreground" title="Dado não disponível na base fornecida">
                          — não informado
                        </span>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-medium tabular-nums" style={{ color: 'hsl(var(--navy))' }}>{c.escola.Mensalidade}</span>
                          {mesmaFaixa && (
                            <span className="text-[10px] inline-flex items-center gap-1" style={{ color: 'hsl(var(--teal))' }}>● mesma faixa</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="text-center align-middle">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setAskRemove({ inep, nome: c.escola.Escola }); }}
                        aria-label={`Excluir ${c.escola.Escola} da lista`}
                        title="Excluir concorrente"
                        className="p-1.5 rounded hover:bg-background/60 focus-visible:ring-2 focus-visible:ring-primary text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr key={inep + '-detail'} style={{ background: 'hsl(var(--beige) / 0.5)' }}>
                      <td colSpan={8} className="px-4 py-3">
                        <div className="rounded-lg border bg-card p-3 sm:p-4 space-y-3" style={{ borderColor: 'hsl(var(--teal-light))' }}>
                          <div className="flex items-start gap-2">
                            <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'hsl(var(--teal))' }} />
                            <div>
                              <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--teal))' }}>
                                Por que esta escola foi incluída?
                              </div>
                              <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--navy))' }}>{criterio}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                            <DetailItem label="Origem">
                              {isEss ? 'Essencial (consultor)' : 'Automático (sistema)'}
                            </DetailItem>
                            <DetailItem label="Distância">
                              {distanciaTipo === 'real' && <span className="tabular-nums">{formatDistance(c.distancia!)} (coordenadas)</span>}
                              {distanciaTipo === 'cep' && <span className="italic text-muted-foreground">Estimado por CEP</span>}
                              {distanciaTipo === 'sem' && <span className="italic text-muted-foreground">Dado não disponível</span>}
                            </DetailItem>
                            <DetailItem label="Segmentos em comum">
                              {segsComum.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {segsComum.map(s => (
                                    <span key={s} className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'hsl(var(--teal))', color: 'white' }}>{s}</span>
                                  ))}
                                </div>
                              ) : <span className="italic text-muted-foreground">Nenhum em comum</span>}
                            </DetailItem>
                            <DetailItem label="Faixa de mensalidade">
                              {semMensalidade
                                ? <span className="italic text-muted-foreground">Dado não disponível na base fornecida.</span>
                                : <span>{c.escola.Mensalidade}{mesmaFaixa && <span className="ml-1 text-[10px]" style={{ color: 'hsl(var(--teal))' }}>● mesma faixa da analisada</span>}</span>}
                            </DetailItem>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </>
                );
              })}
              {concorrentes.length === 0 && (
                <tr><td colSpan={7} className="text-center py-6 text-sm text-muted-foreground italic">Nenhum concorrente encontrado com o raio atual.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-3 py-2 text-[11px] text-muted-foreground border-t" style={{ background: 'hsl(var(--beige))' }}>
          Dica: <strong>clique em uma linha</strong> para ver os critérios usados na seleção.
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
        {fromRaioAdjust && (
          <button
            onClick={onChangeRaio}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors hover:bg-accent"
            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--navy))' }}
          >
            <Settings2 className="w-4 h-4" />
            Alterar raio
          </button>
        )}
        <button
          onClick={onConfirm}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'hsl(var(--teal))' }}
        >
          <Check className="w-4 h-4" />
          Confirmar e seguir
        </button>
      </div>
    </div>
  );
}

function Indicator({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-indicator">
      <span className="card-indicator-label !mt-0">{label}</span>
      <div className="card-indicator-value" style={{ color: 'hsl(var(--navy))' }}>{value}</div>
    </div>
  );
}

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">{label}</div>
      <div className="text-sm" style={{ color: 'hsl(var(--navy))' }}>{children}</div>
    </div>
  );
}
