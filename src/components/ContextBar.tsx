import { ConsultorSession, PresentationType, EscolaData } from '@/lib/types';
import { User, MapPin, Compass, Briefcase, GraduationCap } from 'lucide-react';

interface Props {
  session: ConsultorSession | null;
  escola?: EscolaData;
  raioKm: number;
  raioMode: 'padrao' | 'personalizado';
  presentationType: PresentationType | null;
  etapaLabel: string;
}

/**
 * Barra de contexto fina, sempre visível durante a Etapa 3.
 * Mostra consultor, escola, etapa atual, raio (com indicação Padrão/Personalizado)
 * e modo (Prospecção/Renovação).
 */
export default function ContextBar({ session, escola, raioKm, raioMode, presentationType, etapaLabel }: Props) {
  return (
    <div
      className="flex items-center gap-3 sm:gap-5 px-3 sm:px-6 py-1.5 border-b text-[11px] overflow-x-auto scrollbar-hide"
      style={{ background: 'hsl(var(--beige))', color: 'hsl(var(--navy))' }}
      role="status"
      aria-label="Contexto da apresentação"
    >
      {session && (
        <Item icon={<User className="w-3 h-3" />} label="Consultor">
          {session.nome} · {session.codigo}
        </Item>
      )}
      {escola && (
        <Item icon={<GraduationCap className="w-3 h-3" />} label="Escola">
          {escola.Escola} ({escola.Município}/{escola.UF})
        </Item>
      )}
      <Item icon={<Compass className="w-3 h-3" />} label="Etapa">
        {etapaLabel}
      </Item>
      <Item icon={<MapPin className="w-3 h-3" />} label="Raio">
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
      </Item>
      {presentationType && (
        <Item icon={<Briefcase className="w-3 h-3" />} label="Modo">
          {presentationType === 'prospeccao' ? 'Prospecção' : 'Renovação'}
        </Item>
      )}
    </div>
  );
}

function Item({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      <span style={{ color: 'hsl(var(--teal))' }}>{icon}</span>
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-semibold">{children}</span>
    </div>
  );
}
