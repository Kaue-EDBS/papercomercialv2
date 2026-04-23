import { AppPage, PresentationType } from '@/lib/types';
import { Home, Maximize, Minimize, User, GraduationCap, ChevronRight, Lock, MapPin, Compass, Briefcase } from 'lucide-react';
import { useState, useCallback } from 'react';
import { ConsultorSession, EscolaData } from '@/lib/types';

interface NavItem {
  id: AppPage;
  label: string;
  short: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'abertura', label: 'Abertura', short: '1' },
  { id: 'resumo', label: 'Resumo Executivo', short: '2' },
  { id: 'panorama', label: 'Panorama', short: '3' },
  { id: 'concorrencia', label: 'Concorrência', short: '4' },
  { id: 'marketshare', label: 'Market Share', short: '5' },
  { id: 'mensalidade', label: 'Mensalidade', short: '6' },
  { id: 'socioeconomico', label: 'Socioeconômico', short: '7' },
  { id: 'insights', label: 'Insights', short: '8' },
  { id: 'planoAcao', label: 'Plano de Ação', short: '9' },
  { id: 'encerramento', label: 'Encerramento', short: '10' },
];

function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  return (
    <button
      onClick={toggleFullscreen}
      className="nav-pill flex items-center gap-1 text-xs"
      title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
    >
      {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
    </button>
  );
}

interface Props {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  isComparative?: boolean;
  onBackToMain?: () => void;
  onBack?: () => void;
  onNewSearch?: () => void;
  isEtapa2?: boolean;
  /** Contexto resumido exibido inline na barra Etapa 2 (Consultor · Escola). */
  session?: ConsultorSession | null;
  escola?: EscolaData;
  /** Índice máximo já alcançado em PAGE_ORDER — itens além disso ficam travados. */
  maxReachedIdx?: number;
  /** Contexto exibido inline na barra principal (Etapa 3). */
  raioKm?: number;
  raioMode?: 'padrao' | 'personalizado';
  presentationType?: PresentationType | null;
  etapaLabel?: string;
}

export default function NavigationBar({ currentPage, onNavigate, isComparative, onBackToMain, onBack, onNewSearch, isEtapa2, session, escola, maxReachedIdx, raioKm, raioMode, presentationType, etapaLabel }: Props) {
  if (isEtapa2) {
    const stepMap: Record<string, { idx: number; label: string }> = {
      concEssenciais: { idx: 0, label: 'Concorrentes essenciais' },
      concTabela:     { idx: 1, label: 'Tabela de concorrentes' },
      concMapa:       { idx: 2, label: 'Mapa e raio' },
    };
    const cur = stepMap[currentPage] ?? { idx: 0, label: '' };
    return (
      <nav
        className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
        aria-label="Etapa 2 — Validação de Concorrência"
      >
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 overflow-x-auto scrollbar-hide">
          {onBack && (
            <button
              onClick={onBack}
              className="nav-pill text-[11px] font-semibold whitespace-nowrap"
              style={{ color: 'hsl(var(--teal))' }}
              aria-label="Voltar"
            >
              ← <span className="hidden sm:inline">Voltar</span>
            </button>
          )}
          {onNewSearch && (
            <button
              onClick={onNewSearch}
              className="nav-pill flex items-center gap-1 text-[11px] font-semibold whitespace-nowrap"
              style={{ color: 'hsl(var(--navy))' }}
              aria-label="Nova pesquisa"
            >
              <Home className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Nova Pesquisa</span>
            </button>
          )}

          {/* Breadcrumb leve */}
          <div className="flex items-center gap-1.5 ml-1 sm:ml-2 whitespace-nowrap text-[11px] sm:text-xs">
            <span className="text-muted-foreground">Etapa 2</span>
            <ChevronRight className="w-3 h-3 text-muted-foreground/60" aria-hidden />
            <span className="font-semibold" style={{ color: 'hsl(var(--navy))' }}>{cur.label}</span>
          </div>

          {/* Indicador de progresso ●○○ */}
          <div className="flex items-center gap-1 ml-1" aria-label={`Passo ${cur.idx + 1} de 3`}>
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="rounded-full transition-all"
                style={{
                  width: i === cur.idx ? 14 : 6,
                  height: 6,
                  background: i <= cur.idx ? 'hsl(var(--teal))' : 'hsl(var(--teal-light))',
                }}
                aria-hidden
              />
            ))}
          </div>

          {/* Contexto inline (consultor · escola) — desce em telas estreitas */}
          {(session || escola) && (
            <div className="hidden md:flex items-center gap-3 ml-3 pl-3 border-l text-[11px] text-muted-foreground whitespace-nowrap" style={{ borderColor: 'hsl(var(--border))' }}>
              {session && (
                <span className="inline-flex items-center gap-1">
                  <User className="w-3 h-3" style={{ color: 'hsl(var(--teal))' }} />
                  <span className="font-medium" style={{ color: 'hsl(var(--navy))' }}>{session.nome}</span>
                </span>
              )}
              {escola && (
                <span className="inline-flex items-center gap-1 max-w-[280px] truncate">
                  <GraduationCap className="w-3 h-3" style={{ color: 'hsl(var(--teal))' }} />
                  <span className="font-medium truncate" style={{ color: 'hsl(var(--navy))' }} title={`${escola.Escola} (${escola.Município}/${escola.UF})`}>
                    {escola.Escola}
                  </span>
                  <span className="text-muted-foreground">· {escola.Município}/{escola.UF}</span>
                </span>
              )}
            </div>
          )}

          <div className="ml-auto flex-shrink-0">
            <FullscreenButton />
          </div>
        </div>

        {/* Linha contextual compacta para mobile */}
        {(session || escola) && (
          <div className="md:hidden flex items-center gap-2 px-3 pb-2 -mt-1 text-[10px] text-muted-foreground whitespace-nowrap overflow-x-auto scrollbar-hide">
            {session && <span className="font-medium" style={{ color: 'hsl(var(--navy))' }}>{session.nome}</span>}
            {session && escola && <span>·</span>}
            {escola && <span className="truncate" style={{ color: 'hsl(var(--navy))' }}>{escola.Escola}</span>}
          </div>
        )}
      </nav>
    );
  }

  if (isComparative) {
    return (
      <nav className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 border-b bg-card overflow-x-auto scrollbar-hide">
        <button onClick={onBackToMain} className="nav-pill mr-1 sm:mr-2 text-[10px] sm:text-xs font-semibold whitespace-nowrap" style={{ color: 'hsl(var(--teal))' }}>
          ← Voltar
        </button>
        {onNewSearch && (
          <button onClick={onNewSearch} className="nav-pill flex items-center gap-1 text-[10px] sm:text-xs font-semibold whitespace-nowrap" style={{ color: 'hsl(var(--navy))' }}>
            <Home className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">Nova Pesquisa</span>
          </button>
        )}
        <span className="text-[10px] sm:text-xs font-semibold ml-1 sm:ml-2 whitespace-nowrap" style={{ color: 'hsl(var(--navy))' }}>COMPARATIVO ESCOLAR</span>
        <div className="ml-auto flex-shrink-0">
          <FullscreenButton />
        </div>
      </nav>
    );
  }

  // Liberação progressiva: itens com idx > maxReachedIdx ficam travados.
  const reached = typeof maxReachedIdx === 'number' ? maxReachedIdx : NAV_ITEMS.length - 1;
  const hasContext = !!(session || escola || presentationType || typeof raioKm === 'number');

  return (
    <nav
      className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
      aria-label="Navegação da apresentação"
    >
      <div className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-6 py-2 overflow-x-auto scrollbar-hide">
        {onBack && (
          <button onClick={onBack} aria-label="Voltar para a página anterior" className="nav-pill mr-1 sm:mr-2 text-[11px] sm:text-xs font-semibold whitespace-nowrap" style={{ color: 'hsl(var(--teal))' }}>
            ← <span className="hidden sm:inline">Voltar</span>
          </button>
        )}
        {onNewSearch && (
          <button onClick={onNewSearch} aria-label="Iniciar nova pesquisa" className="nav-pill flex items-center gap-1 text-[11px] sm:text-xs font-semibold mr-1 sm:mr-2 whitespace-nowrap" style={{ color: 'hsl(var(--navy))' }}>
            <Home className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">Nova Pesquisa</span>
          </button>
        )}
        {NAV_ITEMS.map((item, idx) => {
          const locked = idx > reached;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { if (!locked) onNavigate(item.id); }}
              disabled={locked}
              aria-current={isActive ? 'page' : undefined}
              aria-disabled={locked}
              aria-label={`Página ${item.short}: ${item.label}${locked ? ' (bloqueada — avance na apresentação para liberar)' : ''}`}
              title={locked ? `${item.label} — disponível ao avançar` : item.label}
              className={`nav-pill whitespace-nowrap text-[11px] sm:text-xs inline-flex items-center ${isActive ? 'nav-pill-active' : ''} ${locked ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <span className="font-bold mr-1">{item.short}</span>
              <span className="hidden sm:inline">{item.label}</span>
              {locked && <Lock className="w-3 h-3 ml-1 hidden sm:inline" aria-hidden />}
            </button>
          );
        })}
        <div className="ml-auto flex-shrink-0 pl-2">
          <FullscreenButton />
        </div>
      </div>

      {/* Linha de contexto unificada (substitui a ContextBar separada) */}
      {hasContext && (
        <div
          className="flex items-center gap-x-4 gap-y-1 flex-wrap px-3 sm:px-6 py-1 border-t text-[11px]"
          style={{ background: 'hsl(var(--beige))', color: 'hsl(var(--navy))', borderColor: 'hsl(var(--border))' }}
          role="status"
          aria-label="Contexto da apresentação"
        >
          {session && (
            <CtxItem icon={<User className="w-3 h-3" />} label="Consultor">
              {session.nome} · {session.codigo}
            </CtxItem>
          )}
          {escola && (
            <CtxItem icon={<GraduationCap className="w-3 h-3" />} label="Escola">
              {escola.Escola} ({escola.Município}/{escola.UF})
            </CtxItem>
          )}
          {etapaLabel && (
            <CtxItem icon={<Compass className="w-3 h-3" />} label="Etapa">{etapaLabel}</CtxItem>
          )}
          {typeof raioKm === 'number' && (
            <CtxItem icon={<MapPin className="w-3 h-3" />} label="Raio">
              {raioKm.toFixed(1).replace('.', ',')} km
              <span
                className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider"
                style={{
                  background: raioMode === 'personalizado' ? 'hsl(var(--teal))' : 'hsl(var(--teal-light))',
                  color: raioMode === 'personalizado' ? 'white' : 'hsl(var(--navy))',
                }}
              >
                {raioMode === 'personalizado' ? 'Personalizado' : 'Padrão'}
              </span>
            </CtxItem>
          )}
          {presentationType && (
            <CtxItem icon={<Briefcase className="w-3 h-3" />} label="Modo">
              {presentationType === 'prospeccao' ? 'Prospecção' : 'Renovação'}
            </CtxItem>
          )}
        </div>
      )}
    </nav>
  );
}

function CtxItem({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      <span style={{ color: 'hsl(var(--teal))' }}>{icon}</span>
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-semibold">{children}</span>
    </div>
  );
}
