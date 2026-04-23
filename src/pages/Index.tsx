import { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDataLoader } from '@/hooks/useDataLoader';
import { runAnalysis, rebuildConcorrentes, pickReplacement } from '@/lib/analysis';
import { AppPage, PresentationType, AnalysisResult, ConsultorSession } from '@/lib/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NavigationBar from '@/components/NavigationBar';
import PageLogin from '@/components/pages/PageLogin';
import PageModo from '@/components/pages/PageModo';
import PageCarteira from '@/components/pages/PageCarteira';
import PageCapa from '@/components/pages/PageCapa';
import PagePaperBusca from '@/components/pages/PagePaperBusca';
import PageTipo from '@/components/pages/PageTipo';
import PageAbertura from '@/components/pages/PageAbertura';
import PageResumo from '@/components/pages/PageResumo';
import PagePanorama from '@/components/pages/PagePanorama';
import PageConcorrencia from '@/components/pages/PageConcorrencia';
import PageConcEssenciais from '@/components/pages/PageConcEssenciais';
import PageConcTabela from '@/components/pages/PageConcTabela';
import PageConcMapa from '@/components/pages/PageConcMapa';
import PageMarketShare from '@/components/pages/PageMarketShare';
import PageMensalidade from '@/components/pages/PageMensalidade';
import PageSocioeconomico from '@/components/pages/PageSocioeconomico';
import PageInsights from '@/components/pages/PageInsights';
import PagePlanoAcao from '@/components/pages/PagePlanoAcao';
import PageEncerramento from '@/components/pages/PageEncerramento';
import ComparativeModule from '@/components/pages/ComparativeModule';
import PageInstructions, { PAGE_INSTRUCTIONS } from '@/components/PageInstructions';

const PAGE_ORDER: AppPage[] = ['abertura', 'resumo', 'panorama', 'concorrencia', 'marketshare', 'mensalidade', 'socioeconomico', 'insights', 'planoAcao', 'encerramento'];
// Páginas da Etapa 2 — fora do PAGE_ORDER (sem navegação livre por setas/atalhos).
const ETAPA2_PAGES: AppPage[] = ['concEssenciais', 'concTabela', 'concMapa'];

const SESSION_KEY = 'consultor:session:v1';

export default function Index() {
  const { censo, demo, loading } = useDataLoader();
  const [page, setPage] = useState<AppPage>('login');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [presentationType, setPresentationType] = useState<PresentationType | null>(null);
  const [error, setError] = useState('');
  const [session, setSession] = useState<ConsultorSession | null>(null);

  // Comparative
  const [isComparative, setIsComparative] = useState(false);
  const [compA1, setCompA1] = useState<AnalysisResult | null>(null);
  const [compA2, setCompA2] = useState<AnalysisResult | null>(null);

  // Etapa 2 — validação de concorrência
  const [essenciaisInep, setEssenciaisInep] = useState<string[]>([]);
  const [raioCustom, setRaioCustom] = useState<number | null>(null);
  const [raioFoiAjustado, setRaioFoiAjustado] = useState(false);
  const [excluidosInep, setExcluidosInep] = useState<string[]>([]);

  // Restore session from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const s = JSON.parse(raw) as ConsultorSession;
        if (s?.codigo && s?.nome) { setSession(s); setPage('modo'); }
      }
    } catch {}
  }, []);

  const handleLogin = useCallback((s: ConsultorSession) => {
    setSession(s);
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch {}
    setPage('modo');
  }, []);

  const handleLogout = useCallback(() => {
    try { localStorage.removeItem(SESSION_KEY); } catch {}
    setSession(null);
    setAnalysis(null);
    setPresentationType(null);
    setIsComparative(false);
    setCompA1(null);
    setCompA2(null);
    setError('');
    setPage('login');
  }, []);

  const handleSelectModo = useCallback((modo: 'carteira' | 'paper') => {
    if (modo === 'carteira') setPage('carteira');
    else setPage('paper');
  }, []);

  const handleNewSearch = useCallback(() => {
    setAnalysis(null);
    setPresentationType(null);
    setError('');
    setIsComparative(false);
    setCompA1(null);
    setCompA2(null);
    setEssenciaisInep([]);
    setRaioCustom(null);
    setRaioFoiAjustado(false);
    setPage(session ? 'modo' : 'login');
  }, [session]);

  const handleSearch = useCallback((codigo: string, coordsOverride?: { lat: number; lng: number } | null) => {
    setError('');
    const result = runAnalysis(codigo.trim(), censo, demo, coordsOverride ?? null);
    if (!result) {
      setError(`Não encontramos a escola para o Código Inep "${codigo}". Confira o número e tente de novo.`);
      return;
    }
    setAnalysis(result);
    // Etapa 2 começa direto em concorrentes essenciais — sem tela de tipo no meio.
    setEssenciaisInep([]);
    setRaioCustom(null);
    setRaioFoiAjustado(false);
    setExcluidosInep([]);
    setPresentationType(null);
    setPage('concEssenciais');
  }, [censo, demo]);

  const handleCompare = useCallback((c1: string, c2: string) => {
    setError('');
    const r1 = runAnalysis(c1.trim(), censo, demo);
    const r2 = runAnalysis(c2.trim(), censo, demo);
    if (!r1 || !r2) {
      setError('Uma ou ambas as escolas não foram encontradas. Confira os códigos Inep.');
      return;
    }
    setCompA1(r1);
    setCompA2(r2);
    setIsComparative(true);
  }, [censo, demo]);

  // Tipo de apresentação agora é definido na entrada da Etapa 3 (após validação de concorrência).
  const handleSelectType = (type: PresentationType) => {
    setPresentationType(type);
    setPage('abertura');
  };

  // Etapa 2 — handlers
  const applyEssenciais = useCallback((inepList: string[], raioKm?: number) => {
    if (!analysis) return;
    const rebuilt = rebuildConcorrentes(analysis, censo, {
      essenciaisInep: inepList,
      raioKm: raioKm ?? raioCustom ?? analysis.raioOperacional,
    });
    setAnalysis(rebuilt);
  }, [analysis, censo, raioCustom]);

  const handleEssenciaisConfirm = useCallback((inepList: string[]) => {
    setEssenciaisInep(inepList);
    applyEssenciais(inepList);
    setPage('concTabela');
  }, [applyEssenciais]);

  const handleEssenciaisSkip = useCallback(() => {
    setEssenciaisInep([]);
    applyEssenciais([]);
    setPage('concTabela');
  }, [applyEssenciais]);

  const handleTabelaConfirm = useCallback(() => setPage('concMapa'), []);

  // Após validar o raio, vai para a tela de tipo de apresentação (entrada da Etapa 3).
  const handleMapaKeep = useCallback(() => setPage('tipo'), []);

  const handleMapaNewRaio = useCallback((raioKm: number) => {
    setRaioCustom(raioKm);
    setRaioFoiAjustado(true);
    if (analysis) {
      const rebuilt = rebuildConcorrentes(analysis, censo, { essenciaisInep, raioKm });
      setAnalysis(rebuilt);
    }
    setPage('concTabela');
  }, [analysis, censo, essenciaisInep]);

  const handleTabelaChangeRaio = useCallback(() => setPage('concMapa'), []);

  // ----- Etapa 2.2 — exclusão de concorrente da lista -----
  const handleRemoveConcorrente = useCallback((inep: string, mode: 'auto' | 'leave' | { manualInep: string }) => {
    if (!analysis) return;
    const inepStr = String(inep);
    const novosExcluidos = excluidosInep.includes(inepStr) ? excluidosInep : [...excluidosInep, inepStr];
    setExcluidosInep(novosExcluidos);
    const novosEssenciais = essenciaisInep.filter(i => String(i) !== inepStr);
    if (novosEssenciais.length !== essenciaisInep.length) setEssenciaisInep(novosEssenciais);

    const raioKm = raioCustom ?? analysis.raioOperacional;
    // Remove o concorrente da lista atual
    const semConc = {
      ...analysis,
      concorrentes: analysis.concorrentes.filter(c => String(c.escola['Código Inep']) !== inepStr),
    };

    if (mode === 'leave') {
      setAnalysis(semConc);
      return;
    }

    if (typeof mode === 'object' && mode.manualInep) {
      // Inclui a escola manual como essencial e reconstrói lista
      const essMais = Array.from(new Set([...novosEssenciais, mode.manualInep]));
      setEssenciaisInep(essMais);
      const rebuilt = rebuildConcorrentes(semConc, censo, { essenciaisInep: essMais, raioKm });
      // Garante que o excluido não retorne via reconstrução automática
      const filtrado = {
        ...rebuilt,
        concorrentes: rebuilt.concorrentes.filter(c => !novosExcluidos.includes(String(c.escola['Código Inep']))),
      };
      setAnalysis(filtrado);
      return;
    }

    // mode === 'auto' — busca substituto pelo mesmo critério
    const substituto = pickReplacement(semConc, censo, {
      essenciaisInep: novosEssenciais,
      raioKm,
      excludeInep: novosExcluidos,
    });
    if (!substituto) {
      setAnalysis(semConc);
      return;
    }
    const rebuilt = rebuildConcorrentes(semConc, censo, { essenciaisInep: novosEssenciais, raioKm });
    const filtrado = {
      ...rebuilt,
      concorrentes: rebuilt.concorrentes.filter(c => !novosExcluidos.includes(String(c.escola['Código Inep']))),
    };
    setAnalysis(filtrado);
  }, [analysis, censo, essenciaisInep, raioCustom, excluidosInep]);

  const handleBack = () => {
    // Navegação dentro da Etapa 2
    if (page === 'concMapa') { setPage('concTabela'); return; }
    if (page === 'concTabela') { setPage('concEssenciais'); return; }
    if (page === 'concEssenciais') {
      // Volta para a seleção de escola (carteira ou capa)
      setAnalysis(null);
      setPage(session ? 'modo' : 'paper');
      return;
    }
    if (page === 'paper' || page === 'capa' || page === 'carteira') {
      setPage(session ? 'modo' : 'login');
      return;
    }
    // Tipo de apresentação fica entre Etapa 2 e Etapa 3
    if (page === 'tipo') { setPage('concMapa'); return; }
    const idx = PAGE_ORDER.indexOf(page);
    if (idx > 0) {
      setPage(PAGE_ORDER[idx - 1]);
    } else if (page === 'abertura') {
      // Da abertura voltamos para a tela de tipo de apresentação.
      setPage('tipo');
    } else {
      setAnalysis(null);
      setPresentationType(null);
      setPage(session ? 'modo' : 'login');
    }
  };

  const goNext = useCallback(() => {
    if (isComparative) return;
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
  const showEtapa2Nav = ETAPA2_PAGES.includes(page) && !isComparative;
  const pageIdx = PAGE_ORDER.indexOf(page);

  return (
    <div className="flex flex-col min-h-screen">
      <Header session={session} onLogout={handleLogout} />
      {showNav && (
        <NavigationBar
          currentPage={page}
          onNavigate={setPage}
          onBack={handleBack}
          onNewSearch={handleNewSearch}
        />
      )}
      {showNav && analysis && (
        <ContextBar
          session={session}
          escola={analysis.escola}
          raioKm={raioCustom ?? analysis.raioOperacional}
          raioMode={raioCustom !== null ? 'personalizado' : 'padrao'}
          presentationType={presentationType}
          etapaLabel="3 · Apresentação"
        />
      )}
      {showEtapa2Nav && (
        <NavigationBar
          currentPage={page}
          onNavigate={() => {}}
          isEtapa2
          onBack={handleBack}
          onNewSearch={handleNewSearch}
          session={session}
          escola={analysis?.escola}
        />
      )}
      {isComparative && (
        <NavigationBar
          currentPage={page}
          onNavigate={() => {}}
          isComparative
          onBackToMain={() => { setIsComparative(false); setPage(session ? 'modo' : 'login'); }}
          onNewSearch={handleNewSearch}
        />
      )}

      <main className="flex-1 relative">
        {error && (
          <div role="alert" className="max-w-lg mx-auto mt-8 p-4 rounded-xl border text-sm text-center mx-4 sm:mx-auto" style={{ background: 'hsl(0, 84%, 95%)', color: 'hsl(0, 84%, 40%)', borderColor: 'hsl(0, 84%, 85%)' }}>
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
            {page === 'login' && <PageLogin onConfirm={handleLogin} />}
            {page === 'modo' && session && <PageModo session={session} onSelect={handleSelectModo} />}
            {page === 'carteira' && session && (
              <PageCarteira
                session={session}
                censoData={censo}
                onPickEscola={(inep, _nome, coords) => { if (inep) handleSearch(inep, coords ?? null); }}
                onBack={() => setPage('modo')}
              />
            )}
            {page === 'capa' && <PageCapa censoData={censo} onSearch={handleSearch} onCompare={handleCompare} />}
            {page === 'paper' && (
              <PagePaperBusca
                censoData={censo}
                onConfirm={handleSearch}
                onBack={() => setPage(session ? 'modo' : 'login')}
              />
            )}
            {page === 'tipo' && analysis && <PageTipo escola={analysis.escola} onSelect={handleSelectType} onBack={() => { setAnalysis(null); setPage(session ? 'modo' : 'capa'); }} />}
            {page === 'concEssenciais' && analysis && (
              <PageConcEssenciais
                escola={analysis.escola}
                censoData={censo}
                initialEssenciais={essenciaisInep}
                onConfirm={handleEssenciaisConfirm}
                onSkip={handleEssenciaisSkip}
              />
            )}
            {page === 'concTabela' && analysis && (
              <PageConcTabela
                analysis={analysis}
                essenciaisInep={essenciaisInep}
                raioAtual={raioCustom ?? analysis.raioOperacional}
                fromRaioAdjust={raioFoiAjustado}
                censoData={censo}
                onRemoveConcorrente={handleRemoveConcorrente}
                onConfirm={handleTabelaConfirm}
                onChangeRaio={handleTabelaChangeRaio}
              />
            )}
            {page === 'concMapa' && analysis && (
              <PageConcMapa
                analysis={analysis}
                raioAtual={raioCustom ?? analysis.raioOperacional}
                onKeep={handleMapaKeep}
                onApplyNewRaio={handleMapaNewRaio}
              />
            )}
            {page === 'abertura' && presentationType && <PageAbertura type={presentationType} />}
            {page === 'resumo' && analysis && <PageResumo analysis={analysis} />}
            {page === 'panorama' && analysis && <PagePanorama analysis={analysis} />}
            {page === 'concorrencia' && analysis && (
              <PageConcorrencia
                analysis={analysis}
                essenciaisInep={essenciaisInep}
                onRaioChange={(km) => { setRaioCustom(km); setRaioFoiAjustado(true); }}
              />
            )}
            {page === 'marketshare' && analysis && <PageMarketShare analysis={analysis} />}
            {page === 'mensalidade' && analysis && <PageMensalidade analysis={analysis} />}
            {page === 'socioeconomico' && analysis && <PageSocioeconomico analysis={analysis} />}
            {page === 'insights' && analysis && <PageInsights analysis={analysis} />}
            {page === 'planoAcao' && analysis && <PagePlanoAcao analysis={analysis} />}
            {page === 'encerramento' && (
              <PageEncerramento
                analysis={analysis}
                presentationType={presentationType}
                session={session}
                raioKm={raioCustom ?? analysis?.raioOperacional}
                raioMode={raioCustom !== null ? 'personalizado' : 'padrao'}
              />
            )}
          </>
        )}
      </main>

      {showNav && PAGE_INSTRUCTIONS[page] && (
        <PageInstructions
          page={page}
          title={PAGE_INSTRUCTIONS[page].title}
          body={PAGE_INSTRUCTIONS[page].body}
        />
      )}

      <Footer />
    </div>
  );
}
