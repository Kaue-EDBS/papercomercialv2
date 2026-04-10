import { AppPage } from '@/lib/types';
import { Home, Maximize, Minimize } from 'lucide-react';
import { useState, useCallback } from 'react';

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
  { id: 'encerramento', label: 'Encerramento', short: '9' },
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
}

export default function NavigationBar({ currentPage, onNavigate, isComparative, onBackToMain, onBack, onNewSearch }: Props) {
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

  return (
    <nav className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-6 py-2 sm:py-3 border-b bg-card overflow-x-auto scrollbar-hide">
      {onBack && (
        <button onClick={onBack} className="nav-pill mr-1 sm:mr-2 text-[10px] sm:text-xs font-semibold whitespace-nowrap" style={{ color: 'hsl(var(--teal))' }}>
          ← <span className="hidden sm:inline">Voltar</span>
        </button>
      )}
      {onNewSearch && (
        <button onClick={onNewSearch} className="nav-pill flex items-center gap-1 text-[10px] sm:text-xs font-semibold mr-1 sm:mr-2 whitespace-nowrap" style={{ color: 'hsl(var(--navy))' }}>
          <Home className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">Nova Pesquisa</span>
        </button>
      )}
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={`nav-pill whitespace-nowrap text-[10px] sm:text-xs ${currentPage === item.id ? 'nav-pill-active' : ''}`}
        >
          <span className="font-bold mr-0.5 sm:mr-1">{item.short}</span>
          <span className="hidden md:inline">{item.label}</span>
        </button>
      ))}
      <div className="ml-auto flex-shrink-0">
        <FullscreenButton />
      </div>
    </nav>
  );
}
