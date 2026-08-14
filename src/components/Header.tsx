import logo from '@/assets/ebsa_logo.png';
import { ConsultorSession } from '@/lib/types';
import { LogOut, User } from 'lucide-react';

interface Props {
  session?: ConsultorSession | null;
  onLogout?: () => void;
}

export default function Header({ session, onLogout }: Props) {
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-2 sm:py-3 border-b" style={{ background: 'hsl(var(--navy))' }}>
      <div className="flex items-center gap-3">
        <img src={logo} alt="Editora do Brasil" className="h-8 sm:h-10 object-contain" />
        <span className="text-[10px] sm:text-xs font-medium hidden md:inline" style={{ color: 'hsl(var(--teal-light))' }}>
          CIT — Centro de Inteligência Territorial
        </span>
      </div>
      {session && (
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg" style={{ background: 'hsl(220 50% 25%)' }}>
            <User className="w-3.5 h-3.5" style={{ color: 'hsl(var(--teal-light))' }} />
            <div className="text-[10px] sm:text-xs leading-tight">
              <div className="font-semibold" style={{ color: 'white' }}>{session.nome}</div>
              <div style={{ color: 'hsl(var(--teal-light))' }}>Cód. {session.codigo}</div>
            </div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              aria-label="Sair"
              title="Sair"
              className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40"
              style={{ color: 'hsl(var(--teal-light))' }}
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </header>
  );
}
