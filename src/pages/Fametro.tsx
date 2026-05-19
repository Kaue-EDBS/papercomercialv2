import { useState, useCallback, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDataLoader } from '@/hooks/useDataLoader';
import { prefetchPotencialConsumo } from '@/hooks/usePotencialConsumo';
import { runAnalysis, rebuildConcorrentes, pickReplacement } from '@/lib/analysis';
import { AppPage, PresentationType, AnalysisResult, ConsultorSession } from '@/lib/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NavigationBar from '@/components/NavigationBar';
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
import PagePotencialConsumo from '@/components/pages/PagePotencialConsumo';
import PageInsights from '@/components/pages/PageInsights';
import PagePlanoAcao from '@/components/pages/PagePlanoAcao';
import PageEncerramento from '@/components/pages/PageEncerramento';
import PageInstructions, { PAGE_INSTRUCTIONS } from '@/components/PageInstructions';
import { Lock } from 'lucide-react';

const FAMETRO_INEP = '13080911';
const FAMETRO_PASSWORD = 'fametro13080911';
const AUTH_KEY = 'fametro:auth:v1';

const PAGE_ORDER: AppPage[] = ['abertura', 'resumo', 'panorama', 'concorrencia', 'marketshare', 'mensalidade', 'socioeconomico', 'potencial', 'insights', 'planoAcao', 'encerramento'];
const ETAPA2_PAGES: AppPage[] = ['concEssenciais', 'concTabela', 'concMapa'];

// Sessão fake apenas para exibição no cabeçalho.
const FAMETRO_SESSION: ConsultorSession = {
  codigo: 'FAMETRO',
  nome: 'Apresentação Fametro',
  gestor: 'Editora do Brasil',
};

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState('');
  const submit = () => {
    if (pwd.trim() === FAMETRO_PASSWORD) {
      try { sessionStorage.setItem(AUTH_KEY, '1'); } catch {}
      onUnlock();
    } else {
      setErr('Senha incorreta.');
    }
  };
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-card border rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'hsl(var(--teal-light))' }}>
              <Lock className="w-5 h-5" style={{ color: 'hsl(var(--teal-dark))' }} />
            </div>
            <div>
              <h1 className="font-bold text-lg" style={{ color: 'hsl(var(--navy))' }}>Apresentação Fametro</h1>
              <p className="text-xs text-muted-foreground">Acesso restrito</p>
            </div>
          </div>
          <div>
            <label htmlFor="pwd" className="block text-sm font-semibold mb-1.5" style={{ color: 'hsl(var(--navy))' }}>Senha</label>
            <input
              id="pwd"
              type="password"
              autoFocus
              value={pwd}
              onChange={e => { setPwd(e.target.value); setErr(''); }}
              onKeyDown={e => e.key === 'Enter' && submit()}
              className="w-full px-4 py-3 rounded-xl border bg-card text-foreground text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              placeholder="Digite a senha de acesso"
            />
          </div>
          {err && (
            <div role="alert" className="p-2.5 rounded-lg text-sm border" style={{ background: 'hsl(0,84%,95%)', color: 'hsl(0,84%,40%)', borderColor: 'hsl(0,84%,85%)' }}>
              {err}
            </div>
          )}
          <button
            onClick={submit}
            className="w-full py-3 rounded-xl font-semibold text-base text-primary-foreground bg-primary hover:opacity-90 transition"
          >
            Entrar
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function Fametro() {
  const { censo, demo, loading } = useDataLoader();

  const [authed, setAuthed] = useState<boolean>(() => {
    try { return sessionStorage.getItem(AUTH_KEY) === '1'; } catch { return false; }
  });

  const [page, setPage] = useState<AppPage>('concEssenciais');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [presentationType, setPresentationType] = useState<PresentationType | null>(null);
  const [error, setError] = useState('');

  const [essenciaisInep, setEssenciaisInep] = useState<string[]>([]);
  const [raioCustom, setRaioCustom] = useState<number | null>(null);
  const [raioPadraoEtapa2, setRaioPadraoEtapa2] = useState<number | null>(null);
  const [raioFoiAjustado, setRaioFoiAjustado] = useState(false);
  const [excluidosInep, setExcluidosInep] = useState<string[]>([]);

  useEffect(() => { if (!loading) prefetchPotencialConsumo(); }, [loading]);

  const initAnalysis = useCallback(() => {
    if (!censo.length) return;
    const result = runAnalysis(FAMETRO_INEP, censo, demo, null);
    if (!result) {
      setError(`Escola Fametro (INEP ${FAMETRO_INEP}) não encontrada no censo.`);
      return;
    }
    setAnalysis(result);
    setEssenciaisInep([]);
    setRaioCustom(null);
    setRaioPadraoEtapa2(null);
    setRaioFoiAjustado(false);
    setExcluidosInep([]);
    setPresentationType(null);
    setPage('concEssenciais');
  }, [censo, demo]);

  // Carrega análise quando dados ficam prontos e usuário está autenticado
  useEffect(() => {
    if (authed && !loading && !analysis) initAnalysis();
  }, [authed, loading, analysis, initAnalysis]);

  const handleNewSearch = useCallback(() => { initAnalysis(); }, [initAnalysis]);

  const handleSelectType = (type: PresentationType) => {
    setPresentationType(type);
    setPage('abertura');
  };

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

  const handleMensalidadeOverride = useCallback((faixa: string) => {
    if (!analysis) return;
    const novaEscola = { ...analysis.escola, Mensalidade: faixa };
    const novaAnalise = { ...analysis, escola: novaEscola };
    const rebuilt = rebuildConcorrentes(novaAnalise, censo, {
      essenciaisInep,
      raioKm: raioCustom ?? novaAnalise.raioOperacional,
    });
    setAnalysis(rebuilt);
  }, [analysis, censo, essenciaisInep, raioCustom]);

  const handleTabelaConfirm = useCallback(() => setPage('concMapa'), []);

  const handleMapaKeep = useCallback(() => {
    if (analysis) setRaioPadraoEtapa2(raioCustom ?? analysis.raioOperacional);
    setPage('tipo');
  }, [analysis, raioCustom]);

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

  const handleRemoveConcorrente = useCallback((inep: string, mode: 'auto' | 'leave' | { manualInep: string }) => {
    if (!analysis) return;
    const inepStr = String(inep);
    const novosExcluidos = excluidosInep.includes(inepStr) ? excluidosInep : [...excluidosInep, inepStr];
    setExcluidosInep(novosExcluidos);
    const novosEssenciais = essenciaisInep.filter(i => String(i) !== inepStr);
    if (novosEssenciais.length !== essenciaisInep.length) setEssenciaisInep(novosEssenciais);

    const raioKm = raioCustom ?? analysis.raioOperacional;
    const semConc = {
      ...analysis,
      concorrentes: analysis.concorrentes.filter(c => String(c.escola['Código Inep']) !== inepStr),
    };

    if (mode === 'leave') { setAnalysis(semConc); return; }

    if (typeof mode === 'object' && mode.manualInep) {
      const essMais = Array.from(new Set([...novosEssenciais, mode.manualInep]));
      setEssenciaisInep(essMais);
      const rebuilt = rebuildConcorrentes(semConc, censo, { essenciaisInep: essMais, raioKm });
      const filtrado = {
        ...rebuilt,
        concorrentes: rebuilt.concorrentes.filter(c => !novosExcluidos.includes(String(c.escola['Código Inep']))),
      };
      setAnalysis(filtrado);
      return;
    }

    const substituto = pickReplacement(semConc, censo, {
      essenciaisInep: novosEssenciais,
      raioKm,
      excludeInep: novosExcluidos,
    });
    if (!substituto) { setAnalysis(semConc); return; }
    const rebuilt = rebuildConcorrentes(semConc, censo, { essenciaisInep: novosEssenciais, raioKm });
    const filtrado = {
      ...rebuilt,
      concorrentes: rebuilt.concorrentes.filter(c => !novosExcluidos.includes(String(c.escola['Código Inep']))),
    };
    setAnalysis(filtrado);
  }, [analysis, censo, essenciaisInep, raioCustom, excluidosInep]);

  const handleBack = () => {
    if (page === 'concMapa') { setPage('concTabela'); return; }
    if (page === 'concTabela') { setPage('concEssenciais'); return; }
    if (page === 'concEssenciais') { return; /* travado nessa escola */ }
    if (page === 'tipo') { setPage('concMapa'); return; }
    const idx = PAGE_ORDER.indexOf(page);
    if (idx > 0) setPage(PAGE_ORDER[idx - 1]);
    else if (page === 'abertura') setPage('tipo');
  };

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

  if (!authed) return <PasswordGate onUnlock={() => setAuthed(true)} />;

  if (loading || !analysis) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header session={FAMETRO_SESSION} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="animate-spin w-10 h-10 border-4 rounded-full mx-auto" style={{ borderColor: 'hsl(var(--teal-light))', borderTopColor: 'hsl(var(--teal))' }} />
            <p className="text-sm text-muted-foreground">{error || 'Carregando análise da Escola Fametro...'}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const showNav = PAGE_ORDER.includes(page);
  const showEtapa2Nav = ETAPA2_PAGES.includes(page);
  const pageIdx = PAGE_ORDER.indexOf(page);

  return (
    <div className="flex flex-col min-h-screen">
      <Header session={FAMETRO_SESSION} />
      {showNav && (
        <NavigationBar
          currentPage={page}
          onNavigate={setPage}
          onBack={handleBack}
          onNewSearch={handleNewSearch}
        />
      )}
      {showEtapa2Nav && (
        <NavigationBar
          currentPage={page}
          onNavigate={() => {}}
          isEtapa2
          onBack={page === 'concEssenciais' ? undefined : handleBack}
          onNewSearch={handleNewSearch}
          session={FAMETRO_SESSION}
          escola={analysis.escola}
        />
      )}
      {page === 'tipo' && (
        <NavigationBar
          currentPage={page}
          onNavigate={() => {}}
          onBack={handleBack}
          onNewSearch={handleNewSearch}
        />
      )}

      <main className="flex-1 relative">
        {error && (
          <div role="alert" className="max-w-lg mx-auto mt-8 p-4 rounded-xl border text-sm text-center mx-4 sm:mx-auto" style={{ background: 'hsl(0, 84%, 95%)', color: 'hsl(0, 84%, 40%)', borderColor: 'hsl(0, 84%, 85%)' }}>
            {error}
          </div>
        )}

        {showNav && pageIdx > 0 && (
          <button onClick={goPrev} className="fixed left-1 sm:left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-card border shadow-md flex items-center justify-center hover:bg-accent transition-colors" aria-label="Página anterior">
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
          </button>
        )}
        {showNav && pageIdx >= 0 && pageIdx < PAGE_ORDER.length - 1 && (
          <button onClick={goNext} className="fixed right-1 sm:right-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-card border shadow-md flex items-center justify-center hover:bg-accent transition-colors" aria-label="Próxima página">
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
          </button>
        )}

        {page === 'tipo' && <PageTipo escola={analysis.escola} onSelect={handleSelectType} onBack={handleBack} />}
        {page === 'concEssenciais' && (
          <PageConcEssenciais
            escola={analysis.escola}
            censoData={censo}
            initialEssenciais={essenciaisInep}
            onConfirm={handleEssenciaisConfirm}
            onSkip={handleEssenciaisSkip}
            onMensalidadeOverride={handleMensalidadeOverride}
          />
        )}
        {page === 'concTabela' && (
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
        {page === 'concMapa' && (
          <PageConcMapa
            analysis={analysis}
            raioAtual={raioCustom ?? analysis.raioOperacional}
            onKeep={handleMapaKeep}
            onApplyNewRaio={handleMapaNewRaio}
          />
        )}
        {page === 'abertura' && presentationType && <PageAbertura type={presentationType} />}
        {page === 'resumo' && <PageResumo analysis={analysis} />}
        {page === 'panorama' && <PagePanorama analysis={analysis} />}
        {page === 'concorrencia' && (
          <PageConcorrencia
            analysis={analysis}
            essenciaisInep={essenciaisInep}
            raioAtual={raioCustom ?? analysis.raioOperacional}
            raioPadrao={raioPadraoEtapa2 ?? analysis.raioOperacional}
            onRaioChange={(km) => {
              setRaioCustom(km);
              setRaioFoiAjustado(true);
              const rebuilt = rebuildConcorrentes(analysis, censo, { essenciaisInep, raioKm: km });
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
            session={FAMETRO_SESSION}
            raioKm={raioCustom ?? analysis.raioOperacional}
            raioMode={raioCustom !== null ? 'personalizado' : 'padrao'}
            essenciaisInep={essenciaisInep}
          />
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