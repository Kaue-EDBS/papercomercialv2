import { ConsultorSession, PresentationType, EscolaData } from '@/lib/types';
import { User, MapPin, Compass, Briefcase, GraduationCap, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface Props {
  session: ConsultorSession | null;
  escola?: EscolaData;
  raioKm: number;
  raioMode: 'padrao' | 'personalizado';
  presentationType: PresentationType | null;
  etapaLabel: string;
  /** Quando true, mostra apenas Consultor/Escola/Etapa e move o resto para um painel expansível. */
  compact?: boolean;
}

/**
 * Barra de contexto fina, sempre visível.
 * Em modo `compact` (Etapa 2): exibe apenas Consultor / Escola / Etapa e
 * move Raio + Modo para um painel expansível "Detalhes", reduzindo poluição visual.
 */
export default function ContextBar({ session, escola, raioKm, raioMode, presentationType, etapaLabel, compact = false }: Props) {
  const [openDetalhes, setOpenDetalhes] = useState(false);
  const hasDetalhes = compact && (presentationType || raioKm);
  return (
    <div>
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
      {!compact && (
        <>
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
        </>
      )}
      {hasDetalhes && (
        <button
          type="button"
          onClick={() => setOpenDetalhes(o => !o)}
          aria-expanded={openDetalhes}
          className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold hover:bg-background/60 focus-visible:ring-2 focus-visible:ring-primary"
          style={{ color: 'hsl(var(--teal))' }}
        >
          Detalhes {openDetalhes ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      )}
    </div>
    {hasDetalhes && openDetalhes && (
      <div
        className="flex items-center gap-3 sm:gap-5 px-3 sm:px-6 py-1.5 border-b text-[11px] overflow-x-auto scrollbar-hide"
        style={{ background: 'hsl(var(--beige) / 0.6)', color: 'hsl(var(--navy))' }}
      >
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
