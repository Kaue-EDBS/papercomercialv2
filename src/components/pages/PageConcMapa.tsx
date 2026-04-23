import { useState } from 'react';
import { AnalysisResult } from '@/lib/types';
import ConcorrenciaMap from './ConcorrenciaMap';
import { MapPin, Check } from 'lucide-react';

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
  const [openAjuste, setOpenAjuste] = useState(false);
  const [valor, setValor] = useState<string>(String(raioAtual));
  const [unidade, setUnidade] = useState<'km' | 'm'>('km');
  const [erro, setErro] = useState('');

  const aplicar = () => {
    const v = parseFloat(valor.replace(',', '.'));
    if (isNaN(v) || v <= 0) { setErro('Digite um número maior que zero.'); return; }
    const km = unidade === 'km' ? v : v / 1000;
    if (km > 50) { setErro('Raio máximo permitido: 50 km.'); return; }
    setErro('');
    setOpenAjuste(false);
    onApplyNewRaio(km);
  };

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

        {/* Ajuste de raio inline (logo abaixo do mapa, não-modal) */}
        <div className="border-t" style={{ background: 'hsl(var(--beige) / 0.5)' }}>
          {!openAjuste ? (
            <div className="flex items-center justify-between gap-2 px-3 py-2.5">
              <div className="text-xs">
                <span className="text-muted-foreground">Raio da área de influência:</span>{' '}
                <strong className="tabular-nums" style={{ color: 'hsl(var(--navy))' }}>{raioAtual} km</strong>
              </div>
              <button
                onClick={() => { setValor(String(raioAtual)); setUnidade('km'); setErro(''); setOpenAjuste(true); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-card hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary"
                style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--navy))' }}
              >
                <Settings2 className="w-3.5 h-3.5" />
                Alterar raio
              </button>
            </div>
          ) : (
            <div className="px-3 py-3 space-y-2">
              <label htmlFor="raio-valor" className="block text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--navy))' }}>
                Novo raio
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="raio-valor"
                  type="number"
                  min="0"
                  step="0.1"
                  value={valor}
                  onChange={e => setValor(e.target.value)}
                  className="flex-1 h-10 px-3 rounded-lg border bg-background text-sm focus-visible:ring-2 focus-visible:ring-primary outline-none"
                  placeholder={unidade === 'km' ? 'Ex.: 5' : 'Ex.: 1500'}
                  aria-describedby="raio-help"
                />
                <div className="inline-flex rounded-lg border overflow-hidden self-start" role="radiogroup" aria-label="Unidade do raio">
                  {(['km', 'm'] as const).map(u => (
                    <button
                      key={u}
                      role="radio"
                      aria-checked={unidade === u}
                      onClick={() => setUnidade(u)}
                      className="px-3 h-10 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-primary"
                      style={{
                        background: unidade === u ? 'hsl(var(--teal))' : 'hsl(var(--card))',
                        color: unidade === u ? 'white' : 'hsl(var(--navy))',
                      }}
                    >
                      {u}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setOpenAjuste(false); setErro(''); }}
                    className="px-4 h-10 rounded-lg text-sm font-semibold border bg-card hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary"
                    style={{ color: 'hsl(var(--navy))' }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={aplicar}
                    className="px-4 h-10 rounded-lg text-sm font-semibold text-white hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    style={{ background: 'hsl(var(--teal))' }}
                  >
                    Aplicar
                  </button>
                </div>
              </div>
              <p id="raio-help" className="text-[11px] text-muted-foreground">
                {unidade === 'km' ? 'Informe o raio em quilômetros (ex.: 5).' : 'Informe o raio em metros (ex.: 1500).'}
              </p>
              {erro && <p role="alert" className="text-xs" style={{ color: 'hsl(0,70%,40%)' }}>{erro}</p>}
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
