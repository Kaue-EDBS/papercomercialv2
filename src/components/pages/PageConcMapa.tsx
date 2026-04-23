import { useState, useEffect } from 'react';
import { AnalysisResult } from '@/lib/types';
import ConcorrenciaMap from './ConcorrenciaMap';
import { MapPin, Check } from 'lucide-react';
import RaioSlider from '@/components/concorrencia/RaioSlider';

interface Props {
  analysis: AnalysisResult;
  raioAtual: number;
  onKeep: () => void;
  onApplyNewRaio: (raioKm: number) => void;
}

/**
 * 2.3 — Mapa + validação do raio.
 * Pergunta se quer alterar o raio. Se sim, abre modal com valor + unidade (m/km).
 */
export default function PageConcMapa({ analysis, raioAtual, onKeep, onApplyNewRaio }: Props) {
  const { escola, concorrentes } = analysis;
  // Régua reativa local: o valor é confirmado pelo botão "Aplicar novo raio".
  // O raio inicial vem da prop (que pode ter sido alterado em uma volta anterior).
  const [pendingKm, setPendingKm] = useState<number>(raioAtual);
  useEffect(() => { setPendingKm(raioAtual); }, [raioAtual]);
  const isDirty = Math.abs(pendingKm - raioAtual) > 0.001;

  return (
    <div className="max-w-5xl mx-auto py-8 sm:py-10 px-3 sm:px-4 space-y-5">
      <header className="space-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--teal))' }}>
          Etapa 2 · Validação de Concorrência (3/3)
        </span>
        <h2 className="page-title text-xl sm:text-2xl">Mapa e raio de influência</h2>
        <p className="page-subtitle text-sm">
          Confira a localização dos concorrentes e valide o raio da área de influência.
        </p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="card-indicator">
          <span className="card-indicator-label !mt-0">Raio atual</span>
          <div className="card-indicator-value" style={{ color: 'hsl(var(--navy))' }}>{raioAtual} km</div>
        </div>
        <div className="card-indicator">
          <span className="card-indicator-label !mt-0">Concorrentes</span>
          <div className="card-indicator-value" style={{ color: 'hsl(var(--navy))' }}>{concorrentes.length}</div>
        </div>
        <div className="card-indicator">
          <span className="card-indicator-label !mt-0">Município</span>
          <div className="text-sm font-bold truncate" style={{ color: 'hsl(var(--navy))' }}>{escola.Município}</div>
        </div>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="px-3 py-2 border-b flex items-center gap-2" style={{ background: 'hsl(var(--teal-light))' }}>
          <MapPin className="w-4 h-4" style={{ color: 'hsl(var(--teal))' }} />
          <span className="text-xs font-semibold" style={{ color: 'hsl(var(--navy))' }}>Mapa de concorrência</span>
        </div>
        <ConcorrenciaMap escola={escola} concorrentes={concorrentes} />

        {/* Ajuste de raio com régua premium */}
        <div className="border-t p-3" style={{ background: 'hsl(var(--beige) / 0.4)' }}>
          <RaioSlider
            value={pendingKm}
            defaultValue={analysis.raioOperacional}
            onChange={setPendingKm}
            hint="Arraste para reajustar a área de influência. Confirme em “Aplicar novo raio” para reprocessar a lista de concorrentes."
          />
          {isDirty && (
            <div className="flex justify-end mt-3">
              <button
                onClick={() => onApplyNewRaio(pendingKm)}
                className="px-4 h-9 rounded-lg text-sm font-semibold text-white hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                style={{ background: 'hsl(var(--teal))' }}
              >
                Aplicar novo raio ({pendingKm.toFixed(1).replace('.', ',')} km)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Botões finais — ação principal e secundária */}
      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
        <button
          onClick={onKeep}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          style={{ background: 'hsl(var(--teal))' }}
        >
          <Check className="w-4 h-4" />
          Confirmar e seguir
        </button>
      </div>
    </div>
  );
}
