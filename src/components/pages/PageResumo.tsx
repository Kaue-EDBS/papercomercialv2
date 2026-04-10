import { AnalysisResult } from '@/lib/types';
import { formatPercent, formatNumber, num } from '@/lib/analysis';
import IndicatorCard from '@/components/IndicatorCard';

interface Props {
  analysis: AnalysisResult;
}

export default function PageResumo({ analysis }: Props) {
  const { escola, concorrentes, raioOperacional, marketShare, escolasMunicipio } = analysis;
  const totalAlunos = concorrentes.reduce((s, c) => s + parseInt(String(c.escola['Alunado Total']) || '0', 10), 0) + parseInt(String(escola['Alunado Total']) || '0', 10);

  const resumo = `A escola ${escola.Escola}, localizada em ${escola.Município}/${escola.UF}, opera em uma área de influência com ${concorrentes.length + 1} escolas elegíveis e um total de ${totalAlunos.toLocaleString('pt-BR')} alunos. O raio operacional definido é de ${raioOperacional} km, com market share geral de ${formatPercent(marketShare.geral)}.`;

  const mensalidadeLabel = escola.Mensalidade === '0' ? 'Sem dados' : `R$ ${escola.Mensalidade}`;

  const totalEscolasMunicipio = escolasMunicipio.length;
  const totalAlunadoMunicipio = escolasMunicipio.reduce((s, e) => s + num(e['Alunado Total']), 0);

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-3 sm:px-4 space-y-4 sm:space-y-6">
      <h2 className="page-title text-xl sm:text-2xl">RESUMO EXECUTIVO</h2>
      <p className="page-subtitle text-xs sm:text-sm">Visão geral do cenário escolar na área de influência</p>

      <div className="bg-card rounded-xl border p-4 sm:p-6 text-xs sm:text-sm leading-relaxed">
        {resumo}
      </div>

      <div>
        <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3" style={{ color: 'hsl(var(--navy))' }}>Cenário Educacional do Município</h3>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <IndicatorCard value={formatNumber(totalEscolasMunicipio)} label="Total de Escolas no Município" color="navy" />
          <IndicatorCard value={formatNumber(totalAlunadoMunicipio)} label="Total de Alunos no Município" color="navy" />
        </div>
      </div>

      <div>
        <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3" style={{ color: 'hsl(var(--navy))' }}>Indicadores da Escola Analisada</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <IndicatorCard value={`${raioOperacional} km`} label="Raio Operacional" color="teal" />
          <IndicatorCard value={formatPercent(marketShare.geral)} label="Market Share" color="lime" />
          <IndicatorCard value={mensalidadeLabel} label="Faixa de Mensalidade" color="navy" />
        </div>
      </div>

      <div className="text-[10px] sm:text-xs text-muted-foreground bg-card rounded-xl border p-3 sm:p-4 italic">
        Esta análise considera as escolas privadas que estão na mesma região da escola avaliada. Para isso, usamos a quantidade de escolas no município, a localização pelo início do CEP, a faixa de mensalidade e os segmentos de ensino em comum. Com esses critérios, selecionamos os 15 principais concorrentes para comparar mercado, participação e posicionamento da escola.
      </div>
    </div>
  );
}
