import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AnalysisResult, AppPage } from '@/lib/types';
import PageResumo from './PageResumo';
import PagePanorama from './PagePanorama';
import PageConcorrencia from './PageConcorrencia';
import PageMarketShare from './PageMarketShare';
import PageMensalidade from './PageMensalidade';
import PageSocioeconomico from './PageSocioeconomico';
import PageInsights from './PageInsights';
import PageEncerramento from './PageEncerramento';

interface Props {
  a1: AnalysisResult;
  a2: AnalysisResult;
}

const COMPARATIVE_PAGES: { id: Exclude<AppPage, 'login' | 'modo' | 'carteira' | 'capa' | 'tipo' | 'abertura' | 'concEssenciais' | 'concTabela' | 'concMapa'>; label: string; short: string }[] = [
  { id: 'resumo', label: 'Resumo Executivo', short: '1' },
  { id: 'panorama', label: 'Panorama', short: '2' },
  { id: 'concorrencia', label: 'Concorrência', short: '3' },
  { id: 'marketshare', label: 'Market Share', short: '4' },
  { id: 'mensalidade', label: 'Mensalidade', short: '5' },
  { id: 'socioeconomico', label: 'Socioeconômico', short: '6' },
  { id: 'insights', label: 'Insights', short: '7' },
  { id: 'encerramento', label: 'Encerramento', short: '8' },
];

type CompPage = typeof COMPARATIVE_PAGES[number]['id'];

function renderPage(page: CompPage, analysis: AnalysisResult) {
  switch (page) {
    case 'resumo':         return <PageResumo analysis={analysis} />;
    case 'panorama':       return <PagePanorama analysis={analysis} />;
    case 'concorrencia':   return <PageConcorrencia analysis={analysis} />;
    case 'marketshare':    return <PageMarketShare analysis={analysis} />;
    case 'mensalidade':    return <PageMensalidade analysis={analysis} />;
    case 'socioeconomico': return <PageSocioeconomico analysis={analysis} />;
    case 'insights':       return <PageInsights analysis={analysis} />;
    case 'encerramento':   return <PageEncerramento />;
  }
}

/**
 * Comparativo aprofundado: mesmo fluxo de páginas analíticas, lado a lado.
 * Navegação sincronizada (ambas colunas exibem a mesma página).
 */
export default function ComparativeModule({ a1, a2 }: Props) {
  const [page, setPage] = useState<CompPage>('resumo');
  const idx = COMPARATIVE_PAGES.findIndex(p => p.id === page);

  const goNext = useCallback(() => {
    if (idx < COMPARATIVE_PAGES.length - 1) setPage(COMPARATIVE_PAGES[idx + 1].id);
  }, [idx]);
  const goPrev = useCallback(() => {
    if (idx > 0) setPage(COMPARATIVE_PAGES[idx - 1].id);
  }, [idx]);

  // Atalhos de teclado
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  return (
    <div className="space-y-3">
      {/* Wizard de páginas comparativas */}
      <nav
        className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-6 py-2 border-b bg-card overflow-x-auto scrollbar-hide sticky top-0 z-20"
        aria-label="Navegação do comparativo"
      >
        {COMPARATIVE_PAGES.map(p => (
          <button
            key={p.id}
            onClick={() => setPage(p.id)}
            className={`nav-pill whitespace-nowrap text-[10px] sm:text-xs ${page === p.id ? 'nav-pill-active' : ''}`}
            aria-current={page === p.id ? 'page' : undefined}
          >
            <span className="font-bold mr-0.5 sm:mr-1">{p.short}</span>
            <span className="hidden md:inline">{p.label}</span>
          </button>
        ))}
        <span className="ml-auto text-[10px] sm:text-xs font-semibold whitespace-nowrap" style={{ color: 'hsl(var(--navy))' }}>
          {idx + 1} / {COMPARATIVE_PAGES.length}
        </span>
      </nav>

      {/* Cabeçalhos das colunas (sticky) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 px-3 sm:px-6 sticky top-[44px] sm:top-[52px] z-10 bg-background">
        <ColumnHeader analysis={a1} accent="hsl(var(--teal))" label="ESCOLA A" />
        <ColumnHeader analysis={a2} accent="hsl(var(--navy))" label="ESCOLA B" />
      </div>

      {/* Páginas espelhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 relative">
        <div className="border-r min-w-0">{renderPage(page, a1)}</div>
        <div className="min-w-0">{renderPage(page, a2)}</div>
      </div>

      {/* Setas */}
      {idx > 0 && (
        <button
          onClick={goPrev}
          className="fixed left-1 sm:left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-card border shadow-md flex items-center justify-center hover:bg-accent transition-colors"
          aria-label="Página anterior do comparativo"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
        </button>
      )}
      {idx < COMPARATIVE_PAGES.length - 1 && (
        <button
          onClick={goNext}
          className="fixed right-1 sm:right-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-card border shadow-md flex items-center justify-center hover:bg-accent transition-colors"
          aria-label="Próxima página do comparativo"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
        </button>
      )}
    </div>
  );
}

function ColumnHeader({ analysis, accent, label }: { analysis: AnalysisResult; accent: string; label: string }) {
  return (
    <div className="px-3 sm:px-4 py-2 border-y" style={{ background: 'hsl(var(--beige))' }}>
      <div className="flex items-baseline gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accent }}>{label}</span>
        <span className="text-xs font-semibold truncate" style={{ color: 'hsl(var(--navy))' }}>{analysis.escola.Escola}</span>
        <span className="text-[10px] text-muted-foreground hidden sm:inline">
          · {analysis.escola.Município}/{analysis.escola.UF}
        </span>
      </div>
    </div>
  );
}
