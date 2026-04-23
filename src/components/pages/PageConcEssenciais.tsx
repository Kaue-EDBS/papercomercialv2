import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Check, SkipForward, Info } from 'lucide-react';
import { EscolaData } from '@/lib/types';

interface Props {
  escola: EscolaData;
  censoData: EscolaData[];
  initialEssenciais?: string[];
  onConfirm: (inepList: string[]) => void;
  onSkip: () => void;
}

const INTRO_HIDE_KEY = 'etapa2:intro:hide';

/**
 * 2.1 — Concorrentes essenciais.
 * Autocomplete por nome OU código Inep. Permite escolher múltiplos.
 * "Sem sugestão" pula sem incluir essenciais.
 */
export default function PageConcEssenciais({ escola, censoData, initialEssenciais = [], onConfirm, onSkip }: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>(initialEssenciais);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    try {
      const hide = localStorage.getItem(INTRO_HIDE_KEY);
      if (hide !== '1') setShowIntro(true);
    } catch {
      setShowIntro(true);
    }
  }, []);

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
      <header className="space-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--teal))' }}>
          Etapa 2 · Validação de Concorrência (1/3)
        </span>
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
    </div>
  );
}
