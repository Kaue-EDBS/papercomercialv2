import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Check, SkipForward, Info, AlertTriangle } from 'lucide-react';
import { EscolaData } from '@/lib/types';

interface Props {
  escola: EscolaData;
  censoData: EscolaData[];
  initialEssenciais?: string[];
  onConfirm: (inepList: string[]) => void;
  onSkip: () => void;
  /** Permite registrar uma faixa de mensalidade informada manualmente quando o censo não traz o dado. */
  onMensalidadeOverride?: (faixa: string) => void;
}

const INTRO_HIDE_KEY = 'etapa2:intro:hide';
const MENSALIDADE_PROMPT_KEY = 'etapa2:mensalidadePrompt:dismissedFor';

const FAIXAS_MENSALIDADE: { value: string; label: string }[] = [
  { value: 'até 399', label: 'Até R$ 399' },
  { value: '400 a 799', label: 'R$ 400 a R$ 799' },
  { value: '800 a 1.399', label: 'R$ 800 a R$ 1.399' },
  { value: '1.400 a 2.399', label: 'R$ 1.400 a R$ 2.399' },
  { value: 'acima de R$ 2.400', label: 'Acima de R$ 2.400' },
];

/**
 * 2.1 — Concorrentes essenciais.
 * Autocomplete por nome OU código Inep. Permite escolher múltiplos.
 * "Sem sugestão" pula sem incluir essenciais.
 */
export default function PageConcEssenciais({ escola, censoData, initialEssenciais = [], onConfirm, onSkip, onMensalidadeOverride }: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>(initialEssenciais);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // ---- Aviso: escola sem dado de mensalidade ----
  const semMensalidade = !escola.Mensalidade || String(escola.Mensalidade).trim() === '' || String(escola.Mensalidade).trim() === '0';
  const inepKey = String(escola['Código Inep']);
  const [showMensModal, setShowMensModal] = useState(false);
  const [faixaPick, setFaixaPick] = useState<string>('');

  useEffect(() => {
    try {
      const hide = localStorage.getItem(INTRO_HIDE_KEY);
      if (hide !== '1') setShowIntro(true);
    } catch {
      setShowIntro(true);
    }
  }, []);

  // Sobe o aviso de mensalidade ao abrir a etapa, exceto se já foi dispensado para esta escola.
  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(MENSALIDADE_PROMPT_KEY);
      if (dismissed === inepKey) return;
    } catch { /* noop */ }
    setShowMensModal(true);
  }, [inepKey]);

  const closeMensModal = (persist: boolean) => {
    if (persist) {
      try { localStorage.setItem(MENSALIDADE_PROMPT_KEY, inepKey); } catch { /* noop */ }
    }
    setShowMensModal(false);
  };

  const confirmMensFaixa = () => {
    if (!faixaPick) return;
    onMensalidadeOverride?.(faixaPick);
    closeMensModal(true);
  };

  const closeIntro = (persist: boolean) => {
    if (persist) {
      try { localStorage.setItem(INTRO_HIDE_KEY, '1'); } catch { /* noop */ }
    }
    setShowIntro(false);
  };

  // Busca dentro do mesmo município por padrão (mais relevante p/ concorrência)
  const codMun = String(escola['Código Município']);
  const universoBusca = useMemo(
    () => censoData.filter(e => String(e['Código Município']) === codMun && String(e['Código Inep']) !== String(escola['Código Inep'])),
    [censoData, codMun, escola]
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const isNum = /^\d+$/.test(q);
    return universoBusca
      .filter(e => {
        if (selected.includes(String(e['Código Inep']))) return false;
        if (isNum) return String(e['Código Inep']).includes(q);
        return String(e.Escola || '').toLowerCase().includes(q);
      })
      .slice(0, 12);
  }, [query, universoBusca, selected]);

  const selectedEscolas = useMemo(
    () => selected.map(inep => censoData.find(e => String(e['Código Inep']) === inep)).filter(Boolean) as EscolaData[],
    [selected, censoData]
  );

  const add = (inep: string) => {
    setSelected(s => (s.includes(inep) ? s : [...s, inep]));
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
  };
  const remove = (inep: string) => setSelected(s => s.filter(x => x !== inep));

  return (
    <div className="max-w-3xl mx-auto py-8 sm:py-12 px-4 space-y-6">
      {semMensalidade && (
        <button
          type="button"
          onClick={() => setShowMensModal(true)}
          className="w-full flex items-start gap-2 px-3 py-2.5 rounded-lg border text-left text-xs hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary"
          style={{ background: 'hsl(40 95% 96%)', borderColor: 'hsl(40 80% 80%)' }}
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'hsl(40 80% 35%)' }} />
          <span>
            <strong style={{ color: 'hsl(var(--navy))' }}>Esta escola não possui mensalidade na base.</strong>{' '}
            <span className="text-muted-foreground">Clique para informar a faixa, se souber — isso melhora a comparação na apresentação.</span>
          </span>
        </button>
      )}

      <header className="space-y-1">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--teal))' }}>
            Etapa 2 · Validação de Concorrência (1/3)
          </span>
          <button
            type="button"
            onClick={() => setShowIntro(true)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold hover:underline focus-visible:ring-2 focus-visible:ring-primary rounded px-1"
            style={{ color: 'hsl(var(--teal))' }}
          >
            <Info className="w-3.5 h-3.5" /> Ver instruções
          </button>
        </div>
        <h2 className="page-title text-xl sm:text-2xl">Quais concorrentes você quer garantir na apresentação?</h2>
        <p className="page-subtitle text-sm">
          Digite o <strong>nome da escola</strong> ou o <strong>Código Inep</strong>. O sistema completa os demais concorrentes automaticamente.
        </p>
      </header>

      <div className="bg-card rounded-xl border p-4 sm:p-6 space-y-4">
        <label htmlFor="busca-essenciais" className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--navy))' }}>
          Buscar concorrente
        </label>
        <div className="relative">
          <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-background focus-within:ring-2" style={{ borderColor: 'hsl(var(--border))' }}>
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              ref={inputRef}
              id="busca-essenciais"
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              placeholder="Ex.: Colégio Modelo  ou  35012345"
              className="flex-1 bg-transparent outline-none text-sm"
              autoComplete="off"
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Mostramos apenas escolas do mesmo município de <strong>{escola.Município}</strong>.
          </p>

          {open && matches.length > 0 && (
            <ul role="listbox" className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto bg-card border rounded-lg shadow-lg">
              {matches.map(e => (
                <li key={String(e['Código Inep'])}>
                  <button
                    onClick={() => add(String(e['Código Inep']))}
                    className="w-full text-left px-3 py-2 hover:bg-accent transition-colors"
                  >
                    <div className="text-sm font-medium" style={{ color: 'hsl(var(--navy))' }}>{e.Escola}</div>
                    <div className="text-[11px] text-muted-foreground">Inep {String(e['Código Inep'])} · {e.Bairro || '—'}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {open && query.trim() && matches.length === 0 && (
            <div className="absolute z-20 mt-1 w-full bg-card border rounded-lg shadow-lg px-3 py-3 text-xs text-muted-foreground">
              Nenhuma escola encontrada para "<strong>{query}</strong>".
            </div>
          )}
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--navy))' }}>
            Selecionados ({selected.length})
          </div>
          {selectedEscolas.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Nenhum concorrente selecionado ainda.</p>
          ) : (
            <ul className="space-y-1.5">
              {selectedEscolas.map(e => (
                <li key={String(e['Código Inep'])} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border" style={{ background: 'hsl(var(--teal-light))' }}>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'hsl(var(--navy))' }}>{e.Escola}</div>
                    <div className="text-[11px] text-muted-foreground">Inep {String(e['Código Inep'])}</div>
                  </div>
                  <button onClick={() => remove(String(e['Código Inep']))} aria-label="Remover" className="p-1 rounded hover:bg-background">
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
        <button
          onClick={onSkip}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors hover:bg-accent"
          style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--navy))' }}
        >
          <SkipForward className="w-4 h-4" />
          Sem sugestão
        </button>
        <button
          onClick={() => onConfirm(selected)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'hsl(var(--teal))' }}
        >
          <Check className="w-4 h-4" />
          Confirmar
        </button>
      </div>

      {/* Modal de boas-vindas / instruções da Etapa 2 */}
      {showIntro && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => closeIntro(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="intro-etapa2-title"
        >
          <div
            className="bg-card rounded-2xl border max-w-md w-full p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--teal-light))' }}>
                  <Info className="w-5 h-5" style={{ color: 'hsl(var(--teal))' }} />
                </div>
                <h3 id="intro-etapa2-title" className="font-bold text-lg" style={{ color: 'hsl(var(--navy))' }}>
                  Validação de concorrência
                </h3>
              </div>
              <button
                onClick={() => closeIntro(false)}
                aria-label="Fechar"
                className="p-1 rounded-lg hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-sm text-foreground space-y-3">
              <p>Agora você vai conferir quais escolas concorrentes entrarão na apresentação.</p>
              <p>
                Você pode escolher algumas escolas manualmente, se achar importante.
                As demais serão completadas automaticamente pelo sistema.
              </p>
              <div>
                <p className="font-semibold mb-1" style={{ color: 'hsl(var(--navy))' }}>Antes de seguir, você ainda poderá:</p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>revisar a lista;</li>
                  <li>ver o mapa;</li>
                  <li>ajustar o raio, se precisar.</li>
                </ul>
              </div>
              <p>Quando terminar, clique em <strong>"Confirmar"</strong> para continuar.</p>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={e => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded border-input accent-current"
                style={{ accentColor: 'hsl(var(--teal))' }}
              />
              <span className="text-muted-foreground">Não mostrar de novo</span>
            </label>

            <div className="pt-1">
              <button
                onClick={() => closeIntro(dontShowAgain)}
                className="w-full py-2.5 rounded-lg font-semibold text-sm text-white hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                style={{ background: 'hsl(var(--teal))' }}
              >
                OK, entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: aviso de mensalidade ausente + escolha de faixa */}
      {showMensModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => closeMensModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mens-modal-title"
        >
          <div
            className="bg-card rounded-2xl border max-w-md w-full p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'hsl(40 95% 92%)' }}>
                  <AlertTriangle className="w-5 h-5" style={{ color: 'hsl(40 80% 35%)' }} />
                </div>
                <h3 id="mens-modal-title" className="font-bold text-lg" style={{ color: 'hsl(var(--navy))' }}>
                  {semMensalidade ? 'Sem dado de mensalidade' : 'Confirmar faixa de mensalidade'}
                </h3>
              </div>
              <button
                onClick={() => closeMensModal(false)}
                aria-label="Fechar"
                className="p-1 rounded-lg hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-sm text-foreground space-y-2">
              {semMensalidade ? (
                <>
                  <p>
                    A base do censo não traz a mensalidade de <strong style={{ color: 'hsl(var(--navy))' }}>{escola.Escola}</strong>.
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Se você souber a faixa praticada, selecione abaixo. Isso será usado nas comparações de mensalidade e posicionamento competitivo. Caso contrário, pode pular — a apresentação seguirá indicando "Dado não disponível".
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Temos a faixa <strong style={{ color: 'hsl(var(--navy))' }}>{String(escola.Mensalidade)}</strong> registrada para <strong style={{ color: 'hsl(var(--navy))' }}>{escola.Escola}</strong>.
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Se quiser ajustar a faixa para enriquecer a apresentação, selecione abaixo. Caso contrário, pode pular e seguimos com a faixa atual.
                  </p>
                </>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="faixa-mensalidade" className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--navy))' }}>
                Faixa de mensalidade (opcional)
              </label>
              <select
                id="faixa-mensalidade"
                value={faixaPick}
                onChange={e => setFaixaPick(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--navy))' }}
              >
                <option value="">Selecione uma faixa…</option>
                {FAIXAS_MENSALIDADE.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-1">
              <button
                onClick={() => closeMensModal(true)}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold border hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary"
                style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--navy))' }}
              >
                Pular
              </button>
              <button
                onClick={confirmMensFaixa}
                disabled={!faixaPick}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                style={{ background: 'hsl(var(--teal))' }}
              >
                Aplicar faixa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
