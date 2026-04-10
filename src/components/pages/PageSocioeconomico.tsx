import { AnalysisResult } from '@/lib/types';
import { parseBrNumber, formatNumber } from '@/lib/analysis';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import IndicatorCard from '@/components/IndicatorCard';

interface Props {
  analysis: AnalysisResult;
}

export default function PageSocioeconomico({ analysis }: Props) {
  const { demografica, escola } = analysis;

  if (!demografica) {
    return (
      <div className="max-w-4xl mx-auto py-6 sm:py-8 px-3 sm:px-4 space-y-6">
        <h2 className="page-title text-xl sm:text-2xl">PERFIL SOCIOECONÔMICO DA REGIÃO</h2>
        <div className="badge-unavailable text-sm p-4">Sem dados</div>
      </div>
    );
  }

  const rendaMedia = parseBrNumber(demografica['Renda Média']);
  const idhEduc = demografica['IDH - Dimensão Educação Classificação'];
  const idhRenda = demografica['IDH - Dimensão Renda Classificação'];

  const faixas2025 = [
    { label: '0 a 4 anos', value: parseInt(demografica['População por Faixa Etária (2025) - 0 a 4 anos'] || '0') },
    { label: '5 a 9 anos', value: parseInt(demografica['População por Faixa Etária (2025) - 5 a 9 anos'] || '0') },
    { label: '10 a 14 anos', value: parseInt(demografica['População por Faixa Etária (2025) - 10 a 14 anos'] || '0') },
    { label: '15 a 19 anos', value: parseInt(demografica['População por Faixa Etária (2025) - 15 a 19 anos'] || '0') },
  ];

  const faixas2024 = [
    { label: '0 a 4 anos', value: parseInt(demografica['População por Faixa Etária (2024) - 0 a 4 anos'] || '0') },
    { label: '5 a 9 anos', value: parseInt(demografica['População por Faixa Etária (2024) - 5 a 9 anos'] || '0') },
    { label: '10 a 14 anos', value: parseInt(demografica['População por Faixa Etária (2024) - 10 a 14 anos'] || '0') },
    { label: '15 a 19 anos', value: parseInt(demografica['População por Faixa Etária (2024) - 15 a 19 anos'] || '0') },
  ];

  const somaTotal2025 = faixas2025.reduce((s, f) => s + f.value, 0);

  const chartData = faixas2025.map((f, i) => ({
    faixa: f.label,
    '2024': faixas2024[i].value,
    '2025': f.value,
  }));

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-3 sm:px-4 space-y-4 sm:space-y-6">
      <h2 className="page-title text-xl sm:text-2xl">PERFIL SOCIOECONÔMICO DA REGIÃO</h2>
      <p className="page-subtitle text-xs sm:text-sm">Dados demográficos do município de {escola.Município}/{escola.UF}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <IndicatorCard value={`R$ ${rendaMedia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} label="Renda Média" color="teal" />
        <IndicatorCard value={idhEduc || 'N/D'} label="IDH Educação" color="navy" />
        <IndicatorCard value={idhRenda || 'N/D'} label="IDH Renda" color="lime" />
        <IndicatorCard value={formatNumber(somaTotal2025)} label="Pop. 0-19 (2025)" color="teal" />
      </div>

      <div className="bg-card rounded-xl border overflow-hidden overflow-x-auto">
        <table className="table-executive min-w-[350px]">
          <thead>
            <tr>
              <th>Faixa Etária</th>
              <th>Pop. (2025)</th>
              <th>% do Total</th>
            </tr>
          </thead>
          <tbody>
            {faixas2025.map(f => (
              <tr key={f.label}>
                <td className="text-xs sm:text-sm">{f.label}</td>
                <td className="text-xs sm:text-sm">{formatNumber(f.value)}</td>
                <td className="text-xs sm:text-sm">{somaTotal2025 > 0 ? ((f.value / somaTotal2025) * 100).toFixed(1).replace('.', ',') + '%' : '0%'}</td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td>Total</td>
              <td>{formatNumber(somaTotal2025)}</td>
              <td>100%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-card rounded-xl border p-4 sm:p-5">
        <h3 className="font-semibold mb-2 text-xs sm:text-sm" style={{ color: 'hsl(var(--navy))' }}>Evolução da População em Idade Escolar (2024 vs 2025)</h3>
        <p className="text-[10px] sm:text-xs text-muted-foreground mb-3 sm:mb-4">Volume bruto de potenciais estudantes na região, sem considerar renda, concorrência ou acesso efetivo.</p>
        <div style={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="faixa" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={v => formatNumber(v)} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => formatNumber(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="2024" fill="hsl(220, 70%, 18%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="2025" fill="hsl(174, 62%, 35%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
