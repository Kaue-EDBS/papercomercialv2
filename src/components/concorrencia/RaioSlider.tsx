import { useState } from 'react';
import { RotateCcw } from 'lucide-react';

interface Props {
  value: number;
  defaultValue: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (km: number) => void;
  label?: string;
  hint?: string;
}

/**
 * Régua premium da área de influência.
 * - trilho com marcas (mín / padrão / máx)
 * - thumb maior, confortável (CSS abaixo)
 * - badge do valor atual em destaque
 * - indicador "padrão" vs. "ajustado"
 * - botão restaurar ao padrão quando ajustado
 */
export default function RaioSlider({
  value,
  defaultValue,
  min = 0.5,
  max = 20,
  step = 0.5,
  onChange,
  label = 'Raio da área de influência',
  hint,
}: Props) {
  const [hover, setHover] = useState(false);
  const isCustom = Math.abs(value - defaultValue) > 0.001;
  const pct = (v: number) => ((v - min) / (max - min)) * 100;

  return (
    <div className="rounded-lg border bg-card p-3 sm:p-4 space-y-2.5"
      style={{ borderColor: 'hsl(var(--teal-light))' }}>
      {/* Header com label e badge do valor */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: 'hsl(var(--navy))' }}>
            {label}
          </span>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{
              background: isCustom ? 'hsl(40 80% 92%)' : 'hsl(var(--teal-light))',
              color: isCustom ? 'hsl(40 80% 30%)' : 'hsl(var(--teal-dark))',
            }}
            title={isCustom ? 'Raio ajustado manualmente' : 'Raio padrão calculado pela densidade escolar'}
          >
            {isCustom ? 'Ajustado' : 'Padrão'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isCustom && (
            <button
              type="button"
              onClick={() => onChange(defaultValue)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold hover:underline focus-visible:ring-2 focus-visible:ring-primary rounded px-1"
              style={{ color: 'hsl(var(--teal))' }}
              title="Restaurar ao raio padrão"
            >
              <RotateCcw className="w-3 h-3" /> padrão
            </button>
          )}
          <span
            className="text-base sm:text-lg font-bold tabular-nums px-2.5 py-0.5 rounded-md"
            style={{
              background: 'hsl(var(--teal))',
              color: 'white',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              boxShadow: '0 2px 4px hsl(174 62% 35% / 0.25)',
            }}
          >
            {value.toFixed(1).replace('.', ',')} km
          </span>
        </div>
      </div>

      {/* Trilho com marcas */}
      <div className="relative pt-1 pb-4">
        {/* marca do padrão */}
        <div
          className="absolute top-1 -translate-x-1/2 z-0 pointer-events-none"
          style={{ left: `${pct(defaultValue)}%` }}
        >
          <div className="w-px h-3" style={{ background: 'hsl(var(--teal) / 0.55)' }} />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          className="raio-slider w-full relative z-10"
          style={{
            // gradiente de progresso
            background: `linear-gradient(to right,
              hsl(var(--teal)) 0%,
              hsl(var(--teal)) ${pct(value)}%,
              hsl(var(--beige-dark)) ${pct(value)}%,
              hsl(var(--beige-dark)) 100%)`,
          }}
          aria-label={`${label} em quilômetros`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
        />
        {/* labels mín/padrão/máx */}
        <div className="absolute left-0 right-0 bottom-0 text-[10px] text-muted-foreground pointer-events-none">
          <span className="absolute left-0">{min.toFixed(1).replace('.', ',')} km</span>
          <span
            className="absolute -translate-x-1/2 font-semibold"
            style={{ left: `${pct(defaultValue)}%`, color: 'hsl(var(--teal-dark))' }}
            title="Raio padrão pela densidade escolar"
          >
            ▲ padrão {defaultValue.toFixed(1).replace('.', ',')}
          </span>
          <span className="absolute right-0">{max} km</span>
        </div>
      </div>

      {hint && (
        <p className="text-[11px] text-muted-foreground leading-snug">
          {hint}
        </p>
      )}
    </div>
  );
}