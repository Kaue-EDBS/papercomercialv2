import { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useDataLoader } from '@/hooks/useDataLoader';
import { runAnalysis } from '@/lib/analysis';
import { AppPage, PresentationType, AnalysisResult } from '@/lib/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NavigationBar from '@/components/NavigationBar';
import PageCapa from '@/components/pages/PageCapa';
import PageTipo from '@/components/pages/PageTipo';
import PageAbertura from '@/components/pages/PageAbertura';
import PageResumo from '@/components/pages/PageResumo';
import PagePanorama from '@/components/pages/PagePanorama';
import PageConcorrencia from '@/components/pages/PageConcorrencia';
import PageMarketShare from '@/components/pages/PageMarketShare';
import PageMensalidade from '@/components/pages/PageMensalidade';
import PageSocioeconomico from '@/components/pages/PageSocioeconomico';
import PageInsights from '@/components/pages/PageInsights';
import PageEncerramento from '@/components/pages/PageEncerramento';
import ComparativeModule from '@/components/pages/ComparativeModule';

const PAGE_ORDER: AppPage[] = ['abertura', 'resumo', 'panorama', 'concorrencia', 'marketshare', 'mensalidade', 'socioeconomico', 'insights', 'encerramento'];

export default function Index() {
  const { censo, demo, loading } = useDataLoader();
  const [page, setPage] = useState<AppPage>('capa');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [presentationType, setPresentationType] = useState<PresentationType | null>(null);
  const [error, setError] = useState('');

  // Comparative
  const [isComparative, setIsComparative] = useState(false);
  const [compA1, setCompA1] = useState<AnalysisResult | null>(null);
  const [compA2, setCompA2] = useState<AnalysisResult | null>(null);

  const handleNewSearch = useCallback(() => {
    setAnalysis(null);
    setPresentationType(null);
    setError('');
    setIsComparative(false);
    setCompA1(null);
    setCompA2(null);
    setPage('capa');
  }, []);

  const handleSearch = useCallback((codigo: string, customRadiusKm?: number | null) => {
    setError('');
    const result = runAnalysis(codigo.trim(), censo, demo, customRadiusKm);
    if (!result) {
      setError(`Escola não encontrada para o Código Inep: ${codigo}. Verifique o código e tente novamente.`);
      return;
    }
    setAnalysis(result);
    setPage('tipo');
  }, [censo, demo]);

  const handleCompare = useCallback((c1: string, c2: string) => {
    setError('');
    const r1 = runAnalysis(c1.trim(), censo, demo);
    const r2 = runAnalysis(c2.trim(), censo, demo);
    if (!r1 || !r2) {
      setError('Uma ou ambas as escolas não foram encontradas. Verifique os códigos Inep.');
      return;
    }
    setCompA1(r1);
    setCompA2(r2);
    setIsComparative(true);
  }, [censo, demo]);

  const handleSelectType = (type: PresentationType) => {
    setPresentationType(type);
    setPage('abertura');
  };

  const handleBack = () => {
    const idx = PAGE_ORDER.indexOf(page);
    if (idx > 0) {
      setPage(PAGE_ORDER[idx - 1]);
    } else if (page === 'abertura') {
      setPage('tipo');
    } else {
      setAnalysis(null);
      setPresentationType(null);
      setPage('capa');
    }
  };

  const goNext = useCallback(() => {
    if (isComparative) return; // single page comparative, no nav
    const idx = PAGE_ORDER.indexOf(page);
    if (idx >= 0 && idx < PAGE_ORDER.length - 1) setPage(PAGE_ORDER[idx + 1]);
  }, [page, isComparative]);

  const goPrev = useCallback(() => {
    if (isComparative) return;
    const idx = PAGE_ORDER.indexOf(page);
    if (idx > 0) setPage(PAGE_ORDER[idx - 1]);
  }, [page, isComparative]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="animate-spin w-10 h-10 border-4 rounded-full mx-auto" style={{ borderColor: 'hsl(var(--teal-light))', borderTopColor: 'hsl(var(--teal))' }} />
            <p className="text-sm text-muted-foreground">Carregando dados do Censo Escolar...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const showNav = PAGE_ORDER.includes(page) && !isComparative;
  const pageIdx = PAGE_ORDER.indexOf(page);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {showNav && (
        <NavigationBar
          currentPage={page}
          onNavigate={setPage}
          onBack={handleBack}
          onNewSearch={handleNewSearch}
        />
      )}
      {isComparative && (
        <NavigationBar
          currentPage={page}
          onNavigate={() => {}}
          isComparative
          onBackToMain={() => { setIsComparative(false); setPage('capa'); }}
          onNewSearch={handleNewSearch}
        />
      )}

      <main className="flex-1 relative">
        {error && (
          <div className="max-w-lg mx-auto mt-8 p-4 rounded-xl border text-sm text-center mx-4 sm:mx-auto" style={{ background: 'hsl(0, 84%, 95%)', color: 'hsl(0, 84%, 40%)', borderColor: 'hsl(0, 84%, 85%)' }}>
            {error}
          </div>
        )}

        {/* Navigation arrows */}
        {showNav && pageIdx > 0 && (
          <button
            onClick={goPrev}
            className="fixed left-1 sm:left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-card border shadow-md flex items-center justify-center hover:bg-accent transition-colors"
            aria-label="Página anterior"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
          </button>
        )}
        {showNav && pageIdx >= 0 && pageIdx < PAGE_ORDER.length - 1 && (
          <button
            onClick={goNext}
            className="fixed right-1 sm:right-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-card border shadow-md flex items-center justify-center hover:bg-accent transition-colors"
            aria-label="Próxima página"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
          </button>
        )}

        {isComparative && compA1 && compA2 ? (
          <ComparativeModule a1={compA1} a2={compA2} />
        ) : (
          <>
            {page === 'capa' && <PageCapa censoData={censo} onSearch={handleSearch} onCompare={handleCompare} />}
            {page === 'tipo' && analysis && <PageTipo escola={analysis.escola} onSelect={handleSelectType} onBack={() => { setAnalysis(null); setPage('capa'); }} />}
            {page === 'abertura' && presentationType && <PageAbertura type={presentationType} />}
            {page === 'resumo' && analysis && <PageResumo analysis={analysis} />}
            {page === 'panorama' && analysis && <PagePanorama analysis={analysis} />}
            {page === 'concorrencia' && analysis && <PageConcorrencia analysis={analysis} />}
            {page === 'marketshare' && analysis && <PageMarketShare analysis={analysis} />}
            {page === 'mensalidade' && analysis && <PageMensalidade analysis={analysis} />}
            {page === 'socioeconomico' && analysis && <PageSocioeconomico analysis={analysis} />}
            {page === 'insights' && analysis && <PageInsights analysis={analysis} />}
            {page === 'encerramento' && (
              <PageEncerramento
                onExportPDF={() => {
                  toast.info('A exportação em PDF será implementada em breve.');
                }}
                onExportPPT={() => {
                  toast.info('A exportação em PPT será implementada em breve.');
                }}
              />
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
