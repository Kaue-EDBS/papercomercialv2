import { useState } from 'react';
import { AnalysisResult } from '@/lib/types';
import ConcorrenciaMap from './ConcorrenciaMap';
import { MapPin, Settings2, ArrowRight, X } from 'lucide-react';

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
  const [openModal, setOpenModal] = useState(false);
  const [valor, setValor] = useState<string>(String(raioAtual));
  const [unidade, setUnidade] = useState<'km' | 'm'>('km');
  const [erro, setErro] = useState('');

  const aplicar = () => {
    const v = parseFloat(valor.replace(',', '.'));
    if (isNaN(v) || v <= 0) { setErro('Informe um número maior que zero.'); return; }
    const km = unidade === 'km' ? v : v / 1000;
    if (km > 50) { setErro('Raio máximo permitido: 50 km.'); return; }
    setErro('');
    setOpenModal(false);
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
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-5 space-y-3">
        <div className="text-sm font-semibold" style={{ color: 'hsl(var(--navy))' }}>
          Deseja alterar o raio da área de influência?
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={onKeep}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'hsl(var(--teal))' }}
          >
            Não, seguir para a apresentação
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setValor(String(raioAtual)); setUnidade('km'); setErro(''); setOpenModal(true); }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors hover:bg-accent"
            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--navy))' }}
          >
            <Settings2 className="w-4 h-4" />
            Sim, alterar raio
          </button>
        </div>
      </div>

      {openModal && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-card rounded-xl border shadow-xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold" style={{ color: 'hsl(var(--navy))' }}>Novo raio da área de influência</h3>
              <button onClick={() => setOpenModal(false)} aria-label="Fechar" className="p-1 rounded hover:bg-accent"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-2">
              <label htmlFor="raio-valor" className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--navy))' }}>Valor</label>
              <div className="flex gap-2">
                <input
                  id="raio-valor"
                  type="number"
                  min="0"
                  step="0.1"
                  value={valor}
                  onChange={e => setValor(e.target.value)}
                  className="flex-1 h-11 px-3 rounded-lg border bg-background text-sm focus-visible:ring-2 outline-none"
                  placeholder="Ex.: 5"
                />
                <div className="inline-flex rounded-lg border overflow-hidden" role="radiogroup" aria-label="Unidade">
                  {(['km', 'm'] as const).map(u => (
                    <button
                      key={u}
                      role="radio"
                      aria-checked={unidade === u}
                      onClick={() => setUnidade(u)}
                      className="px-3 text-sm font-semibold transition-colors"
                      style={{
                        background: unidade === u ? 'hsl(var(--teal))' : 'transparent',
                        color: unidade === u ? 'white' : 'hsl(var(--navy))',
                      }}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {unidade === 'km' ? 'Ex.: raio em km (ex.: 5)' : 'Ex.: raio em metros (ex.: 1500)'}
              </p>
              {erro && <p role="alert" className="text-xs" style={{ color: 'hsl(0,70%,40%)' }}>{erro}</p>}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setOpenModal(false)} className="px-4 py-2 rounded-lg text-sm font-semibold border hover:bg-accent" style={{ color: 'hsl(var(--navy))' }}>Cancelar</button>
              <button onClick={aplicar} className="px-5 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: 'hsl(var(--teal))' }}>Aplicar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
