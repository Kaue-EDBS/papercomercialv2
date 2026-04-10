import { AnalysisResult } from '@/lib/types';
import { num, formatPercent, formatNumber, getSegmentosLabel } from '@/lib/analysis';

interface Props {
  a1: AnalysisResult;
  a2: AnalysisResult;
}

export default function ComparativeModule({ a1, a2 }: Props) {
  const schools = [a1, a2];

  const getPositionLabel = (a: AnalysisResult) => {
    if (a.marketShare.geral >= 30) return 'Líder';
    if (a.marketShare.geral >= 15) return 'Forte';
    if (a.marketShare.geral >= 5) return 'Intermediário';
    return 'Desafiante';
  };

  const getResume = (a: AnalysisResult) => {
    const ms = formatPercent(a.marketShare.geral);
    const conc = a.concorrentes.length;
    if (a.marketShare.geral >= 20) return `Escola bem posicionada com ${ms} de market share e ${conc} concorrentes na área de influência.`;
    if (a.marketShare.geral >= 10) return `Posição intermediária com ${ms} de market share. ${conc} concorrentes atuam na mesma área.`;
    return `Market share de ${ms} indica oportunidade de crescimento. Ambiente competitivo com ${conc} concorrentes.`;
  };

  const colors = ['hsl(var(--teal))', 'hsl(var(--navy))'];

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-8 px-3 sm:px-4 space-y-6">
      <h2 className="page-title text-xl sm:text-2xl">VISÃO GERAL COMPARATIVA</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {schools.map((a, i) => {
          const mensalidade = a.escola.Mensalidade === '0' || !a.escola.Mensalidade ? 'N/D' : `R$ ${a.escola.Mensalidade}`;
          return (
            <div key={i} className="bg-card rounded-xl border p-4 sm:p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-sm sm:text-base" style={{ color: colors[i] }}>{a.escola.Escola}</h3>
                <span
                  className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                  style={{ background: `${colors[i]}20`, color: colors[i] }}
                >
                  {getPositionLabel(a)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:text-sm">
                <div>
                  <span className="text-muted-foreground">Código Inep</span>
                  <p className="font-medium">{a.escola['Código Inep']}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Cidade/UF</span>
                  <p className="font-medium">{a.escola.Município}/{a.escola.UF}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Alunado Total</span>
                  <p className="font-medium">{formatNumber(num(a.escola['Alunado Total']))}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Mensalidade</span>
                  <p className="font-medium">{mensalidade}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Segmentos</span>
                  <p className="font-medium">{getSegmentosLabel(a.escola)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Raio Operacional</span>
                  <p className="font-medium">{a.raioOperacional} km</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Market Share</span>
                  <p className="font-bold" style={{ color: colors[i] }}>{formatPercent(a.marketShare.geral)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Concorrentes</span>
                  <p className="font-medium">{a.concorrentes.length}</p>
                </div>
              </div>

              <div className="pt-2 border-t text-xs sm:text-sm text-muted-foreground italic">
                {getResume(a)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparative insight */}
      <div className="insight-box text-xs sm:text-sm space-y-2">
        <h4 className="font-semibold" style={{ color: 'hsl(var(--navy))' }}>Análise Comparativa</h4>
        <p>
          {a1.escola.Município === a2.escola.Município
            ? 'As duas escolas atuam no mesmo município, disputando a mesma base de famílias.'
            : 'As escolas atuam em municípios distintos, com dinâmicas de mercado independentes.'}
        </p>
        <p>
          <strong>{num(a1.escola['Alunado Total']) > num(a2.escola['Alunado Total']) ? a1.escola.Escola : a2.escola.Escola}</strong> possui maior alunado total, enquanto{' '}
          <strong>{a1.marketShare.geral > a2.marketShare.geral ? a1.escola.Escola : a2.escola.Escola}</strong> detém maior market share na respectiva área de influência.
        </p>
        <p>
          Em termos competitivos, <strong>{a1.concorrentes.length > a2.concorrentes.length ? a1.escola.Escola : a2.escola.Escola}</strong> enfrenta maior número de concorrentes ({Math.max(a1.concorrentes.length, a2.concorrentes.length)}), indicando maior pressão competitiva.
        </p>
      </div>
    </div>
  );
}
