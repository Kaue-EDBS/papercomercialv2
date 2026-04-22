import { AnalysisResult } from '@/lib/types';
import { num, formatNumber, formatDistance, getSegmentos, getMensalidadeFaixa } from '@/lib/analysis';
import { Check, Settings2 } from 'lucide-react';

interface Props {
  analysis: AnalysisResult;
  essenciaisInep: string[];
  raioAtual: number;
  fromRaioAdjust?: boolean;
  onConfirm: () => void;
  onChangeRaio: () => void;
}

/**
 * 2.2 — Tabela final de concorrentes (até 15).
 * Essenciais sempre presentes; restante completado pela priorização automática.
 */
export default function PageConcTabela({ analysis, essenciaisInep, raioAtual, fromRaioAdjust, onConfirm, onChangeRaio }: Props) {
  const { escola, concorrentes } = analysis;
  const essenciaisSet = new Set(essenciaisInep.map(String));

  return (
    <div className="max-w-5xl mx-auto py-8 sm:py-10 px-3 sm:px-4 space-y-5">
      <header className="space-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--teal))' }}>
          Etapa 2 · Validação de Concorrência (2/3)
        </span>
        <h2 className="page-title text-xl sm:text-2xl">Tabela de concorrentes</h2>
        <p className="page-subtitle text-sm">
          Lista final com até 15 concorrentes. Os <strong>essenciais</strong> escolhidos por você entram obrigatoriamente; o sistema completa as demais vagas com candidatos elegíveis.
        </p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Indicator label="Total" value={String(concorrentes.length)} />
        <Indicator label="Essenciais" value={String(essenciaisInep.length)} />
        <Indicator label="Automáticos" value={String(Math.max(0, concorrentes.length - essenciaisInep.length))} />
        <Indicator label="Raio atual" value={`${raioAtual} km`} />
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-executive w-full">
            <thead>
              <tr>
                <th className="min-w-[200px]">Escola</th>
                <th className="w-24">Origem</th>
                <th className="w-24">Matr.</th>
                <th className="w-28">Distância</th>
                <th className="w-32">Segmentos</th>
                <th className="w-28">Mensalidade</th>
              </tr>
            </thead>
            <tbody>
              {concorrentes.map(c => {
                const inep = String(c.escola['Código Inep']);
                const isEss = essenciaisSet.has(inep);
                const segs = getSegmentos(c.escola);
                const mesmaFaixa = getMensalidadeFaixa(escola.Mensalidade) === getMensalidadeFaixa(c.escola.Mensalidade);
                return (
                  <tr key={inep}>
                    <td>
                      <div className="font-medium text-sm" style={{ color: 'hsl(var(--navy))' }}>{c.escola.Escola}</div>
                      <div className="text-[11px] text-muted-foreground">Inep {inep}</div>
                    </td>
                    <td>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{
                          background: isEss ? 'hsl(var(--teal))' : 'hsl(var(--teal-light))',
                          color: isEss ? 'white' : 'hsl(var(--navy))',
                        }}>
                        {isEss ? 'Essencial' : 'Automático'}
                      </span>
                    </td>
                    <td className="font-semibold">{formatNumber(num(c.escola['Alunado Total']))}</td>
                    <td>
                      {c.distancia !== null ? (
                        <span className="text-sm">{formatDistance(c.distancia)}</span>
                      ) : c.proximidadeCEP ? (
                        <span className="text-[11px] italic text-muted-foreground">Estimado por CEP</span>
                      ) : (
                        <span className="text-[11px] italic text-muted-foreground">Sem distância</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-1 flex-wrap">
                        {segs.map(s => <span key={s} className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'hsl(var(--teal-light))', color: 'hsl(var(--navy))' }}>{s}</span>)}
                      </div>
                    </td>
                    <td>
                      <span className="text-xs">
                        {c.escola.Mensalidade === '0' || !c.escola.Mensalidade ? 'N/D' : c.escola.Mensalidade}
                        {mesmaFaixa && <span className="ml-1 text-[10px]" style={{ color: 'hsl(var(--teal))' }}>● mesma faixa</span>}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {concorrentes.length === 0 && (
                <tr><td colSpan={6} className="text-center py-6 text-sm text-muted-foreground italic">Nenhum concorrente encontrado com o raio atual.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
        {fromRaioAdjust && (
          <button
            onClick={onChangeRaio}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors hover:bg-accent"
            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--navy))' }}
          >
            <Settings2 className="w-4 h-4" />
            Mudar raio
          </button>
        )}
        <button
          onClick={onConfirm}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'hsl(var(--teal))' }}
        >
          <Check className="w-4 h-4" />
          {fromRaioAdjust ? 'Confirmar e seguir' : 'Confirmar'}
        </button>
      </div>
    </div>
  );
}

function Indicator({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-indicator">
      <span className="card-indicator-label !mt-0">{label}</span>
      <div className="card-indicator-value" style={{ color: 'hsl(var(--navy))' }}>{value}</div>
    </div>
  );
}
