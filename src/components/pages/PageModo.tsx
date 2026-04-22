import { ConsultorSession } from '@/lib/types';
import { Briefcase, FileText } from 'lucide-react';

interface Props {
  session: ConsultorSession;
  onSelect: (modo: 'carteira' | 'paper') => void;
}

export default function PageModo({ session, onSelect }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 px-4">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Olá,</p>
        <h1 className="page-title text-2xl sm:text-3xl">{session.nome}</h1>
        <p className="text-xs text-muted-foreground mt-1">Código Protheus: {session.codigo}{session.gestor && ` · Gestor: ${session.gestor}`}</p>
      </div>

      <div className="text-center">
        <h2 className="text-lg font-semibold" style={{ color: 'hsl(var(--navy))' }}>Como deseja começar?</h2>
        <p className="text-sm text-muted-foreground mt-1">Escolha uma das opções abaixo.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        <button
          onClick={() => onSelect('carteira')}
          className="group bg-card rounded-2xl border-2 p-6 text-left hover:border-primary focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary transition"
          style={{ borderColor: 'hsl(var(--border))' }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'hsl(var(--teal-light))' }}>
            <Briefcase className="w-6 h-6" style={{ color: 'hsl(var(--teal-dark))' }} />
          </div>
          <h3 className="font-bold text-lg mb-1" style={{ color: 'hsl(var(--navy))' }}>Carteira</h3>
          <p className="text-sm text-muted-foreground">Veja a tabela com as escolas da sua carteira e selecione uma para gerar o paper.</p>
        </button>

        <button
          onClick={() => onSelect('paper')}
          className="group bg-card rounded-2xl border-2 p-6 text-left hover:border-primary focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary transition"
          style={{ borderColor: 'hsl(var(--border))' }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'hsl(var(--lime-light))' }}>
            <FileText className="w-6 h-6" style={{ color: 'hsl(var(--navy))' }} />
          </div>
          <h3 className="font-bold text-lg mb-1" style={{ color: 'hsl(var(--navy))' }}>Paper</h3>
          <p className="text-sm text-muted-foreground">Buscar uma escola por Código Inep ou nome para gerar o paper comercial.</p>
        </button>
      </div>
    </div>
  );
}
