import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronRight, Info, MapPin, GraduationCap, BookMarked, Star, X } from 'lucide-react';
import { EscolaData, ConcorrenteInfo } from '@/lib/types';
import { num, formatNumber, formatDistance, getSegmentos, getMensalidadeFaixa } from '@/lib/analysis';

interface Props {
  escola: EscolaData;
  concorrentes: ConcorrenteInfo[];
  essenciaisInep?: string[];
  /** modo 'apresentacao' esconde ações de edição (excluir/substituir). */
  mode?: 'validacao' | 'apresentacao';
  /** Quando informado, render botão de excluir e dispara o callback. */
  onRemove?: (inep: string, nome: string) => void;
  /** Sincroniza linha aberta com clique externo (ex.: marker do mapa). */
  expandedInep?: string | null;
  onExpandedChange?: (inep: string | null) => void;
  /** Cabeçalho/dica opcional acima da tabela (ex.: "clique para detalhar"). */
  caption?: ReactNode;
}

/**
 * Tabela unificada de concorrência — usada na Validação (Etapa 2.2) e na
 * Apresentação (Etapa 3 — slide de Concorrência).
 *
 * - Escola em análise fixa no topo, badge "Em análise", contraste visual.
 * - Expansão inline com 3 blocos: Localização e Perfil, Oferta Educacional, Relação com a Editora.
 * - Mesmas chips, mesma linguagem de distância/proximidade da validação.
 */
export default function ConcorrenciaTable({
  escola,
  concorrentes,
  essenciaisInep = [],
  mode = 'apresentacao',
  onRemove,
  expandedInep: controlledExpanded,
  onExpandedChange,
  caption,
}: Props) {
  const essenciaisSet = new Set(essenciaisInep.map(String));
  const [internalExpanded, setInternalExpanded] = useState<string | null>(null);
  const isControlled = controlledExpanded !== undefined;
  const expanded = isControlled ? controlledExpanded : internalExpanded;

  const toggle = (inep: string) => {
    const next = expanded === inep ? null : inep;
    if (isControlled) onExpandedChange?.(next);
    else setInternalExpanded(next);
  };

  const colCount = 8;

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      <div className="overflow-x-auto max-h-[65vh] overflow-y-auto overscroll-contain">
        <table className="table-premium">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="w-8" aria-label="Expandir"></th>
              <th className="min-w-[240px]">Escola</th>
              <th className="w-28">Origem</th>
              <th className="w-24">Matr.</th>
              <th className="w-28">Distância</th>
              <th className="w-32">Segmentos</th>
              <th className="w-28">Mensalidade</th>
              <th className="w-10" aria-label="Ações"></th>
            </tr>
          </thead>
          <tbody>
            {/* Escola em análise — sempre fixa no topo, com destaque */}
            <EscolaRow
              escola={escola}
              isOpen={expanded === String(escola['Código Inep'])}
              onToggle={() => toggle(String(escola['Código Inep']))}
            />

            {concorrentes.map(c => {
              const inep = String(c.escola['Código Inep']);
              const isEss = essenciaisSet.has(inep);
              const isOpen = expanded === inep;
              const segs = getSegmentos(c.escola);
              const mesmaFaixa =
                getMensalidadeFaixa(escola.Mensalidade) === getMensalidadeFaixa(c.escola.Mensalidade);
              const semMensalidade = !c.escola.Mensalidade || c.escola.Mensalidade === '0';
              const distanciaTipo: 'real' | 'cep' | 'sem' =
                c.distancia !== null ? 'real' : c.proximidadeCEP ? 'cep' : 'sem';
              const criterio = isEss
                ? 'Incluída manualmente pelo consultor (essencial).'
                : distanciaTipo === 'real'
                  ? 'Selecionada por proximidade geográfica e segmentos em comum.'
                  : distanciaTipo === 'cep'
                    ? 'Selecionada por proximidade estimada (CEP) e segmentos em comum.'
                    : 'Selecionada pelo critério da área de influência.';

              return (
                <>
                  <tr
                    key={inep}
                    onClick={() => toggle(inep)}
                    className={`cursor-pointer ${isOpen ? 'row-selected' : ''}`}
                    aria-expanded={isOpen}
                    aria-selected={isOpen}
                    title="Clique para ver os detalhes desta escola"
                  >
                    <td className="text-center align-middle">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggle(inep); }}
                        aria-label={isOpen ? 'Recolher detalhes' : 'Expandir detalhes'}
                        className="p-1 rounded hover:bg-background/60 focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </td>
                    <td>
                      <div className="font-medium text-sm leading-snug" style={{ color: 'hsl(var(--navy))', textTransform: 'none' }}>
                        {c.escola.Escola}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <span className="uppercase tracking-wider">INEP</span>
                        <span className="font-mono tabular-nums">{inep}</span>
                      </div>
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
                        <span className="text-sm tabular-nums font-medium" style={{ color: 'hsl(var(--navy))' }}>
                          {formatDistance(c.distancia)}
                        </span>
                      ) : c.proximidadeCEP ? (
                        <span className="text-[11px] inline-flex items-center gap-1 text-muted-foreground" title="Distância estimada com base no CEP">
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
                        <span className="text-[11px] italic text-muted-foreground">— não informado</span>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-medium tabular-nums" style={{ color: 'hsl(var(--navy))' }}>
                            {c.escola.Mensalidade}
                          </span>
                          {mesmaFaixa && (
                            <span className="text-[10px] inline-flex items-center gap-1" style={{ color: 'hsl(var(--teal))' }}>● mesma faixa</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="text-center align-middle">
                      {mode === 'validacao' && onRemove ? (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onRemove(inep, c.escola.Escola); }}
                          aria-label={`Excluir ${c.escola.Escola}`}
                          title="Excluir concorrente"
                          className="p-1.5 rounded hover:bg-background/60 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      ) : null}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr key={inep + '-detail'} style={{ background: 'hsl(var(--beige) / 0.5)' }}>
                      <td colSpan={colCount} className="px-4 py-3">
                        <ExpandedDetail
                          escola={c.escola}
                          escolaAnalisada={escola}
                          criterio={criterio}
                          isEssencial={isEss}
                          distanciaTipo={distanciaTipo}
                          distancia={c.distancia}
                          segmentosComum={c.segmentosComum}
                        />
                      </td>
                    </tr>
                  )}
                </>
              );
            })}

            {concorrentes.length === 0 && (
              <tr>
                <td colSpan={colCount} className="text-center py-6 text-sm text-muted-foreground italic">
                  Nenhum concorrente encontrado com o raio atual.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {caption && (
        <div className="px-3 py-2 text-[11px] text-muted-foreground border-t" style={{ background: 'hsl(var(--beige))' }}>
          {caption}
        </div>
      )}
    </div>
  );
}

function EscolaRow({ escola, isOpen, onToggle }: { escola: EscolaData; isOpen: boolean; onToggle: () => void }) {
  const segs = getSegmentos(escola);
  const semMensalidade = !escola.Mensalidade || escola.Mensalidade === '0';
  return (
    <>
      <tr
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-selected={isOpen}
        className="cursor-pointer"
        style={{
          // contraste forte para destacar a escola em análise
          background: 'hsl(174 62% 35% / 0.10)',
          boxShadow: 'inset 3px 0 0 0 hsl(var(--teal))',
        }}
        title="Escola em análise"
      >
        <td className="text-center align-middle">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            aria-label={isOpen ? 'Recolher detalhes' : 'Expandir detalhes'}
            className="p-1 rounded hover:bg-background/60 focus-visible:ring-2 focus-visible:ring-primary"
          >
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </td>
        <td>
          <div className="flex items-center gap-2 flex-wrap">
            <Star className="w-3.5 h-3.5 fill-current" style={{ color: 'hsl(var(--teal))' }} />
            <span className="font-bold text-sm leading-snug" style={{ color: 'hsl(var(--navy))', textTransform: 'none' }}>
              {escola.Escola}
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <span className="uppercase tracking-wider">INEP</span>
            <span className="font-mono tabular-nums">{String(escola['Código Inep'])}</span>
          </div>
        </td>
        <td>
          <span
            className="chip"
            style={{
              background: 'hsl(var(--navy))',
              color: 'white',
              borderColor: 'hsl(var(--navy))',
            }}
          >
            ★ Em análise
          </span>
        </td>
        <td className="font-bold tabular-nums" style={{ color: 'hsl(var(--navy))' }}>
          {formatNumber(num(escola['Alunado Total']))}
        </td>
        <td>
          <span className="text-[11px] italic text-muted-foreground">—</span>
        </td>
        <td>
          <div className="flex gap-1 flex-wrap">
            {segs.map(s => <span key={s} className="chip chip-segmento">{s}</span>)}
          </div>
        </td>
        <td>
          {semMensalidade ? (
            <span className="text-[11px] italic text-muted-foreground">— não informado</span>
          ) : (
            <span className="text-xs font-bold tabular-nums" style={{ color: 'hsl(var(--navy))' }}>
              {escola.Mensalidade}
            </span>
          )}
        </td>
        <td />
      </tr>
      {isOpen && (
        <tr style={{ background: 'hsl(var(--beige) / 0.5)' }}>
          <td colSpan={8} className="px-4 py-3">
            <ExpandedDetail
              escola={escola}
              escolaAnalisada={escola}
              isOwn
            />
          </td>
        </tr>
      )}
    </>
  );
}

function ExpandedDetail({
  escola,
  escolaAnalisada,
  criterio,
  isEssencial,
  distanciaTipo,
  distancia,
  segmentosComum,
  isOwn,
}: {
  escola: EscolaData;
  escolaAnalisada: EscolaData;
  criterio?: string;
  isEssencial?: boolean;
  distanciaTipo?: 'real' | 'cep' | 'sem';
  distancia?: number | null;
  segmentosComum?: string[];
  isOwn?: boolean;
}) {
  const segs = getSegmentos(escola);
  const adocao = formatAdocao(escola['Tipo de Adoção']);
  const adotaBrasil = formatAdotaBrasil(escola['Adota Brasil']);
  const semMensalidade = !escola.Mensalidade || escola.Mensalidade === '0';
  const mesmaFaixa = !isOwn &&
    getMensalidadeFaixa(escolaAnalisada.Mensalidade) === getMensalidadeFaixa(escola.Mensalidade);

  return (
    <div className="space-y-3">
      {!isOwn && criterio && (
        <div
          className="rounded-lg border bg-card p-3 flex items-start gap-2"
          style={{ borderColor: 'hsl(var(--teal-light))' }}
        >
          <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'hsl(var(--teal))' }} />
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--teal))' }}>
              Por que esta escola foi incluída?
            </div>
            <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--navy))' }}>{criterio}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Bloco 1 — Localização e Perfil */}
        <DetailBlock title="Localização e Perfil" icon={<MapPin className="w-3.5 h-3.5" />}>
          <DetailItem label="Endereço">
            {[escola.Endereço, escola.Número].filter(Boolean).join(', ') || <Empty />}
            {escola.Bairro && <div className="text-muted-foreground">{escola.Bairro}</div>}
          </DetailItem>
          <DetailItem label="Município">
            {escola.Município}/{escola.UF}
          </DetailItem>
          <DetailItem label="CEP">{escola.CEP || <Empty />}</DetailItem>
          {!isOwn && (
            <DetailItem label="Distância">
              {distanciaTipo === 'real' && (
                <span className="tabular-nums">{formatDistance(distancia!)} (coordenadas)</span>
              )}
              {distanciaTipo === 'cep' && <span className="italic text-muted-foreground">Estimado por CEP</span>}
              {distanciaTipo === 'sem' && <span className="italic text-muted-foreground">Dado não disponível</span>}
            </DetailItem>
          )}
        </DetailBlock>

        {/* Bloco 2 — Oferta Educacional */}
        <DetailBlock title="Oferta Educacional" icon={<GraduationCap className="w-3.5 h-3.5" />}>
          <DetailItem label="Segmentos atendidos">
            <div className="flex gap-1 flex-wrap">
              {segs.length > 0 ? segs.map(s => <span key={s} className="chip chip-segmento">{s}</span>) : <Empty />}
            </div>
          </DetailItem>
          {!isOwn && (
            <DetailItem label="Segmentos em comum">
              {segmentosComum && segmentosComum.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {segmentosComum.map(s => (
                    <span
                      key={s}
                      className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ background: 'hsl(var(--teal))', color: 'white' }}
                    >{s}</span>
                  ))}
                </div>
              ) : <span className="italic text-muted-foreground">Nenhum em comum</span>}
            </DetailItem>
          )}
          <DetailItem label="Matrículas totais">
            <span className="tabular-nums font-semibold">{formatNumber(num(escola['Alunado Total']))}</span>
          </DetailItem>
          <DetailItem label="Mensalidade">
            {semMensalidade ? (
              <span className="italic text-muted-foreground">Dado não disponível na base fornecida.</span>
            ) : (
              <span>
                {escola.Mensalidade}
                {!isOwn && mesmaFaixa && (
                  <span className="ml-1 text-[10px]" style={{ color: 'hsl(var(--teal))' }}>● mesma faixa</span>
                )}
              </span>
            )}
          </DetailItem>
        </DetailBlock>

        {/* Bloco 3 — Relação com a Editora */}
        <DetailBlock title="Relação com a Editora" icon={<BookMarked className="w-3.5 h-3.5" />}>
          <DetailItem label="Tipo de Adoção">{adocao}</DetailItem>
          <DetailItem label="Adota Editora do Brasil">{adotaBrasil}</DetailItem>
          {!isOwn && (
            <DetailItem label="Origem na lista">
              {isEssencial ? 'Essencial (consultor)' : 'Automático (sistema)'}
            </DetailItem>
          )}
        </DetailBlock>
      </div>
    </div>
  );
}

function DetailBlock({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-3" style={{ borderColor: 'hsl(var(--teal-light))' }}>
      <div className="flex items-center gap-1.5 mb-2">
        <span style={{ color: 'hsl(var(--teal))' }}>{icon}</span>
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--teal))' }}>
          {title}
        </span>
      </div>
      <div className="space-y-2 text-xs">{children}</div>
    </div>
  );
}

function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">{label}</div>
      <div className="text-xs" style={{ color: 'hsl(var(--navy))' }}>{children}</div>
    </div>
  );
}

function Empty() {
  return <span className="italic text-muted-foreground">—</span>;
}

function formatAdocao(tipo: string): string {
  if (!tipo) return 'Dado não disponível';
  const upper = tipo.toUpperCase().trim();
  if (upper === 'NÃO' || upper === 'NAO') return 'Sem dados';
  if (upper === 'DID' || upper === 'DID/AP') return 'Didático';
  return tipo;
}

function formatAdotaBrasil(val: string): string {
  if (!val) return 'Dado não disponível';
  const upper = val.toUpperCase().trim();
  if (upper === 'NÃO' || upper === 'NAO') return 'Não';
  return val;
}