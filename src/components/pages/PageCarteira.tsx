import { useMemo, useState, useEffect } from 'react';
import { ConsultorSession, SetorizacaoRow } from '@/lib/types';
import { useSetorizacao } from '@/hooks/useSetorizacao';
import { ArrowUp, ArrowDown, Settings2, X, Search } from 'lucide-react';

interface Props {
  session: ConsultorSession;
  onPickEscola: (codInep: string, nomeEscola: string) => void;
  onBack: () => void;
}

const STORAGE_KEY = 'carteira:cols:v1';
const DEFAULT_COLS = ['COD_PROTHEUS', 'COD_INEP', 'NOME ESCOLA', 'MUNICIPIO', 'UF', 'TIPO ESCOLA', 'TOTAL'];

export default function PageCarteira({ session, onPickEscola, onBack }: Props) {
  const { rows, loading } = useSetorizacao(true);
  const [showColPicker, setShowColPicker] = useState(false);
  const [picked, setPicked] = useState<string[] | null>(null);
  const [confirmEscola, setConfirmEscola] = useState<SetorizacaoRow | null>(null);

  // Filter rows belonging to the consultor (by COD CONSULTOR or CONSULTOR name)
  const minhaCarteira = useMemo(() => {
    if (!rows.length) return [];
    const cod = String(session.codigo).trim();
    const nome = (session.nome || '').toLowerCase().trim();
    return rows.filter(r => {
      const c1 = String(r['COD CONSULTOR'] ?? '').trim();
      const c2 = String(r['CONSULTOR'] ?? '').toLowerCase().trim();
      return c1 === cod || (nome && c2 === nome);
    });
  }, [rows, session]);

  const allCols = useMemo(() => (rows[0] ? Object.keys(rows[0]) : []), [rows]);

  // Initialize picked columns when data loads
  useEffect(() => {
    if (!allCols.length) return;
    if (picked !== null) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        const valid = parsed.filter(c => allCols.includes(c));
        if (valid.length) { setPicked(valid); return; }
      }
    } catch {}
    setPicked(DEFAULT_COLS.filter(c => allCols.includes(c)));
  }, [allCols, picked]);

  // Show picker on first load if no saved selection
  useEffect(() => {
    if (!loading && rows.length && picked && !localStorage.getItem(STORAGE_KEY)) {
      setShowColPicker(true);
    }
  }, [loading, rows.length, picked]);

  const visibleCols = picked ?? DEFAULT_COLS;

  // Per-column filters
  const [colFilters, setColFilters] = useState<Record<string, string>>({});
  const setColFilter = (c: string, v: string) => setColFilters(p => ({ ...p, [c]: v }));

  // Sort
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const toggleSort = (c: string) => {
    if (sortCol === c) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(c); setSortDir('asc'); }
  };

  const filteredSorted = useMemo(() => {
    let out = minhaCarteira;
    const active = Object.entries(colFilters).filter(([, v]) => v.trim() !== '');
    if (active.length) {
      out = out.filter(r => active.every(([c, v]) => String(r[c] ?? '').toLowerCase().includes(v.toLowerCase())));
    }
    if (sortCol) {
      out = [...out].sort((a, b) => {
        const av = a[sortCol]; const bv = b[sortCol];
        const an = typeof av === 'number' ? av : parseFloat(String(av));
        const bn = typeof bv === 'number' ? bv : parseFloat(String(bv));
        let cmp: number;
        if (!isNaN(an) && !isNaN(bn)) cmp = an - bn;
        else cmp = String(av ?? '').localeCompare(String(bv ?? ''), 'pt-BR');
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return out;
  }, [minhaCarteira, colFilters, sortCol, sortDir]);

  const saveCols = (cols: string[]) => {
    setPicked(cols);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cols)); } catch {}
  };

  const handleRowDbl = (row: SetorizacaoRow) => {
    setConfirmEscola(row);
  };

  const confirmPaper = () => {
    if (!confirmEscola) return;
    const inep = String(confirmEscola['COD_INEP'] ?? '').trim();
    const nome = String(confirmEscola['NOME ESCOLA'] ?? '').trim();
    setConfirmEscola(null);
    onPickEscola(inep, nome);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-3">
          <div className="animate-spin w-10 h-10 border-4 rounded-full mx-auto" style={{ borderColor: 'hsl(var(--teal-light))', borderTopColor: 'hsl(var(--teal))' }} />
          <p className="text-sm text-muted-foreground">Carregando sua carteira...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-3 sm:px-4 space-y-4">
      {/* Context bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <button onClick={onBack} className="text-xs font-semibold mb-1" style={{ color: 'hsl(var(--teal))' }}>
            ← Voltar
          </button>
          <h1 className="page-title text-xl sm:text-2xl">Minha Carteira</h1>
          <p className="page-subtitle text-xs sm:text-sm">
            {session.nome} · {filteredSorted.length} de {minhaCarteira.length} escolas
          </p>
        </div>
        <button
          onClick={() => setShowColPicker(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border bg-card text-sm font-semibold hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary"
          style={{ color: 'hsl(var(--navy))' }}
        >
          <Settings2 className="w-4 h-4" /> Escolher colunas ({visibleCols.length})
        </button>
      </div>

      {minhaCarteira.length === 0 && (
        <div className="p-6 rounded-xl border bg-card text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma escola encontrada na sua carteira para o código <strong>{session.codigo}</strong>.
            Se você acha que isso está errado, fale com seu gestor para verificar a Setorização 2026.
          </p>
        </div>
      )}

      {/* Table */}
      {minhaCarteira.length > 0 && (
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr>
                  {visibleCols.map(c => (
                    <th key={c} className="text-left font-semibold py-2 px-3 border-b-2 whitespace-nowrap"
                      style={{ color: 'hsl(var(--navy))', borderColor: 'hsl(var(--teal))', background: 'hsl(var(--teal-light))' }}>
                      <button onClick={() => toggleSort(c)} className="inline-flex items-center gap-1 hover:underline focus-visible:ring-2 focus-visible:ring-primary rounded">
                        {c}
                        {sortCol === c && (sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                      </button>
                    </th>
                  ))}
                </tr>
                <tr>
                  {visibleCols.map(c => (
                    <th key={c + '-f'} className="py-1 px-2 border-b" style={{ background: 'hsl(var(--card))' }}>
                      <div className="relative">
                        <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          aria-label={`Filtrar ${c}`}
                          placeholder="Filtrar..."
                          value={colFilters[c] || ''}
                          onChange={e => setColFilter(c, e.target.value)}
                          className="w-full pl-7 pr-2 py-1 rounded border text-xs font-normal bg-background focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                        />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSorted.slice(0, 500).map((row, i) => (
                  <tr key={i}
                    onDoubleClick={() => handleRowDbl(row)}
                    className="cursor-pointer"
                    title="Clique duplo para gerar paper desta escola"
                  >
                    {visibleCols.map(c => (
                      <td key={c} className="py-2 px-3 border-b text-xs whitespace-nowrap" style={{ borderColor: 'hsl(var(--border))' }}>
                        {String(row[c] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredSorted.length > 500 && (
            <div className="px-3 py-2 text-xs text-muted-foreground border-t bg-muted">
              Exibindo as primeiras 500 linhas. Use os filtros das colunas para refinar.
            </div>
          )}
          <div className="px-3 py-2 text-xs text-muted-foreground border-t" style={{ background: 'hsl(var(--beige))' }}>
            Dica: <strong>clique duas vezes</strong> em uma escola para gerar o paper comercial.
          </div>
        </div>
      )}

      {/* Column picker modal */}
      {showColPicker && allCols.length > 0 && (
        <ColumnPicker
          allCols={allCols}
          selected={visibleCols}
          onClose={() => setShowColPicker(false)}
          onSave={cols => { saveCols(cols); setShowColPicker(false); }}
        />
      )}

      {/* Confirm modal */}
      {confirmEscola && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setConfirmEscola(null)}>
          <div className="bg-card rounded-2xl border max-w-md w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg" style={{ color: 'hsl(var(--navy))' }}>Gerar paper comercial?</h3>
            <p className="text-sm text-muted-foreground">
              Você selecionou: <strong className="text-foreground">{String(confirmEscola['NOME ESCOLA'] ?? '—')}</strong>
              {confirmEscola['MUNICIPIO'] && <> em <strong className="text-foreground">{String(confirmEscola['MUNICIPIO'])}/{String(confirmEscola['UF'] ?? '')}</strong></>}.
            </p>
            <p className="text-xs text-muted-foreground">Código Inep: {String(confirmEscola['COD_INEP'] ?? '—')}</p>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setConfirmEscola(null)} className="flex-1 py-2.5 rounded-lg border font-semibold text-sm hover:bg-accent">
                Cancelar
              </button>
              <button onClick={confirmPaper} className="flex-1 py-2.5 rounded-lg font-semibold text-sm text-primary-foreground bg-primary hover:opacity-90">
                Sim, gerar paper
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ColumnPicker({ allCols, selected, onClose, onSave }: {
  allCols: string[]; selected: string[]; onClose: () => void; onSave: (cols: string[]) => void;
}) {
  const [draft, setDraft] = useState<Set<string>>(new Set(selected));
  const toggle = (c: string) => {
    const n = new Set(draft);
    if (n.has(c)) n.delete(c); else n.add(c);
    setDraft(n);
  };
  const all = () => setDraft(new Set(allCols));
  const none = () => setDraft(new Set());

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl border max-w-lg w-full max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg" style={{ color: 'hsl(var(--navy))' }}>Escolher colunas</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Marque as informações que você quer ver na tabela.</p>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="p-2 rounded-lg hover:bg-accent"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-5 py-3 border-b flex gap-2">
          <button onClick={all} className="text-xs font-semibold px-3 py-1.5 rounded-lg border hover:bg-accent">Selecionar tudo</button>
          <button onClick={none} className="text-xs font-semibold px-3 py-1.5 rounded-lg border hover:bg-accent">Desmarcar tudo</button>
          <span className="ml-auto text-xs text-muted-foreground self-center">{draft.size} de {allCols.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {allCols.map(c => (
            <label key={c} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent cursor-pointer">
              <input
                type="checkbox"
                checked={draft.has(c)}
                onChange={() => toggle(c)}
                className="w-4 h-4 accent-[hsl(var(--teal))]"
              />
              <span className="text-sm">{c}</span>
            </label>
          ))}
        </div>
        <div className="p-4 border-t flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border font-semibold text-sm hover:bg-accent">Cancelar</button>
          <button
            onClick={() => onSave(Array.from(draft))}
            disabled={draft.size === 0}
            className="flex-1 py-2.5 rounded-lg font-semibold text-sm text-primary-foreground bg-primary hover:opacity-90 disabled:opacity-50"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
