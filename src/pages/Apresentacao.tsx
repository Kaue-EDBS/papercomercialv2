import { useEffect, useMemo, useState, useCallback, lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApresentacaoData } from '@/hooks/useApresentacaoData';
import { prefetchPotencialConsumo } from '@/hooks/usePotencialConsumo';
import { runAnalysis, rebuildConcorrentes } from '@/lib/analysis';
import { AnalysisResult, AppPage, PresentationType } from '@/lib/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NavigationBar from '@/components/NavigationBar';
import ApresentacaoSkeleton from '@/components/ApresentacaoSkeleton';
import PageInstructions, { PAGE_INSTRUCTIONS } from '@/components/PageInstructions';

// (#4) Code splitting — cada página vira chunk separado, carregado sob demanda.
const PageAbertura = lazy(() => import('@/components/pages/PageAbertura'));
const PageResumo = lazy(() => import('@/components/pages/PageResumo'));
const PagePanorama = lazy(() => import('@/components/pages/PagePanorama'));
const PageConcorrencia = lazy(() => import('@/components/pages/PageConcorrencia'));
const PageMarketShare = lazy(() => import('@/components/pages/PageMarketShare'));
const PageMensalidade = lazy(() => import('@/components/pages/PageMensalidade'));
const PageSocioeconomico = lazy(() => import('@/components/pages/PageSocioeconomico'));
const PagePotencialConsumo = lazy(() => import('@/components/pages/PagePotencialConsumo'));
const PageInsights = lazy(() => import('@/components/pages/PageInsights'));
const PagePlanoAcao = lazy(() => import('@/components/pages/PagePlanoAcao'));
const PageEncerramento = lazy(() => import('@/components/pages/PageEncerramento'));

const PAGE_ORDER: AppPage[] = ['abertura', 'resumo', 'panorama', 'concorrencia', 'marketshare', 'mensalidade', 'socioeconomico', 'potencial', 'insights', 'planoAcao', 'encerramento'];

interface Props {
  inepFixo?: string;
  presentationType?: PresentationType;
}

export default function Apresentacao({ inepFixo, presentationType = 'prospeccao' }: Props) {
  const params = useParams<{ inep?: string }>();
  const inep = inepFixo ?? params.inep ?? '';
  // (#1) Loader otimizado: baixa só o chunk da UF correspondente ao INEP.
  const data = useApresentacaoData(inep);
  const { censo, demo } = data;
  const loading = data.status === 'loading';
  const [page, setPage] = useState<AppPage>('abertura');
  const [raioCustom, setRaioCustom] = useState<number | null>(null);

  useEffect(() => { if (!loading) prefetchPotencialConsumo(); }, [loading]);

  const baseAnalysis = useMemo<AnalysisResult | null>(() => {
    if (loading || !inep) return null;
    return runAnalysis(inep, censo, demo, null);
  }, [inep, censo, demo, loading]);

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  useEffect(() => { setAnalysis(baseAnalysis); }, [baseAnalysis]);

  // (#7) Atualiza title + meta tags com base na escola carregada (melhora preview
  // no navegador e dá título descritivo na aba; OG completo p/ crawlers exige SSR).
  useEffect(() => {
    if (!analysis) return;
    const nome = analysis.escola.Escola;
    const cidade = `${analysis.escola.Município}/${analysis.escola.UF}`;
    const title = `${nome} · CIT · ${cidade}`;
    document.title = title;
    const setMeta = (selector: string, attr: string, value: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute(attr, value);
    };
    const desc = `Análise estratégica de ${nome} (${cidade}): concorrência, market share, perfil socioeconômico e plano de ação.`;
    setMeta('meta[name="description"]', 'content', desc);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', desc);
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', desc);
  }, [analysis]);

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
        {loading ? (
          <ApresentacaoSkeleton />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Escola de código Inep "{inep}" não encontrada.</p>
          </div>
        )}
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

        <Suspense fallback={<div className="px-6 py-10 text-sm text-muted-foreground">Carregando slide…</div>}>
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
        </Suspense>
      </main>
      {PAGE_INSTRUCTIONS[page] && (
        <PageInstructions page={page} title={PAGE_INSTRUCTIONS[page].title} body={PAGE_INSTRUCTIONS[page].body} />
      )}
      <Footer />
    </div>
  );
}