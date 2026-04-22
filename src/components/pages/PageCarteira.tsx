import { useEffect, useMemo, useState } from 'react';
import { ConsultorSession } from '@/lib/types';
import { useCarteiraManifest } from '@/hooks/useCarteiraManifest';
import { useCarteira, CarteiraFile } from '@/hooks/useCarteira';
import { ArrowUp, ArrowDown, Settings2, X, Search, AlertTriangle } from 'lucide-react';

interface Props {
  session: ConsultorSession;
  onPickEscola: (codInep: string, nomeEscola: string) => void;
  onBack: () => void;
}

const STORAGE_KEY = 'carteira:cols:v2';
const PRIORITY_COLS = ['COD_PROTHEUS', 'COD_INEP', 'NOME ESCOLA', 'MUNICIPIO', 'UF', 'CONSULTOR', 'GERENTE'];
const DEFAULT_COLS = ['COD_PROTHEUS', 'COD_INEP', 'NOME ESCOLA', 'MUNICIPIO', 'UF', 'TIPO ESCOLA'];

type Row = CarteiraFile['rows'][number];

export default function PageCarteira({ session, onPickEscola, onBack }: Props) {
  const { findByCodigo, findByNome, loading: loadingManifest } = useCarteiraManifest();
  const entry = useMemo(
    () => findByCodigo(session.codigo) || findByNome(session.nome),
    [session, findByCodigo, findByNome],
  );
  const arquivo = entry?.arquivo ?? null;
  const { data, loading, error } = useCarteira(arquivo);

  const [showColPicker, setShowColPicker] = useState(false);
  const [picked, setPicked] = useState<string[] | null>(null);
  const [confirmEscola, setConfirmEscola] = useState<Row | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [colFilters, setColFilters] = useState<Record<string, string>>({});
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const allCols = data?.headers ?? [];
  const rows = data?.rows ?? [];

  // Init picked columns
  useEffect(() => {
    if (!allCols.length || picked !== null) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        const valid = parsed.filter(c => allCols.includes(c));
        if (valid.length) { setPicked(valid); return; }
      }
    } catch { /* noop */ }
    setPicked(DEFAULT_COLS.filter(c => allCols.includes(c)));
  }, [allCols, picked]);

  const visibleCols = picked ?? DEFAULT_COLS;

  const setColFilter = (c: string, v: string) => setColFilters(p => ({ ...p, [c]: v }));

  const toggleSort = (c: string) => {
    if (sortCol === c) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(c); setSortDir('asc'); }
  };

  const filteredSorted = useMemo(() => {
    let out = rows;
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
  }, [rows, colFilters, sortCol, sortDir]);

  const saveCols = (cols: string[]) => {
    setPicked(cols);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cols)); } catch { /* noop */ }
  };

  const confirmPaper = () => {
    if (!confirmEscola) return;
    const inep = String(confirmEscola['COD_INEP'] ?? '').trim();
    const nome = String(confirmEscola['NOME ESCOLA'] ?? '').trim();
    setConfirmEscola(null);
    onPickEscola(inep, nome);
  };

  const selectedRow = selectedIdx !== null ? filteredSorted[selectedIdx] : null;

  if (loadingManifest || loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-3">
          <div className="animate-spin w-10 h-10 border-4 rounded-full mx-auto" style={{ borderColor: 'hsl(var(--teal-light))', borderTopColor: 'hsl(var(--teal))' }} />
          <p className="text-sm text-muted-foreground">Carregando sua carteira...</p>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4 space-y-4">
        <button onClick={onBack} className="text-xs font-semibold" style={{ color: 'hsl(var(--teal))' }}>← Voltar</button>
        <div className="p-6 rounded-xl border bg-card flex gap-3 items-start" role="alert">
          <AlertTriangle className="w-5 h-5 mt-0.5 text-amber-600 shrink-0" />
          <div>
            <h2 className="font-bold text-base mb-1" style={{ color: 'hsl(var(--navy))' }}>Carteira não localizada</h2>
            <p className="text-sm text-muted-foreground">
              Não encontramos o arquivo individual de carteira para o código <strong>{session.codigo}</strong> ({session.nome}).
              Fale com seu gestor para verificar.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Inconsistência: arquivo carregado pertence a outro consultor
  const inconsistente = !!data && !!entry && data.consultor.trim().toLowerCase() !== entry.consultor.trim().toLowerCase();

  if (error || inconsistente) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4 space-y-4">
        <button onClick={onBack} className="text-xs font-semibold" style={{ color: 'hsl(var(--teal))' }}>← Voltar</button>
        <div className="p-6 rounded-xl border bg-card flex gap-3 items-start" role="alert">
          <AlertTriangle className="w-5 h-5 mt-0.5 text-amber-600 shrink-0" />
          <div>
            <h2 className="font-bold text-base mb-1" style={{ color: 'hsl(var(--navy))' }}>
              {inconsistente ? 'Inconsistência no arquivo da carteira' : 'Não foi possível abrir a carteira'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {error || 'O arquivo carregado não corresponde ao consultor validado. Por segurança, a carteira não será exibida. Fale com seu gestor.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-3 sm:px-4 space-y-4">
      {/* Contexto da carteira */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <button onClick={onBack} className="text-xs font-semibold mb-1 inline-flex items-center gap-1 hover:underline focus-visible:ring-2 focus-visible:ring-primary rounded px-1" style={{ color: 'hsl(var(--teal))' }}>
            ← Voltar
          </button>
          <h1 className="page-title text-xl sm:text-2xl">Minha Carteira</h1>
          <p className="page-subtitle text-xs sm:text-sm">
            <strong>{entry.consultor}</strong> · Cód. {String(entry.codConsultor)}
            {entry.gerente && <> · Gerente: {entry.gerente}</>}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filteredSorted.length} de {rows.length} escolas no arquivo
            <span className="ml-2 opacity-70">({entry.arquivo})</span>
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

      {/* Ação principal — fica visível assim que houver seleção */}
      {selectedRow && (
        <div className="sticky top-0 z-20 -mx-3 sm:-mx-4 px-3 sm:px-4 py-3 border-b shadow-sm" style={{ background: 'hsl(var(--teal-light))' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-sm">
              <span className="text-muted-foreground">Escola selecionada:</span>{' '}
              <strong style={{ color: 'hsl(var(--navy))' }}>{String(selectedRow['NOME ESCOLA'] ?? '—')}</strong>
              {selectedRow['MUNICIPIO'] && <span className="text-muted-foreground"> · {String(selectedRow['MUNICIPIO'])}/{String(selectedRow['UF'] ?? '')}</span>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedIdx(null)}
                className="px-3 py-2 rounded-lg border text-xs font-semibold bg-card hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary"
              >
                Limpar seleção
              </button>
              <button
                onClick={() => setConfirmEscola(selectedRow)}
                className="px-4 py-2 rounded-lg font-semibold text-sm text-primary-foreground bg-primary hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Gerar paper desta escola
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabela */}
      {rows.length > 0 && (
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
            <table className="table-premium">
              <thead className="sticky top-0 z-10">
                <tr>
                  {visibleCols.map(c => (
                    <th key={c}>
                      <button
                        onClick={() => toggleSort(c)}
                        aria-label={`Ordenar por ${c}`}
                        className="inline-flex items-center gap-1 hover:underline focus-visible:ring-2 focus-visible:ring-primary rounded"
                      >
                        {c}
                        {sortCol === c && (sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                      </button>
                    </th>
                  ))}
                </tr>
                <tr>
                  {visibleCols.map(c => (
                    <th key={c + '-f'} className="!py-1 !px-2 !bg-card !border-b !border-t-0">
                      <div className="relative">
                        <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          aria-label={`Filtrar ${c}`}
                          placeholder="Filtrar..."
                          value={colFilters[c] || ''}
                          onChange={e => setColFilter(c, e.target.value)}
                          className="w-full pl-7 pr-2 py-1.5 rounded border text-xs font-normal bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSorted.slice(0, 500).map((row, i) => {
                  const sel = selectedIdx === i;
                  return (
                    <tr
                      key={i}
                      onClick={() => setSelectedIdx(i)}
                      onDoubleClick={() => setConfirmEscola(row)}
                      aria-selected={sel}
                      className={`cursor-pointer ${sel ? 'row-selected' : ''}`}
                      title="Clique para selecionar"
                    >
                      {visibleCols.map(c => (
                        <td key={c} className="whitespace-nowrap">{String(row[c] ?? '')}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredSorted.length > 500 && (
            <div className="px-3 py-2 text-xs text-muted-foreground border-t bg-muted">
              Exibindo as primeiras 500 linhas. Use os filtros das colunas para refinar.
            </div>
          )}
          <div className="px-3 py-2 text-xs text-muted-foreground border-t" style={{ background: 'hsl(var(--beige))' }}>
            Dica: <strong>clique</strong> em uma escola para selecionar e depois em <strong>"Gerar paper desta escola"</strong>.
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
          <div className="bg-card rounded-2xl border max-w-md w-full p-6 space-y-4" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="flex items-start justify-between">
              <h3 className="font-bold text-lg" style={{ color: 'hsl(var(--navy))' }}>Gerar paper comercial?</h3>
              <button onClick={() => setConfirmEscola(null)} aria-label="Fechar" className="p-1 rounded-lg hover:bg-accent"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-muted-foreground">
              Você selecionou: <strong className="text-foreground">{String(confirmEscola['NOME ESCOLA'] ?? '—')}</strong>
              {confirmEscola['MUNICIPIO'] && <> em <strong className="text-foreground">{String(confirmEscola['MUNICIPIO'])}/{String(confirmEscola['UF'] ?? '')}</strong></>}.
            </p>
            <p className="text-xs text-muted-foreground">Código Inep: {String(confirmEscola['COD_INEP'] ?? '—')}</p>
            <p className="text-xs" style={{ color: 'hsl(var(--teal))' }}>
              Ao confirmar, você seguirá para a etapa de validação dos concorrentes.
            </p>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setConfirmEscola(null)} className="flex-1 py-2.5 rounded-lg border font-semibold text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary">
                Cancelar
              </button>
              <button onClick={confirmPaper} className="flex-1 py-2.5 rounded-lg font-semibold text-sm text-primary-foreground bg-primary hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                Confirmar e gerar paper
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
  const [search, setSearch] = useState('');

  const toggle = (c: string) => {
    const n = new Set(draft);
    if (n.has(c)) n.delete(c); else n.add(c);
    setDraft(n);
  };
  const all = () => setDraft(new Set(allCols));
  const none = () => setDraft(new Set());

  const ordered = useMemo(() => {
    const top = PRIORITY_COLS.filter(c => allCols.includes(c));
    const rest = allCols.filter(c => !top.includes(c));
    return [...top, ...rest];
  }, [allCols]);

  const filtered = useMemo(
    () => ordered.filter(c => c.toLowerCase().includes(search.toLowerCase())),
    [ordered, search],
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl border max-w-lg w-full max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="p-5 border-b flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg" style={{ color: 'hsl(var(--navy))' }}>Escolher colunas</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Marque as informações que você quer ver na tabela.</p>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="p-2 rounded-lg hover:bg-accent"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-5 py-3 border-b space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar coluna pelo nome..."
              aria-label="Buscar coluna"
              className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={all} className="text-xs font-semibold px-3 py-1.5 rounded-lg border hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary">Selecionar tudo</button>
            <button onClick={none} className="text-xs font-semibold px-3 py-1.5 rounded-lg border hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary">Desmarcar tudo</button>
            <span className="ml-auto text-sm font-bold" style={{ color: 'hsl(var(--teal))' }}>
              {draft.size} <span className="font-normal text-muted-foreground">de {allCols.length}</span>
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {filtered.map(c => {
            const isPriority = PRIORITY_COLS.includes(c);
            const checked = draft.has(c);
            return (
              <label key={c} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(c)}
                  className="w-5 h-5 accent-[hsl(var(--teal))] cursor-pointer"
                />
                <span className="text-sm flex-1">{c}</span>
                {isPriority && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--teal-light))', color: 'hsl(var(--navy))' }}>
                    sugerida
                  </span>
                )}
              </label>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">Nenhuma coluna corresponde à busca.</p>
          )}
        </div>
        <div className="p-4 border-t flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border font-semibold text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary">Cancelar</button>
          <button
            onClick={() => onSave(Array.from(draft))}
            disabled={draft.size === 0}
            className="flex-1 py-2.5 rounded-lg font-semibold text-sm text-primary-foreground bg-primary hover:opacity-90 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}