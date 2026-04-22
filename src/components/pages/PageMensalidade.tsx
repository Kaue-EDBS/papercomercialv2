import { AnalysisResult } from '@/lib/types';
import { num, getMensalidadeFaixa } from '@/lib/analysis';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  analysis: AnalysisResult;
}

const FAIXAS_LABELS: Record<string, string> = {
  '0': 'Sem dados',
  'até 399': 'Até R$ 399',
  '400 a 799': 'R$ 400 a R$ 799',
  '800 a 1.399': 'R$ 800 a R$ 1.399',
  '1.400 a 2.399': 'R$ 1.400 a R$ 2.399',
  'acima de R$ 2.400': 'Acima de R$ 2.400',
};

const FAIXAS_ORDER = ['até 399', '400 a 799', '800 a 1.399', '1.400 a 2.399', 'acima de R$ 2.400'];

export default function PageMensalidade({ analysis }: Props) {
  const { escola, concorrentes } = analysis;

  const escolaFaixa = escola.Mensalidade;
  const escolaFaixaIdx = getMensalidadeFaixa(escolaFaixa);

  const concFaixas = concorrentes.map(c => ({
    nome: c.escola.Escola,
    faixa: c.escola.Mensalidade,
    idx: getMensalidadeFaixa(c.escola.Mensalidade),
  }));

  const validConc = concFaixas.filter(c => c.idx > 0);
  const mesmaFaixa = validConc.filter(c => c.idx === escolaFaixaIdx);
  const acima = validConc.filter(c => c.idx > escolaFaixaIdx);
  const abaixo = validConc.filter(c => c.idx < escolaFaixaIdx);

  // Modal (most frequent) faixa among competitors
  const faixaCount: Record<string, number> = {};
  validConc.forEach(c => { faixaCount[c.faixa] = (faixaCount[c.faixa] || 0) + 1; });
  const faixaModal = Object.entries(faixaCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/D';

  // Distribution chart data
  const allSchools = [
    { faixa: escolaFaixa, isTarget: true },
    ...concorrentes.map(c => ({ faixa: c.escola.Mensalidade, isTarget: false })),
  ];
  const distData = FAIXAS_ORDER.map(f => {
    const schools = allSchools.filter(s => s.faixa === f);
    return {
      faixa: FAIXAS_LABELS[f] || f,
      total: schools.length,
      hasTarget: schools.some(s => s.isTarget),
    };
  }).filter(d => d.total > 0);

  // Grouped by faixa for visual blocks
  const faixaGroups = FAIXAS_ORDER.map(f => {
    const items = [
      ...(escolaFaixa === f ? [{ nome: escola.Escola, isTarget: true }] : []),
      ...concorrentes.filter(c => c.escola.Mensalidade === f).map(c => ({ nome: c.escola.Escola, isTarget: false })),
    ];
    return { faixa: f, label: FAIXAS_LABELS[f] || f, items };
  }).filter(g => g.items.length > 0);

  const rendaMedia = demografica ? demografica['Renda Média'] : null;
  const idhRenda = demografica ? demografica['IDH - Dimensão Renda Classificação'] : null;

  const escolaFaixaLabel = escolaFaixaIdx <= 0 ? 'Sem dados' : (FAIXAS_LABELS[escolaFaixa] || escolaFaixa);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-card border rounded-lg p-2.5 shadow-lg text-xs">
        <p className="font-semibold mb-1" style={{ color: 'hsl(var(--navy))' }}>{d.faixa}</p>
        <p>Escolas: <strong>{d.total}</strong></p>
        {d.hasTarget && <p className="mt-1" style={{ color: 'hsl(var(--teal))' }}>✦ Inclui a escola analisada</p>}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-8 px-3 sm:px-4 space-y-4 sm:space-y-6">
      <h2 className="page-title text-xl sm:text-2xl">FAIXA DE MENSALIDADE</h2>
      <p className="page-subtitle text-xs sm:text-sm">Posicionamento de mensalidade da escola dentro do grupo competitivo</p>

      {/* 1.1 Cards-resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
        <div className="card-indicator col-span-2 sm:col-span-1">
          <div className="card-indicator-value text-sm sm:text-base" style={{ color: 'hsl(var(--teal))' }}>{escolaFaixaLabel}</div>
          <div className="card-indicator-label text-[10px] sm:text-xs">Faixa da Escola</div>
        </div>
        <div className="card-indicator">
          <div className="card-indicator-value text-sm sm:text-base" style={{ color: 'hsl(var(--navy))' }}>{FAIXAS_LABELS[faixaModal] || faixaModal}</div>
          <div className="card-indicator-label text-[10px] sm:text-xs">Faixa Modal Concorrentes</div>
        </div>
        <div className="card-indicator">
          <div className="card-indicator-value text-lg sm:text-xl" style={{ color: 'hsl(var(--teal))' }}>{mesmaFaixa.length}</div>
          <div className="card-indicator-label text-[10px] sm:text-xs">Mesma Faixa</div>
        </div>
        <div className="card-indicator">
          <div className="card-indicator-value text-lg sm:text-xl" style={{ color: 'hsl(var(--navy))' }}>{acima.length}</div>
          <div className="card-indicator-label text-[10px] sm:text-xs">Acima</div>
        </div>
        <div className="card-indicator">
          <div className="card-indicator-value text-lg sm:text-xl" style={{ color: 'hsl(var(--lime))' }}>{abaixo.length}</div>
          <div className="card-indicator-label text-[10px] sm:text-xs">Abaixo</div>
        </div>
      </div>

      {/* 1.2 Distribuição por Faixa — Gráfico de barras */}
      <div className="bg-card rounded-xl border p-4 sm:p-5">
        <h3 className="font-semibold mb-3 sm:mb-4 text-xs sm:text-sm" style={{ color: 'hsl(var(--navy))' }}>Distribuição de Escolas por Faixa de Mensalidade</h3>
        <div style={{ height: Math.max(200, distData.length * 48) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distData} layout="vertical" margin={{ left: 10, right: 40 }}>
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="faixa" width={120} tick={{ fontSize: 9 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 10, fill: 'hsl(220, 70%, 18%)' }}>
                {distData.map((entry, i) => (
                  <Cell key={i} fill={entry.hasTarget ? 'hsl(174, 62%, 35%)' : 'hsl(220, 50%, 30%)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-3 text-[10px] sm:text-xs">
          <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded" style={{ background: 'hsl(174, 62%, 35%)' }} /> Faixa da escola analisada</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded" style={{ background: 'hsl(220, 50%, 30%)' }} /> Demais faixas</span>
        </div>
      </div>

      {/* 1.3 Blocos por faixa competitiva */}
      <div className="bg-card rounded-xl border p-4 sm:p-5">
        <h3 className="font-semibold mb-3 sm:mb-4 text-xs sm:text-sm" style={{ color: 'hsl(var(--navy))' }}>Escolas por Faixa Competitiva</h3>
        <div className="space-y-3">
          {faixaGroups.map(g => {
            const isTargetFaixa = escolaFaixa === g.faixa;
            return (
              <div key={g.faixa} className="rounded-lg border p-3" style={isTargetFaixa ? { borderColor: 'hsl(174, 62%, 35%)', background: 'hsl(174, 62%, 35%, 0.06)' } : {}}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold" style={{ color: isTargetFaixa ? 'hsl(174, 62%, 35%)' : 'hsl(var(--navy))' }}>{g.label}</span>
                  <span className="text-[10px] text-muted-foreground">({g.items.length} escola{g.items.length > 1 ? 's' : ''})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {g.items.map((item, i) => (
                    <span
                      key={i}
                      className="inline-block px-2 py-1 rounded-md text-[10px] sm:text-xs font-medium truncate max-w-[200px]"
                      style={item.isTarget
                        ? { background: 'hsl(174, 62%, 35%)', color: 'white' }
                        : { background: 'hsl(220, 50%, 30%, 0.1)', color: 'hsl(220, 50%, 30%)' }
                      }
                      title={item.nome}
                    >
                      {item.nome}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leitura competitiva — síntese da posição da escola no grupo concorrencial */}
      <div className="bg-card rounded-xl border p-4 sm:p-6 space-y-3">
        <h3 className="font-semibold text-xs sm:text-sm" style={{ color: 'hsl(var(--navy))' }}>
          Leitura competitiva da mensalidade
        </h3>
        <p className="text-[10px] sm:text-xs text-muted-foreground italic">
          Posição da escola dentro do grupo concorrencial selecionado na Etapa 2.
        </p>
        {escolaFaixaIdx > 0 ? (
          <div className="insight-box text-xs sm:text-sm">
            <p>
              A escola opera na faixa <strong>{escolaFaixaLabel}</strong>.
              {' '}Há <strong>{mesmaFaixa.length}</strong> concorrente{mesmaFaixa.length !== 1 ? 's' : ''} na mesma faixa,
              {' '}<strong>{acima.length}</strong> em faixa{acima.length !== 1 ? 's' : ''} superior{acima.length !== 1 ? 'es' : ''} e
              {' '}<strong>{abaixo.length}</strong> em faixa{abaixo.length !== 1 ? 's' : ''} inferior{abaixo.length !== 1 ? 'es' : ''}.
              {' '}A faixa modal do grupo concorrencial é <strong>{FAIXAS_LABELS[faixaModal] || faixaModal}</strong>
              {faixaModal && getMensalidadeFaixa(faixaModal) === escolaFaixaIdx
                ? ', alinhada à da escola — posicionamento competitivo coerente.'
                : faixaModal && getMensalidadeFaixa(faixaModal) > escolaFaixaIdx
                  ? ', acima da escola — espaço para reposicionamento de valor.'
                  : ', abaixo da escola — oportunidade para sustentar premium pedagógico.'}
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Mensalidade da escola não informada — leitura competitiva indisponível.</p>
        )}
      </div>
    </div>
  );
}
