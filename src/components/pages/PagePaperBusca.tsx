import { useMemo, useState } from 'react';
import { Search, ArrowLeft, Check } from 'lucide-react';
import { EscolaData, ConsultorSession } from '@/lib/types';
import { useCarteiraManifest } from '@/hooks/useCarteiraManifest';
import { useCarteira } from '@/hooks/useCarteira';
import { resolveInepFromCarteira } from '@/lib/analysis';

interface Props {
  censoData: EscolaData[];
  onConfirm: (codigo: string) => void;
  onBack: () => void;
  /** Sessão do consultor logado — usada para mapear Protheus → INEP via carteira. */
  session?: ConsultorSession | null;
}

/**
 * Tela operacional de entrada do modo "Paper".
 * Não é capa de apresentação — é a etapa de busca da escola que terá
 * a concorrência analisada. Mantém a identidade visual aprovada e usa
 * apenas os tokens semânticos do design system.
 */
export default function PagePaperBusca({ censoData, onConfirm, onBack, session }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<EscolaData | null>(null);
  const [protheusErr, setProtheusErr] = useState('');

  // Carrega a carteira do consultor (se logado) — permite buscar pelo COD_PROTHEUS.
  const { findByCodigo, findByNome } = useCarteiraManifest();
  const entry = useMemo(() => {
    if (!session) return null;
    return findByCodigo(session.codigo) || findByNome(session.nome);
  }, [session, findByCodigo, findByNome]);
  const { data: carteira } = useCarteira(entry?.arquivo ?? null);

  /** Procura na carteira por COD_PROTHEUS (string ou número). Retorna o INEP se encontrar. */
  const inepFromProtheus = (q: string): { inep: string; nomeEscola: string } | null => {
    if (!carteira?.rows?.length) return null;
    const target = q.trim().toUpperCase();
    if (!target) return null;
    const row = carteira.rows.find(r => {
      const v = r['COD_PROTHEUS'];
      return v != null && String(v).trim().toUpperCase() === target;
    });
    if (!row) return null;
    const inep = row['COD_INEP'];
    const direto = inep != null ? String(inep).trim() : '';
    if (direto && direto !== '-') {
      return { inep: direto, nomeEscola: String(row['NOME ESCOLA'] || '') };
    }
    // Fallback: a linha da carteira tem o Protheus mas não tem INEP.
    // Tentamos resolver pelo censo a partir dos demais campos (nome, município, UF, coords).
    const resolved = resolveInepFromCarteira({
      nome: String(row['NOME ESCOLA'] ?? ''),
      municipio: String(row['MUNICIPIO'] ?? ''),
      uf: String(row['UF'] ?? ''),
      codMunicipio: row['COD MUNICIPIO'] as string | number | undefined,
      latitude: row['LATITUDE'] as string | number | undefined,
      longitude: row['LONGITUDE'] as string | number | undefined,
      codProtheus: row['COD_PROTHEUS'] as string | number | undefined,
    }, censoData);
    if (resolved) return { inep: resolved, nomeEscola: String(row['NOME ESCOLA'] || '') };
    return null;
  };

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 3) return [];
    const isNum = /^\d+$/.test(q);
    const censoMatches = censoData
      .filter(e => {
        if (isNum) return String(e['Código Inep']).includes(q);
        return String(e.Escola || '').toLowerCase().includes(q);
      })
      .slice(0, 8);
    // Sugestões adicionais via Protheus (apenas se houver carteira carregada e busca for numérica/alfanumérica curta)
    if (carteira?.rows?.length && q.length >= 2) {
      const qUp = query.trim().toUpperCase();
      const protheusHits: EscolaData[] = [];
      for (const r of carteira.rows) {
        if (protheusHits.length >= 5) break;
        const cod = r['COD_PROTHEUS'];
        if (cod != null && String(cod).toUpperCase().includes(qUp)) {
          const inep = String(r['COD_INEP'] || '').trim();
          if (!inep) continue;
          if (censoMatches.some(e => String(e['Código Inep']) === inep)) continue;
          const escola = censoData.find(e => String(e['Código Inep']) === inep);
          if (escola) protheusHits.push(escola);
        }
      }
      return [...protheusHits, ...censoMatches].slice(0, 10);
    }
    return censoMatches;
  }, [query, censoData, carteira]);

  const escolhe = (e: EscolaData) => {
    setPick(e);
    setQuery(`${e['Código Inep']} — ${e.Escola}`);
    setOpen(false);
  };

  const confirmar = () => {
    setProtheusErr('');
    if (pick) { onConfirm(String(pick['Código Inep'])); return; }
    const q = query.trim();
    if (!q) return;
    // 1) Tenta como Código Inep direto
    if (/^\d{6,}$/.test(q)) { onConfirm(q); return; }
    // 2) Tenta como Código Protheus na carteira do consultor
    const hit = inepFromProtheus(q);
    if (hit) { onConfirm(hit.inep); return; }
    // 3) Numérico curto sem match — provável Protheus inexistente
    if (/^[A-Za-z0-9]+$/.test(q) && session) {
      setProtheusErr(`Não encontramos o código "${q}" como INEP nem foi possível localizar a escola no censo a partir do Protheus na sua carteira.`);
      return;
    }
    if (/^\d+$/.test(q)) onConfirm(q);
  };

  const podeConfirmar = !!pick || /^[A-Za-z0-9]+$/.test(query.trim());

  return (
    <div className="max-w-2xl mx-auto py-10 sm:py-14 px-4 space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-xs font-semibold hover:underline focus-visible:ring-2 focus-visible:ring-primary rounded px-1"
        style={{ color: 'hsl(var(--teal))' }}
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Voltar
      </button>

      <header className="space-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--teal))' }}>
          Etapa 1 · Paper
        </span>
        <h1 className="page-title text-2xl sm:text-3xl">Buscar escola para gerar concorrência</h1>
        <p className="page-subtitle text-sm">
          Digite o <strong>nome da escola</strong>, o <strong>Código Inep</strong>{session ? <> ou o <strong>Código Protheus</strong></> : null}. O sistema busca na base e prepara a análise de concorrência.
        </p>
      </header>

      <div className="bg-card rounded-xl border p-4 sm:p-6 space-y-4">
        <label htmlFor="paper-busca" className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--navy))' }}>
          Escola a analisar
        </label>
        <div className="relative">
          <div className="flex items-center gap-2 border rounded-lg px-3 py-2.5 bg-background focus-within:ring-2 focus-within:ring-primary" style={{ borderColor: 'hsl(var(--border))' }}>
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              id="paper-busca"
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setPick(null); setOpen(true); setProtheusErr(''); }}
              onFocus={() => setOpen(true)}
              onKeyDown={e => { if (e.key === 'Enter' && podeConfirmar) confirmar(); }}
              placeholder={session ? 'Ex.: Colégio Modelo · 35012345 · 11882' : 'Ex.: Colégio Modelo  ou  35012345'}
              className="flex-1 bg-transparent outline-none text-sm"
              autoComplete="off"
              aria-autocomplete="list"
              aria-controls="paper-listbox"
              aria-expanded={open && matches.length > 0}
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Mínimo de 3 caracteres. Pressione Enter para buscar por Código Inep{session ? ' ou Protheus' : ''}.
          </p>
          {protheusErr && (
            <div role="alert" className="mt-2 text-xs px-3 py-2 rounded-lg border" style={{ background: 'hsl(0,84%,96%)', color: 'hsl(0,84%,38%)', borderColor: 'hsl(0,84%,88%)' }}>
              {protheusErr}
            </div>
          )}

          {open && matches.length > 0 && (
            <ul id="paper-listbox" role="listbox" className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto bg-card border rounded-lg shadow-lg">
              {matches.map(e => (
                <li key={String(e['Código Inep'])}>
                  <button
                    type="button"
                    onClick={() => escolhe(e)}
                    className="w-full text-left px-3 py-2 hover:bg-accent transition-colors"
                  >
                    <div className="text-sm font-medium" style={{ color: 'hsl(var(--navy))' }}>{e.Escola}</div>
                    <div className="text-[11px] text-muted-foreground">
                      Inep {String(e['Código Inep'])} · {e.Município}/{e.UF}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {open && query.trim().length >= 3 && matches.length === 0 && (
            <div className="absolute z-20 mt-1 w-full bg-card border rounded-lg shadow-lg px-3 py-3 text-xs text-muted-foreground">
              Nenhuma escola encontrada para "<strong>{query}</strong>".
            </div>
          )}
        </div>

        {pick && (
          <div className="rounded-lg border px-3 py-2.5" style={{ background: 'hsl(var(--teal-light))', borderColor: 'hsl(var(--teal-light))' }}>
            <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--teal))' }}>Escola selecionada</div>
            <div className="text-sm font-semibold mt-0.5" style={{ color: 'hsl(var(--navy))' }}>{pick.Escola}</div>
            <div className="text-[11px] text-muted-foreground">Inep {String(pick['Código Inep'])} · {pick.Município}/{pick.UF}</div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
        <button
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border bg-card hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary"
          style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--navy))' }}
        >
          Cancelar
        </button>
        <button
          onClick={confirmar}
          disabled={!podeConfirmar}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          style={{ background: 'hsl(var(--teal))' }}
        >
          <Check className="w-4 h-4" />
          Confirmar
        </button>
      </div>
    </div>
  );
}
