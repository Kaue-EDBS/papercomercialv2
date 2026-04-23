import { useMemo, useState } from 'react';
import { AnalysisResult, EscolaData } from '@/lib/types';
import { Check, Settings2, X, Search, Trash2 } from 'lucide-react';
import ConcorrenciaTable from '@/components/concorrencia/ConcorrenciaTable';

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

      <ConcorrenciaTable
        escola={escola}
        concorrentes={concorrentes}
        essenciaisInep={essenciaisInep}
        mode="validacao"
        onRemove={(inep, nome) => setAskRemove({ inep, nome })}
        caption={
          <>
            Dica: <strong>clique em uma linha</strong> para ver os critérios da seleção. Use o
            <strong> X</strong> à direita para substituir ou remover um concorrente.
          </>
        }
      />

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

      {askRemove && (
        <RemoveModal
          nome={askRemove.nome}
          onCancel={() => setAskRemove(null)}
          onAuto={() => { onRemoveConcorrente(askRemove.inep, 'auto'); setAskRemove(null); }}
          onLeave={() => { onRemoveConcorrente(askRemove.inep, 'leave'); setAskRemove(null); }}
          onManual={() => { setPickReplaceFor(askRemove); setAskRemove(null); }}
        />
      )}

      {pickReplaceFor && (
        <ManualPickModal
          escola={escola}
          censoData={censoData}
          jaPresentes={concorrentes.map(c => String(c.escola['Código Inep']))}
          forNome={pickReplaceFor.nome}
          onCancel={() => setPickReplaceFor(null)}
          onPick={(inep) => {
            onRemoveConcorrente(pickReplaceFor.inep, { manualInep: inep });
            setPickReplaceFor(null);
          }}
        />
      )}
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

function RemoveModal({
  nome, onCancel, onAuto, onLeave, onManual,
}: { nome: string; onCancel: () => void; onAuto: () => void; onLeave: () => void; onManual: () => void; }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-card rounded-2xl border max-w-md w-full p-5 sm:p-6 space-y-4" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="remove-title">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <Trash2 className="w-5 h-5 mt-0.5" style={{ color: 'hsl(var(--teal))' }} />
            <div>
              <h3 id="remove-title" className="font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>Excluir concorrente?</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Você está removendo <strong className="text-foreground">{nome}</strong> da lista. Como deseja proceder?</p>
            </div>
          </div>
          <button onClick={onCancel} aria-label="Fechar" className="p-1 rounded hover:bg-accent"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-2">
          <ChoiceButton title="Indicar outra escola" desc="Buscar manualmente uma escola para ocupar a vaga." onClick={onManual} primary />
          <ChoiceButton title="Substituir automaticamente" desc="O sistema escolhe o próximo concorrente elegível pelo mesmo critério." onClick={onAuto} />
          <ChoiceButton title="Deixar sem substituição" desc="A lista segue com um concorrente a menos." onClick={onLeave} />
          <ChoiceButton title="Cancelar exclusão" desc="Mantém o concorrente na lista." onClick={onCancel} ghost />
        </div>
      </div>
    </div>
  );
}

function ChoiceButton({ title, desc, onClick, primary, ghost }: { title: string; desc: string; onClick: () => void; primary?: boolean; ghost?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-3 py-2.5 rounded-lg border transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary"
      style={{
        borderColor: primary ? 'hsl(var(--teal))' : 'hsl(var(--border))',
        background: primary ? 'hsl(var(--teal-light))' : ghost ? 'transparent' : 'hsl(var(--card))',
      }}
    >
      <div className="text-sm font-semibold" style={{ color: 'hsl(var(--navy))' }}>{title}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{desc}</div>
    </button>
  );
}

function ManualPickModal({
  escola, censoData, jaPresentes, forNome, onCancel, onPick,
}: {
  escola: EscolaData;
  censoData: EscolaData[];
  jaPresentes: string[];
  forNome: string;
  onCancel: () => void;
  onPick: (inep: string) => void;
}) {
  const [query, setQuery] = useState('');
  const codMun = String(escola['Código Município']);
  const presentesSet = useMemo(() => new Set(jaPresentes.map(String)), [jaPresentes]);
  const ownInep = String(escola['Código Inep']);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const isNum = /^\d+$/.test(q);
    return censoData
      .filter(e => {
        const inep = String(e['Código Inep']);
        if (inep === ownInep) return false;
        if (presentesSet.has(inep)) return false;
        // Mantém foco no mesmo município por padrão, mas permite INEP exato fora dele
        if (!isNum && String(e['Código Município']) !== codMun) return false;
        if (isNum) return inep.includes(q);
        return String(e.Escola || '').toLowerCase().includes(q);
      })
      .slice(0, 12);
  }, [query, censoData, presentesSet, ownInep, codMun]);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-card rounded-2xl border max-w-lg w-full max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="p-5 border-b flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-base" style={{ color: 'hsl(var(--navy))' }}>Indicar outra escola</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Substituindo <strong className="text-foreground">{forNome}</strong>. Busque por nome ou Código Inep.</p>
          </div>
          <button onClick={onCancel} aria-label="Fechar" className="p-2 rounded-lg hover:bg-accent"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-5 py-3 border-b">
          <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-background focus-within:ring-2 focus-within:ring-primary" style={{ borderColor: 'hsl(var(--border))' }}>
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ex.: Colégio Modelo  ou  35012345"
              aria-label="Buscar escola"
              className="flex-1 bg-transparent outline-none text-sm"
              autoComplete="off"
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Por padrão, mostramos escolas do mesmo município de <strong>{escola.Município}</strong>.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {matches.length === 0 && query.trim().length >= 2 && (
            <p className="text-xs text-muted-foreground text-center py-8">Nenhuma escola encontrada.</p>
          )}
          {matches.length === 0 && query.trim().length < 2 && (
            <p className="text-xs text-muted-foreground text-center py-8">Digite ao menos 2 caracteres.</p>
          )}
          <ul>
            {matches.map(e => (
              <li key={String(e['Código Inep'])}>
                <button
                  type="button"
                  onClick={() => onPick(String(e['Código Inep']))}
                  className="w-full text-left px-5 py-2.5 hover:bg-accent border-b last:border-0 focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="text-sm font-medium" style={{ color: 'hsl(var(--navy))' }}>{e.Escola}</div>
                  <div className="text-[11px] text-muted-foreground">Inep {String(e['Código Inep'])} · {e.Bairro || e.Município}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4 border-t flex justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg border font-semibold text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary" style={{ color: 'hsl(var(--navy))' }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
