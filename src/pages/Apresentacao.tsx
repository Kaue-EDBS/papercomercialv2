import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDataLoader } from '@/hooks/useDataLoader';
import { prefetchPotencialConsumo } from '@/hooks/usePotencialConsumo';
import { runAnalysis, rebuildConcorrentes } from '@/lib/analysis';
import { AnalysisResult, AppPage, PresentationType } from '@/lib/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NavigationBar from '@/components/NavigationBar';
import PageAbertura from '@/components/pages/PageAbertura';
import PageResumo from '@/components/pages/PageResumo';
import PagePanorama from '@/components/pages/PagePanorama';
import PageConcorrencia from '@/components/pages/PageConcorrencia';
import PageMarketShare from '@/components/pages/PageMarketShare';
import PageMensalidade from '@/components/pages/PageMensalidade';
import PageSocioeconomico from '@/components/pages/PageSocioeconomico';
import PagePotencialConsumo from '@/components/pages/PagePotencialConsumo';
import PageInsights from '@/components/pages/PageInsights';
import PagePlanoAcao from '@/components/pages/PagePlanoAcao';
import PageEncerramento from '@/components/pages/PageEncerramento';
import PageInstructions, { PAGE_INSTRUCTIONS } from '@/components/PageInstructions';

const PAGE_ORDER: AppPage[] = ['abertura', 'resumo', 'panorama', 'concorrencia', 'marketshare', 'mensalidade', 'socioeconomico', 'potencial', 'insights', 'planoAcao', 'encerramento'];

interface Props {
  inepFixo?: string;
  presentationType?: PresentationType;
}

export default function Apresentacao({ inepFixo, presentationType = 'prospeccao' }: Props) {
  const params = useParams<{ inep?: string }>();
  const inep = inepFixo ?? params.inep ?? '';
  const { censo, demo, loading } = useDataLoader();
  const [page, setPage] = useState<AppPage>('abertura');
  const [raioCustom, setRaioCustom] = useState<number | null>(null);

  useEffect(() => { if (!loading) prefetchPotencialConsumo(); }, [loading]);

  const baseAnalysis = useMemo<AnalysisResult | null>(() => {
    if (loading || !inep) return null;
    return runAnalysis(inep, censo, demo, null);
  }, [inep, censo, demo, loading]);

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  useEffect(() => { setAnalysis(baseAnalysis); }, [baseAnalysis]);

  const goNext = useCallback(() => {
    const idx = PAGE_ORDER.indexOf(page);
    if (idx >= 0 && idx < PAGE_ORDER.length - 1) setPage(PAGE_ORDER[idx + 1]);
  }, [page]);
  const goPrev = useCallback(() => {
    const idx = PAGE_ORDER.indexOf(page);
    if (idx > 0) setPage(PAGE_ORDER[idx - 1]);
  }, [page]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  if (loading || !analysis) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          {loading ? (
            <div className="text-center space-y-3">
              <div className="animate-spin w-10 h-10 border-4 rounded-full mx-auto" style={{ borderColor: 'hsl(var(--teal-light))', borderTopColor: 'hsl(var(--teal))' }} />
              <p className="text-sm text-muted-foreground">Carregando apresentação...</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Escola de código Inep "{inep}" não encontrada.</p>
          )}
        </div>
        <Footer />
      </div>
    );
  }

  const pageIdx = PAGE_ORDER.indexOf(page);
  const raioAtual = raioCustom ?? analysis.raioOperacional;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <NavigationBar currentPage={page} onNavigate={setPage} />
      <main className="flex-1 relative">
        {pageIdx > 0 && (
          <button onClick={goPrev} className="fixed left-1 sm:left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-card border shadow-md flex items-center justify-center hover:bg-accent transition-colors" aria-label="Página anterior">
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
          </button>
        )}
        {pageIdx >= 0 && pageIdx < PAGE_ORDER.length - 1 && (
          <button onClick={goNext} className="fixed right-1 sm:right-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-card border shadow-md flex items-center justify-center hover:bg-accent transition-colors" aria-label="Próxima página">
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
          </button>
        )}

        {page === 'abertura' && <PageAbertura type={presentationType} />}
        {page === 'resumo' && <PageResumo analysis={analysis} />}
        {page === 'panorama' && <PagePanorama analysis={analysis} />}
        {page === 'concorrencia' && (
          <PageConcorrencia
            analysis={analysis}
            essenciaisInep={[]}
            raioAtual={raioAtual}
            raioPadrao={analysis.raioOperacional}
            onRaioChange={(km) => {
              setRaioCustom(km);
              const rebuilt = rebuildConcorrentes(analysis, censo, { essenciaisInep: [], raioKm: km });
              setAnalysis(rebuilt);
            }}
          />
        )}
        {page === 'marketshare' && <PageMarketShare analysis={analysis} />}
        {page === 'mensalidade' && <PageMensalidade analysis={analysis} />}
        {page === 'socioeconomico' && <PageSocioeconomico analysis={analysis} />}
        {page === 'potencial' && <PagePotencialConsumo analysis={analysis} />}
        {page === 'insights' && <PageInsights analysis={analysis} />}
        {page === 'planoAcao' && <PagePlanoAcao analysis={analysis} />}
        {page === 'encerramento' && (
          <PageEncerramento
            analysis={analysis}
            presentationType={presentationType}
            raioKm={raioAtual}
            raioMode={raioCustom !== null ? 'personalizado' : 'padrao'}
            essenciaisInep={[]}
          />
        )}
      </main>
      {PAGE_INSTRUCTIONS[page] && (
        <PageInstructions page={page} title={PAGE_INSTRUCTIONS[page].title} body={PAGE_INSTRUCTIONS[page].body} />
      )}
      <Footer />
    </div>
  );
}