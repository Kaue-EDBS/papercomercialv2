import { AnalysisResult } from '@/lib/types';
import { num, formatPercent, formatNumber } from '@/lib/analysis';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  analysis: AnalysisResult;
}

const SEGMENT_COLORS = {
  ei: 'hsl(174, 62%, 35%)',
  efi: 'hsl(220, 70%, 18%)',
  efii: 'hsl(78, 70%, 50%)',
  em: 'hsl(174, 62%, 28%)',
};

const SEGMENT_KEYS = [
  { key: 'ei', field: 'qt_mat_educacao_infantil', label: 'Educação Infantil', color: SEGMENT_COLORS.ei },
  { key: 'efi', field: 'qt_mat_ensino_fundamental_anos_iniciais', label: 'Ens. Fundamental AI', color: SEGMENT_COLORS.efi },
  { key: 'efii', field: 'qt_mat_ensino_fundamental_anos_finais', label: 'Ens. Fundamental AF', color: SEGMENT_COLORS.efii },
  { key: 'em', field: 'qt_mat_ensino_medio', label: 'Ensino Médio', color: SEGMENT_COLORS.em },
] as const;

export default function PageMarketShare({ analysis }: Props) {
  const { escola, concorrentes, marketShare } = analysis;

  const allSchools = [
    { name: escola.Escola, total: num(escola['Alunado Total']), isTarget: true, data: escola },
    ...concorrentes.map(c => ({ name: c.escola.Escola, total: num(c.escola['Alunado Total']), isTarget: false, data: c.escola })),
  ].sort((a, b) => b.total - a.total);

  const universoTotal = allSchools.reduce((s, e) => s + e.total, 0);

  // Ranking geral top 10
  const rankingData = allSchools.slice(0, 10).map(s => ({
    name: s.name.length > 22 ? s.name.slice(0, 19) + '...' : s.name,
    fullName: s.name,
    share: universoTotal > 0 ? (s.total / universoTotal) * 100 : 0,
    alunos: s.total,
    isTarget: s.isTarget,
  }));

  // Segment composition for target school
  const escolaEI = num(escola.qt_mat_educacao_infantil);
  const escolaEFI = num(escola.qt_mat_ensino_fundamental_anos_iniciais);
  const escolaEFII = num(escola.qt_mat_ensino_fundamental_anos_finais);
  const escolaEM = num(escola.qt_mat_ensino_medio);
  const escolaTotal = escolaEI + escolaEFI + escolaEFII + escolaEM;

  const segmentComposition = [
    { key: 'ei', label: 'Educação Infantil', value: escolaEI, pct: escolaTotal > 0 ? (escolaEI / escolaTotal) * 100 : 0, color: SEGMENT_COLORS.ei },
    { key: 'efi', label: 'Ens. Fundamental AI', value: escolaEFI, pct: escolaTotal > 0 ? (escolaEFI / escolaTotal) * 100 : 0, color: SEGMENT_COLORS.efi },
    { key: 'efii', label: 'Ens. Fundamental AF', value: escolaEFII, pct: escolaTotal > 0 ? (escolaEFII / escolaTotal) * 100 : 0, color: SEGMENT_COLORS.efii },
    { key: 'em', label: 'Ensino Médio', value: escolaEM, pct: escolaTotal > 0 ? (escolaEM / escolaTotal) * 100 : 0, color: SEGMENT_COLORS.em },
  ].filter(s => s.value > 0);

  // Segment rankings (top 10 per segment)
  const segmentRankings = SEGMENT_KEYS.map(seg => {
    const schools = allSchools
      .map(s => ({ name: s.name, value: num((s.data as any)[seg.field]), isTarget: s.isTarget }))
      .filter(s => s.value > 0);
    const segTotal = schools.reduce((sum, s) => sum + s.value, 0);
    const ranked = schools
      .map(s => ({ ...s, share: segTotal > 0 ? (s.value / segTotal) * 100 : 0 }))
      .sort((a, b) => b.share - a.share)
      .slice(0, 10)
      .map(s => ({ ...s, displayName: s.name.length > 20 ? s.name.slice(0, 17) + '...' : s.name }));
    return { ...seg, ranked, hasData: ranked.length > 0 };
  }).filter(s => s.hasData);

  // Heatmap data
  const heatmapSchools = allSchools.slice(0, 10);
  const heatmapData = heatmapSchools.map(s => {
    const vals = SEGMENT_KEYS.map(seg => {
      const val = num((s.data as any)[seg.field]);
      const segTotal = allSchools.reduce((sum, sc) => sum + num((sc.data as any)[seg.field]), 0);
      return { key: seg.key, label: seg.label, share: segTotal > 0 ? (val / segTotal) * 100 : 0 };
    });
    return { name: s.name, isTarget: s.isTarget, segments: vals };
  });

  const top3Share = allSchools.slice(0, 3).reduce((s, e) => s + e.total, 0) / (universoTotal || 1) * 100;
  const isConcentrated = top3Share > 50;
  const leader = allSchools[0];

  const segmentos = [
    { label: 'Educação Infantil', value: marketShare.ei },
    { label: 'Ens. Fund. AI', value: marketShare.efi },
    { label: 'Ens. Fund. AF', value: marketShare.efii },
    { label: 'Ensino Médio', value: marketShare.em },
  ];

  const SegTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-card border rounded-lg p-2.5 shadow-lg text-xs">
        <p className="font-semibold mb-1" style={{ color: 'hsl(var(--navy))' }}>{d.fullName || d.name}</p>
        <p>Market Share: <strong>{formatPercent(d.share)}</strong></p>
        {d.alunos !== undefined && <p>Alunos: <strong>{formatNumber(d.alunos)}</strong></p>}
        {d.value !== undefined && <p>Matrículas: <strong>{formatNumber(d.value)}</strong></p>}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-8 px-3 sm:px-4 space-y-4 sm:space-y-6">
      <h2 className="page-title text-xl sm:text-2xl">MARKET SHARE</h2>
      <p className="page-subtitle text-xs sm:text-sm">Participação relativa da escola no mercado dentro da área de influência</p>

      <div className="bg-card rounded-xl border p-4 sm:p-5 text-xs sm:text-sm space-y-2">
        <p><strong>O que é:</strong> O market share representa a participação relativa da escola no total de alunos das escolas elegíveis dentro da área de influência.</p>
        <p className="hidden sm:block"><strong>Metodologia:</strong> Calculado como o alunado da escola analisada dividido pela soma do alunado de todas as escolas elegíveis (escola analisada + concorrentes selecionados).</p>
      </div>

      {/* Share cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
        <div className="card-indicator col-span-2 sm:col-span-1">
          <div className="card-indicator-value text-2xl sm:text-3xl" style={{ color: 'hsl(var(--teal))' }}>{formatPercent(marketShare.geral)}</div>
          <div className="card-indicator-label text-xs">Geral</div>
        </div>
        {segmentos.map(s => (
          <div key={s.label} className="card-indicator">
            <div className="card-indicator-value text-lg sm:text-xl" style={{ color: 'hsl(var(--navy))' }}>{formatPercent(s.value)}</div>
            <div className="card-indicator-label text-[10px] sm:text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Ranking de Market Share Geral */}
      <div className="bg-card rounded-xl border p-4 sm:p-5">
        <h3 className="font-semibold mb-3 sm:mb-4 text-xs sm:text-sm" style={{ color: 'hsl(var(--navy))' }}>Ranking de Market Share — Top 10</h3>
        <div style={{ height: Math.max(250, rankingData.length * 32) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rankingData} layout="vertical" margin={{ left: 0, right: 50 }}>
              <XAxis type="number" domain={[0, 'auto']} tickFormatter={v => `${v.toFixed(0)}%`} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 9 }} />
              <Tooltip content={<SegTooltip />} />
              <Bar dataKey="share" radius={[0, 4, 4, 0]} label={{ position: 'right', formatter: (v: number) => formatPercent(v), fontSize: 10, fill: 'hsl(220, 70%, 18%)' }}>
                {rankingData.map((entry, i) => (
                  <Cell key={i} fill={entry.isTarget ? 'hsl(174, 62%, 35%)' : 'hsl(220, 50%, 30%)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-3 text-[10px] sm:text-xs">
          <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded" style={{ background: 'hsl(174, 62%, 35%)' }} /> Escola analisada</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded" style={{ background: 'hsl(220, 50%, 30%)' }} /> Concorrentes</span>
        </div>
      </div>

      {/* Market Share por Segmento — 4 gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {segmentRankings.map(seg => (
          <div key={seg.key} className="bg-card rounded-xl border p-4 sm:p-5">
            <h3 className="font-semibold mb-2 sm:mb-3 text-xs sm:text-sm flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded" style={{ background: seg.color }} />
              <span style={{ color: 'hsl(var(--navy))' }}>{seg.label}</span>
            </h3>
            <div style={{ height: Math.max(150, seg.ranked.length * 28) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={seg.ranked} layout="vertical" margin={{ left: 0, right: 45 }}>
                  <XAxis type="number" domain={[0, 'auto']} tickFormatter={v => `${v.toFixed(0)}%`} tick={{ fontSize: 9 }} hide />
                  <YAxis type="category" dataKey="displayName" width={110} tick={{ fontSize: 8 }} />
                  <Tooltip content={<SegTooltip />} />
                  <Bar dataKey="share" radius={[0, 3, 3, 0]} label={{ position: 'right', formatter: (v: number) => formatPercent(v), fontSize: 9, fill: 'hsl(220, 70%, 18%)' }}>
                    {seg.ranked.map((entry, i) => (
                      <Cell key={i} fill={entry.isTarget ? seg.color : 'hsl(220, 50%, 30%, 0.6)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* Composição do Alunado — barra empilhada (apoio secundário) */}
      <div className="bg-card rounded-xl border p-4 sm:p-5">
        <h3 className="font-semibold mb-3 sm:mb-4 text-xs sm:text-sm" style={{ color: 'hsl(var(--navy))' }}>Composição do Alunado — {escola.Escola.length > 30 ? escola.Escola.slice(0, 27) + '...' : escola.Escola}</h3>
        <div className="w-full h-10 sm:h-12 rounded-lg overflow-hidden flex">
          {segmentComposition.map(s => (
            <div
              key={s.key}
              className="h-full flex items-center justify-center text-white font-semibold text-[10px] sm:text-xs transition-all"
              style={{ width: `${s.pct}%`, background: s.color, minWidth: s.pct > 0 ? '2rem' : 0 }}
              title={`${s.label}: ${formatNumber(s.value)} alunos (${formatPercent(s.pct)})`}
            >
              {s.pct >= 8 && formatPercent(s.pct)}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3">
          {segmentComposition.map(s => (
            <span key={s.key} className="flex items-center gap-1.5 text-[10px] sm:text-xs">
              <span className="inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 rounded" style={{ background: s.color }} />
              {s.label}: {formatNumber(s.value)} ({formatPercent(s.pct)})
            </span>
          ))}
        </div>
      </div>

      {/* Heatmap comparativo */}
      {heatmapData.length > 1 && (
        <div className="bg-card rounded-xl border p-4 sm:p-5 overflow-x-auto">
          <h3 className="font-semibold mb-3 sm:mb-4 text-xs sm:text-sm" style={{ color: 'hsl(var(--navy))' }}>Heatmap — Market Share por Segmento</h3>
          <table className="w-full text-[10px] sm:text-xs min-w-[400px]">
            <thead>
              <tr>
                <th className="text-left py-1.5 px-2 font-semibold" style={{ color: 'hsl(var(--navy))' }}>Escola</th>
                {SEGMENT_KEYS.map(s => (
                  <th key={s.key} className="text-center py-1.5 px-2 font-semibold" style={{ color: 'hsl(var(--navy))' }}>{s.label.replace('Ens. ', '')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapData.map((row, ri) => (
                <tr key={ri} className={row.isTarget ? 'font-semibold' : ''}>
                  <td className="py-1.5 px-2 truncate max-w-[140px]" style={row.isTarget ? { color: 'hsl(174, 62%, 35%)' } : {}}>
                    {row.name.length > 22 ? row.name.slice(0, 19) + '...' : row.name}
                  </td>
                  {row.segments.map(seg => {
                    const intensity = Math.min(seg.share / 30, 1); // normalize to ~30% max
                    const bgColor = row.isTarget
                      ? `hsl(174, 62%, ${90 - intensity * 55}%)`
                      : `hsl(220, 50%, ${92 - intensity * 52}%)`;
                    return (
                      <td key={seg.key} className="text-center py-1.5 px-2 rounded" style={{ background: bgColor }}>
                        {seg.share > 0 ? formatPercent(seg.share) : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Insights de Mercado */}
      <div className="insight-box text-xs sm:text-sm space-y-2">
        <h4 className="font-semibold">Insights de Mercado</h4>
        <p>O mercado na área de influência é <strong>{isConcentrated ? 'concentrado' : 'fragmentado'}</strong> — as 3 maiores escolas detêm <strong>{formatPercent(top3Share)}</strong> do alunado.</p>
        <p>O líder local é <strong>{leader.name}</strong> com <strong>{formatNumber(leader.total)}</strong> alunos ({formatPercent((leader.total / (universoTotal || 1)) * 100)} de participação).</p>
        <p>A intensidade competitiva é <strong>{concorrentes.length >= 10 ? 'alta' : concorrentes.length >= 5 ? 'moderada' : 'baixa'}</strong>, com {concorrentes.length} concorrentes elegíveis identificados.</p>
        {segmentRankings.length > 0 && (() => {
          const strongest = segmentos.reduce((a, b) => a.value > b.value ? a : b);
          const weakest = segmentos.filter(s => s.value > 0).reduce((a, b) => a.value < b.value ? a : b);
          return (
            <>
              <p>Segmento mais forte: <strong>{strongest.label}</strong> ({formatPercent(strongest.value)}). Segmento mais vulnerável: <strong>{weakest.label}</strong> ({formatPercent(weakest.value)}).</p>
            </>
          );
        })()}
      </div>
    </div>
  );
}
