import { AnalysisResult } from '@/lib/types';
import { parseBrNumber, formatNumber } from '@/lib/analysis';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import IndicatorCard from '@/components/IndicatorCard';
import { useRendaFaixaEtaria } from '@/hooks/useRendaFaixaEtaria';
import {
  findRendaByIBGE, buildMatrix, getFaixasAderentes,
  calcAderenciaEconomica, classificarAderencia, FAIXAS_RENDA,
} from '@/lib/socioeconomico';

interface Props { analysis: AnalysisResult; }

export default function PageSocioeconomico({ analysis }: Props) {
  const { demografica, escola } = analysis;
  const { data: rendaData, loading } = useRendaFaixaEtaria();

  if (!demografica) {
    return (
      <div className="max-w-4xl mx-auto py-6 sm:py-8 px-3 sm:px-4 space-y-6">
        <h2 className="page-title text-xl sm:text-2xl">PERFIL SOCIOECONÔMICO DA REGIÃO</h2>
        <div className="badge-unavailable text-sm p-4">Dado não disponível na base fornecida.</div>
      </div>
    );
  }

  const rendaMedia = parseBrNumber(demografica['Renda Média']);
  const idhEduc = demografica['IDH - Dimensão Educação Classificação'];
  const idhRenda = demografica['IDH - Dimensão Renda Classificação'];

  const pop05_19 = (['0 a 4','5 a 9','10 a 14','15 a 19'] as const)
    .reduce((s, f) => s + (parseInt(demografica[`População por Faixa Etária (2025) - ${f} anos`] || '0')), 0);

  const faixas2025 = [
    { label: '0 a 4',   value: parseInt(demografica['População por Faixa Etária (2025) - 0 a 4 anos']   || '0') },
    { label: '5 a 9',   value: parseInt(demografica['População por Faixa Etária (2025) - 5 a 9 anos']   || '0') },
    { label: '10 a 14', value: parseInt(demografica['População por Faixa Etária (2025) - 10 a 14 anos'] || '0') },
    { label: '15 a 19', value: parseInt(demografica['População por Faixa Etária (2025) - 15 a 19 anos'] || '0') },
  ];

  // Renda × Faixa Etária do município
  const codMun = String(escola['Código Município']);
  const rendaRow = !loading ? findRendaByIBGE(rendaData, codMun) : null;
  const matrix = rendaRow ? buildMatrix(rendaRow) : null;
  const aderencia = matrix ? calcAderenciaEconomica(matrix, escola.Mensalidade) : 0;
  const aderenteCls = classificarAderencia(aderencia);
  const faixasAderentes = getFaixasAderentes(escola.Mensalidade);
  const aderentesSet = new Set(faixasAderentes);

  // Heatmap: intensidade por célula = pop / max
  const allValues = matrix ? matrix.flatMap(r => [r.ate4, r.de5a14, r.de15a19]) : [];
  const maxCell = allValues.length ? Math.max(...allValues) : 1;
  const cellBg = (v: number) => {
    const intensity = maxCell > 0 ? v / maxCell : 0;
    // teal scale
    return `hsl(174, 62%, ${95 - intensity * 50}%)`;
  };

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-8 px-3 sm:px-4 space-y-5 sm:space-y-7">
      <div>
        <h2 className="page-title text-xl sm:text-2xl">PERFIL SOCIOECONÔMICO DA REGIÃO</h2>
        <p className="page-subtitle text-xs sm:text-sm">
          Município de {escola.Município}/{escola.UF} · análise de aderência econômica ao ticket da escola
        </p>
      </div>

      {/* BLOCO 1 — KPIs */}
      <div>
        <h3 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-3" style={{ color: 'hsl(var(--navy))' }}>
          Indicadores principais <span className="text-muted-foreground font-normal">· município</span>
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
          <IndicatorCard value={`R$ ${rendaMedia.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} label="Renda Média" color="teal" />
          <IndicatorCard value={idhEduc || 'N/D'} label="IDH Educação" color="navy" />
          <IndicatorCard value={idhRenda || 'N/D'} label="IDH Renda" color="lime" />
          <IndicatorCard value={formatNumber(pop05_19)} label="Pop. 0–19 (2025)" color="teal" />
          <IndicatorCard
            value={matrix ? `${aderencia.toFixed(0)}%` : 'N/D'}
            label="Aderência ao ticket"
            color={aderenteCls.tone}
          />
        </div>
      </div>

      {/* BLOCO 2 — Distribuição etária */}
      <div className="bg-card rounded-xl border p-4 sm:p-5 space-y-3">
        <h3 className="font-semibold text-xs sm:text-sm" style={{ color: 'hsl(var(--navy))' }}>
          Distribuição etária <span className="text-muted-foreground font-normal">· município (2025)</span>
        </h3>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={faixas2025}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={v => formatNumber(v)} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => formatNumber(v)} />
              <Bar dataKey="value" fill="hsl(174, 62%, 35%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BLOCO 3 — Renda × Faixa Etária (heatmap) */}
      <div className="bg-card rounded-xl border p-4 sm:p-5 space-y-3">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <h3 className="font-semibold text-xs sm:text-sm" style={{ color: 'hsl(var(--navy))' }}>
            Renda × Faixa Etária <span className="text-muted-foreground font-normal">· município</span>
          </h3>
          {faixasAderentes.length > 0 && (
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Faixas aderentes ao ticket atual: <strong style={{ color: 'hsl(var(--teal))' }}>{faixasAderentes.join(', ')}</strong>
            </p>
          )}
        </div>

        {matrix ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] sm:text-xs border-collapse">
              <thead>
                <tr className="text-left">
                  <th className="px-2 py-1.5 font-semibold" style={{ color: 'hsl(var(--navy))' }}>Classe</th>
                  <th className="px-2 py-1.5 font-semibold text-right" style={{ color: 'hsl(var(--navy))' }}>0 a 4</th>
                  <th className="px-2 py-1.5 font-semibold text-right" style={{ color: 'hsl(var(--navy))' }}>5 a 14</th>
                  <th className="px-2 py-1.5 font-semibold text-right" style={{ color: 'hsl(var(--navy))' }}>15 a 19</th>
                  <th className="px-2 py-1.5 font-semibold text-right border-l" style={{ color: 'hsl(var(--navy))' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {matrix.map(r => {
                  const isAderente = aderentesSet.has(r.faixa);
                  return (
                    <tr key={r.faixa} className={isAderente ? 'font-semibold' : ''} style={isAderente ? { background: 'hsl(174, 62%, 96%)' } : undefined}>
                      <td className="px-2 py-1.5 border-r">
                        <span className="inline-flex items-center gap-1.5">
                          {isAderente && <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(var(--teal))' }} />}
                          {r.faixa}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-right" style={{ background: cellBg(r.ate4) }}>{formatNumber(Math.round(r.ate4))}</td>
                      <td className="px-2 py-1.5 text-right" style={{ background: cellBg(r.de5a14) }}>{formatNumber(Math.round(r.de5a14))}</td>
                      <td className="px-2 py-1.5 text-right" style={{ background: cellBg(r.de15a19) }}>{formatNumber(Math.round(r.de15a19))}</td>
                      <td className="px-2 py-1.5 text-right border-l">{formatNumber(Math.round(r.total))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-[10px] text-muted-foreground mt-2">
              Intensidade da cor indica concentração populacional. Linhas destacadas = faixas com maior poder de compra para o ticket da escola.
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{loading ? 'Carregando matriz de renda…' : 'Dado não disponível para este município.'}</p>
        )}
      </div>

      {/* BLOCO 4 — Leitura comercial */}
      {matrix && (
        <div className="bg-card rounded-xl border p-4 sm:p-5 space-y-2">
          <h3 className="font-semibold text-xs sm:text-sm" style={{ color: 'hsl(var(--navy))' }}>Leitura comercial</h3>
          <p className="text-[12px] sm:text-sm text-muted-foreground leading-relaxed">
            Considerando o ticket atual da escola{escola.Mensalidade && escola.Mensalidade !== '0' ? ` (${escola.Mensalidade})` : ''},
            o município apresenta <strong style={{ color: `hsl(var(--${aderenteCls.tone}))` }}>{aderenteCls.label.toLowerCase()}</strong> ({aderencia.toFixed(0)}% da população 0–19 está nas faixas aderentes).
            {aderencia >= 30 && ' Há base sólida de famílias com poder de compra alinhado — espaço para reforçar valor agregado e diferenciais pedagógicos.'}
            {aderencia >= 15 && aderencia < 30 && ' Existe um nicho relevante; convém comunicar custo-benefício e proposta de valor com clareza para reduzir sensibilidade a preço.'}
            {aderencia < 15 && ' A base aderente é limitada — atenção à elasticidade de preço e necessidade de comunicar fortemente o retorno do investimento educacional.'}
          </p>
          {faixasAderentes.length > 0 && (
            <p className="text-[11px] sm:text-xs text-muted-foreground">
              <strong>Oportunidade por segmento:</strong> a maior massa aderente em <em>5 a 14 anos</em> sugere foco em Ensino Fundamental;
              em <em>15 a 19</em>, oportunidade para Ensino Médio; em <em>0 a 4</em>, captação futura para Educação Infantil.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
