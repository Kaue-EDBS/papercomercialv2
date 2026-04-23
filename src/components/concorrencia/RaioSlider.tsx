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
  min = 1,
  max = 20,
  step = 1,
  onChange,
  label = 'Raio da área de influência',
  hint,
}: Props) {
  const [hover, setHover] = useState(false);
  const [unit, setUnit] = useState<'km' | 'm'>('km');
  const isCustom = Math.abs(value - defaultValue) > 0.001;

  // Faixas conforme unidade selecionada:
  // - km: 1 km a 20 km (passo 1 km, podendo ser sobrescrito por prop)
  // - m : 10 m a 999 m (passo 10 m = 0,01 km)
  const effectiveMin = unit === 'm' ? 0.01 : Math.max(min, 1);
  const effectiveMax = unit === 'm' ? 0.999 : max;
  const effectiveStep = unit === 'm' ? 0.01 : step;

  // Garante que o valor atual fique dentro da faixa ativa para a régua
  const clampedValue = Math.min(Math.max(value, effectiveMin), effectiveMax);
  const pct = (v: number) => ((v - effectiveMin) / (effectiveMax - effectiveMin)) * 100;

  const fmt = (km: number) =>
    unit === 'm'
      ? `${Math.round(km * 1000).toLocaleString('pt-BR')} m`
      : `${km.toFixed(1).replace('.', ',')} km`;

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
          {/* Toggle de unidade km / m */}
          <div
            className="inline-flex rounded-md overflow-hidden border text-[10px] font-bold uppercase tracking-wider"
            style={{ borderColor: 'hsl(var(--teal-light))' }}
            role="group"
            aria-label="Unidade de distância"
          >
            {(['km', 'm'] as const).map((u) => {
              const active = unit === u;
              return (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className="px-2 py-0.5 transition-colors"
                  style={{
                    background: active ? 'hsl(var(--teal))' : 'transparent',
                    color: active ? 'white' : 'hsl(var(--teal-dark))',
                  }}
                  aria-pressed={active}
                >
                  {u}
                </button>
              );
            })}
          </div>
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
            {fmt(value)}
          </span>
        </div>
      </div>

      {/* Trilho com marcas */}
      <div className="relative pt-1 pb-4">
        {/* marca do padrão */}
        <div
          className="absolute top-1 -translate-x-1/2 z-0 pointer-events-none"
          style={{ left: `${Math.min(Math.max(pct(defaultValue), 0), 100)}%` }}
        >
          <div className="w-px h-3" style={{ background: 'hsl(var(--teal) / 0.55)' }} />
        </div>
        <input
          type="range"
          min={effectiveMin}
          max={effectiveMax}
          step={effectiveStep}
          value={clampedValue}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          className="raio-slider w-full relative z-10"
          style={{
            // gradiente de progresso
            background: `linear-gradient(to right,
              hsl(var(--teal)) 0%,
              hsl(var(--teal)) ${pct(clampedValue)}%,
              hsl(var(--beige-dark)) ${pct(clampedValue)}%,
              hsl(var(--beige-dark)) 100%)`,
          }}
          aria-label={`${label} em ${unit === 'm' ? 'metros' : 'quilômetros'}`}
          aria-valuemin={effectiveMin}
          aria-valuemax={effectiveMax}
          aria-valuenow={clampedValue}
        />
        {/* labels mín/padrão/máx */}
        <div className="absolute left-0 right-0 bottom-0 text-[10px] text-muted-foreground pointer-events-none">
          <span className="absolute left-0">{fmt(effectiveMin)}</span>
          {defaultValue >= effectiveMin && defaultValue <= effectiveMax && (
            <span
              className="absolute -translate-x-1/2 font-semibold"
              style={{ left: `${pct(defaultValue)}%`, color: 'hsl(var(--teal-dark))' }}
              title="Raio padrão pela densidade escolar"
            >
              ▲ padrão {fmt(defaultValue)}
            </span>
          )}
          <span className="absolute right-0">{fmt(effectiveMax)}</span>
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