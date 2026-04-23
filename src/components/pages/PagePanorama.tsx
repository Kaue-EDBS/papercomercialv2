import { AnalysisResult } from '@/lib/types';
import { num, formatNumber } from '@/lib/analysis';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { School, Users, TrendingUp, Award } from 'lucide-react';

interface Props {
  analysis: AnalysisResult;
}

export default function PagePanorama({ analysis }: Props) {
  const { concorrentes, escola } = analysis;
  const todas = [escola, ...concorrentes.map(c => c.escola)];

  const totalEscolas = todas.length;
  const totalAlunos = todas.reduce((s, e) => s + num(e['Alunado Total']), 0);
  const totalEI = todas.reduce((s, e) => s + num(e.qt_mat_educacao_infantil), 0);
  const totalEFI = todas.reduce((s, e) => s + num(e.qt_mat_ensino_fundamental_anos_iniciais), 0);
  const totalEFII = todas.reduce((s, e) => s + num(e.qt_mat_ensino_fundamental_anos_finais), 0);
  const totalEM = todas.reduce((s, e) => s + num(e.qt_mat_ensino_medio), 0);

  const mediaAlunos = totalEscolas > 0 ? Math.round(totalAlunos / totalEscolas) : 0;

  // Cobertura: escolas que ofertam cada segmento (matrículas > 0)
  const escolasEI = todas.filter(e => num(e.qt_mat_educacao_infantil) > 0).length;
  const escolasEFI = todas.filter(e => num(e.qt_mat_ensino_fundamental_anos_iniciais) > 0).length;
  const escolasEFII = todas.filter(e => num(e.qt_mat_ensino_fundamental_anos_finais) > 0).length;
  const escolasEM = todas.filter(e => num(e.qt_mat_ensino_medio) > 0).length;

  const segmentos = [
    { nome: 'Educação Infantil', sigla: 'EI', alunos: totalEI, escolas: escolasEI },
    { nome: 'Ens. Fund. — Anos Iniciais', sigla: 'EFI', alunos: totalEFI, escolas: escolasEFI },
    { nome: 'Ens. Fund. — Anos Finais', sigla: 'EFII', alunos: totalEFII, escolas: escolasEFII },
    { nome: 'Ensino Médio', sigla: 'EM', alunos: totalEM, escolas: escolasEM },
  ];

  const segmentosOrdenados = [...segmentos].sort((a, b) => b.alunos - a.alunos);
  const segmentoLider = segmentosOrdenados[0];

  const pctNum = (v: number) => totalAlunos > 0 ? (v / totalAlunos) * 100 : 0;
  const pct = (v: number) => pctNum(v).toFixed(1).replace('.', ',') + '%';

  const chartData = segmentosOrdenados.map(s => ({
    name: s.sigla,
    alunos: s.alunos,
    pct: pctNum(s.alunos),
  }));

  const barColors = [
    'hsl(174, 62%, 35%)',
    'hsl(220, 70%, 25%)',
    'hsl(78, 60%, 45%)',
    'hsl(174, 40%, 50%)',
  ];

  // Executive subtitle
  const subtitulo = `A área de influência concentra ${totalEscolas} escolas e ${formatNumber(totalAlunos)} alunos. O segmento com maior representatividade é ${segmentoLider.nome} (${pct(segmentoLider.alunos)}), indicando ${pctNum(segmentoLider.alunos) > 40 ? 'forte concentração' : 'distribuição equilibrada'} neste nível de ensino.`;

  // Insight
  const segundoSegmento = segmentosOrdenados[1];
  const menorSegmento = segmentosOrdenados[segmentosOrdenados.length - 1];
  const insight1 = `O segmento ${segmentoLider.nome} lidera com ${pct(segmentoLider.alunos)} do total de alunos, seguido por ${segundoSegmento.nome} (${pct(segundoSegmento.alunos)}). ${pctNum(segmentoLider.alunos) > 45 ? 'A alta concentração sugere forte demanda e maior competição neste nível.' : 'A distribuição mais equilibrada indica oportunidades em múltiplos segmentos.'}`;
  const insight2 = `${menorSegmento.nome} representa apenas ${pct(menorSegmento.alunos)} do mercado — pode indicar ${menorSegmento.alunos === 0 ? 'ausência de oferta' : 'oportunidade de diferenciação'} para escolas que desejam atuar nesse segmento.`;

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-8 px-3 sm:px-4 space-y-4 sm:space-y-6">
      <h2 className="page-title text-xl sm:text-2xl">PANORAMA EDUCACIONAL DA REGIÃO</h2>
      <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground max-w-3xl">{subtitulo}</p>

      {/* Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-indicator">
          <div className="flex items-center gap-2 mb-1">
            <School className="w-4 h-4" style={{ color: 'hsl(var(--teal))' }} />
            <span className="card-indicator-label !mt-0">Escolas</span>
          </div>
          <div className="card-indicator-value" style={{ color: 'hsl(var(--navy))' }}>{totalEscolas}</div>
        </div>
        <div className="card-indicator">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4" style={{ color: 'hsl(var(--teal))' }} />
            <span className="card-indicator-label !mt-0">Total de Alunos</span>
          </div>
          <div className="card-indicator-value" style={{ color: 'hsl(var(--navy))' }}>{formatNumber(totalAlunos)}</div>
        </div>
        <div className="card-indicator">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4" style={{ color: 'hsl(var(--teal))' }} />
            <span className="card-indicator-label !mt-0">Média/Escola</span>
          </div>
          <div className="card-indicator-value" style={{ color: 'hsl(var(--navy))' }}>{formatNumber(mediaAlunos)}</div>
        </div>
        <div className="card-indicator">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4" style={{ color: 'hsl(var(--teal))' }} />
            <span className="card-indicator-label !mt-0">Segmento Líder</span>
          </div>
          <div className="text-sm sm:text-base font-bold" style={{ color: 'hsl(var(--navy))' }}>{segmentoLider.sigla}</div>
          <span className="text-[10px] text-muted-foreground">{pct(segmentoLider.alunos)}</span>
        </div>
      </div>

      {/* Horizontal bar chart */}
      <div className="bg-card rounded-xl border p-4 sm:p-5">
        <h3 className="font-semibold mb-3 text-xs sm:text-sm" style={{ color: 'hsl(var(--navy))' }}>Distribuição do Mercado por Segmento</h3>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={45} tick={{ fontSize: 12, fill: 'hsl(220,70%,18%)' }} />
              <Tooltip
                formatter={(value: number) => [formatNumber(value), 'Alunos']}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }}
              />
              <Bar dataKey="alunos" radius={[0, 6, 6, 0]} barSize={28}
                label={{ position: 'right', fontSize: 11, fill: 'hsl(220,70%,25%)', formatter: (v: number) => formatNumber(v) }}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={barColors[i % barColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela 1 — Cobertura: quantas escolas ofertam cada segmento */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="px-4 sm:px-5 pt-4 pb-2">
          <h3 className="font-semibold text-xs sm:text-sm" style={{ color: 'hsl(var(--navy))' }}>Cobertura por Segmento</h3>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">Quantas escolas ofertam cada nível de ensino na região</p>
        </div>
        <table className="table-executive w-full">
          <thead>
            <tr>
              <th className="text-left">Segmento</th>
              <th className="text-right">Escolas que ofertam</th>
              <th className="text-right">% das escolas</th>
              <th className="w-32 sm:w-40"></th>
            </tr>
          </thead>
          <tbody>
            {[...segmentos].sort((a, b) => b.escolas - a.escolas).map((s, i) => {
              const pCob = totalEscolas > 0 ? (s.escolas / totalEscolas) * 100 : 0;
              const isMax = i === 0;
              const corIdx = segmentosOrdenados.findIndex(x => x.sigla === s.sigla);
              return (
                <tr key={s.sigla} className={isMax ? 'font-semibold' : ''}>
                  <td className="whitespace-nowrap">
                    <span className="flex items-center gap-2">
                      {s.nome}
                      {isMax && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: 'hsl(var(--teal-light))', color: 'hsl(var(--teal))' }}>
                          MAIOR COBERTURA
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="text-right">{s.escolas} de {totalEscolas}</td>
                  <td className="text-right">{pCob.toFixed(1).replace('.', ',')}%</td>
                  <td>
                    <div className="w-full rounded-full h-2.5" style={{ background: 'hsl(var(--muted))' }}>
                      <div className="h-2.5 rounded-full transition-all" style={{ width: `${Math.max(pCob, 2)}%`, background: barColors[corIdx % barColors.length] }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Tabela 2 — Volume de alunos por segmento */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="px-4 sm:px-5 pt-4 pb-2">
          <h3 className="font-semibold text-xs sm:text-sm" style={{ color: 'hsl(var(--navy))' }}>Volume de Alunos por Segmento</h3>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">Distribuição da demanda total entre os níveis de ensino</p>
        </div>
        <table className="table-executive w-full">
          <thead>
            <tr>
              <th className="text-left">Segmento</th>
              <th className="text-right">Alunos</th>
              <th className="text-right">%</th>
              <th className="w-32 sm:w-40"></th>
            </tr>
          </thead>
          <tbody>
            {segmentosOrdenados.map((s, i) => {
              const p = pctNum(s.alunos);
              const isMax = i === 0;
              return (
                <tr key={s.sigla} className={isMax ? 'font-semibold' : ''}>
                  <td className="whitespace-nowrap">
                    <span className="flex items-center gap-2">
                      {s.nome}
                      {isMax && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: 'hsl(var(--teal-light))', color: 'hsl(var(--teal))' }}>
                          LÍDER
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="text-right">{formatNumber(s.alunos)}</td>
                  <td className="text-right">{pct(s.alunos)}</td>
                  <td>
                    <div className="w-full rounded-full h-2.5" style={{ background: 'hsl(var(--muted))' }}>
                      <div className="h-2.5 rounded-full transition-all" style={{ width: `${Math.max(p, 2)}%`, background: barColors[i % barColors.length] }} />
                    </div>
                  </td>
                </tr>
              );
            })}
            <tr className="font-bold border-t-2" style={{ borderColor: 'hsl(var(--navy))' }}>
              <td>Total</td>
              <td className="text-right">{formatNumber(totalAlunos)}</td>
              <td className="text-right">100%</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Insight box */}
      <div className="rounded-xl border p-4 sm:p-5 space-y-2" style={{ background: 'hsl(var(--teal-light))', borderColor: 'hsl(var(--teal))' }}>
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4" style={{ color: 'hsl(var(--teal))' }} />
          <span className="text-xs font-bold uppercase" style={{ color: 'hsl(var(--navy))' }}>Leitura Estratégica</span>
        </div>
        <p className="text-[11px] sm:text-xs leading-relaxed text-muted-foreground">{insight1}</p>
        <p className="text-[11px] sm:text-xs leading-relaxed text-muted-foreground">{insight2}</p>
      </div>
    </div>
  );
}
