import { AnalysisResult } from '@/lib/types';
import { num, formatPercent, formatNumber, parseBrNumber } from '@/lib/analysis';
import { TrendingDown, TrendingUp, Users, Target, DollarSign, Lightbulb, AlertTriangle, Heart } from 'lucide-react';
import { useRendaFaixaEtaria } from '@/hooks/useRendaFaixaEtaria';
import { findRendaByIBGE, buildMatrix, calcAderenciaEconomica, classificarAderencia } from '@/lib/socioeconomico';

interface Props { analysis: AnalysisResult; }

type Tone = 'teal' | 'navy' | 'lime' | 'risk';
const toneStyle: Record<Tone, { bg: string; fg: string; label: string }> = {
  teal: { bg: 'hsl(174, 62%, 96%)', fg: 'hsl(var(--teal))',  label: 'OPORTUNIDADE' },
  navy: { bg: 'hsl(220, 70%, 96%)', fg: 'hsl(var(--navy))',  label: 'POSICIONAMENTO' },
  lime: { bg: 'hsl(75, 60%, 94%)',  fg: 'hsl(var(--navy))',  label: 'ADERÊNCIA' },
  risk: { bg: 'hsl(0, 84%, 96%)',   fg: 'hsl(0, 70%, 45%)',  label: 'RISCO' },
};

function InsightCard({
  tone, icon: Icon, title, dado, leitura, implicacao,
}: { tone: Tone; icon: any; title: string; dado: React.ReactNode; leitura: string; implicacao: string }) {
  const t = toneStyle[tone];
  return (
    <div className="rounded-xl border p-4 space-y-2.5" style={{ background: t.bg, borderColor: t.fg + '33' }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color: t.fg }} />
          <span className="font-semibold text-xs sm:text-sm" style={{ color: 'hsl(var(--navy))' }}>{title}</span>
        </div>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: t.fg, color: 'white' }}>{t.label}</span>
      </div>
      <div className="text-lg sm:text-xl font-bold" style={{ color: t.fg }}>{dado}</div>
      <p className="text-[11px] sm:text-xs leading-relaxed" style={{ color: 'hsl(var(--navy))' }}>
        <strong>Leitura:</strong> {leitura}
      </p>
      <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
        <strong>Implicação:</strong> {implicacao}
      </p>
    </div>
  );
}

export default function PageInsights({ analysis }: Props) {
  const { escola, concorrentes, marketShare, demografica, raioOperacional } = analysis;
  const { data: rendaData } = useRendaFaixaEtaria();

  const escolaTotal = num(escola['Alunado Total']);
  const concTotal = concorrentes.reduce((s, c) => s + num(c.escola['Alunado Total']), 0);
  const universo = escolaTotal + concTotal;
  const adotamBrasil = concorrentes.filter(c => c.escola['Adota Brasil']?.toLowerCase() === 'sim').length;

  const rendaMedia = demografica ? parseBrNumber(demografica['Renda Média']) : 0;
  const pop2025_0_4 = demografica ? parseInt(demografica['População por Faixa Etária (2025) - 0 a 4 anos'] || '0') : 0;
  const pop2024_0_4 = demografica ? parseInt(demografica['População por Faixa Etária (2024) - 0 a 4 anos'] || '0') : 0;
  const popGrowth = pop2024_0_4 > 0 ? ((pop2025_0_4 - pop2024_0_4) / pop2024_0_4 * 100) : 0;

  // Aderência econômica
  const rendaRow = findRendaByIBGE(rendaData, String(escola['Código Município']));
  const matrix = rendaRow ? buildMatrix(rendaRow) : null;
  const aderencia = matrix ? calcAderenciaEconomica(matrix, escola.Mensalidade) : 0;
  const aderenteCls = classificarAderencia(aderencia);

  // Segmento líder e mais vulnerável
  const segShares = [
    { label: 'Educação Infantil', key: 'ei', value: marketShare.ei },
    { label: 'Ens. Fund. Anos Iniciais', key: 'efi', value: marketShare.efi },
    { label: 'Ens. Fund. Anos Finais', key: 'efii', value: marketShare.efii },
    { label: 'Ensino Médio', key: 'em', value: marketShare.em },
  ].filter(s => s.value > 0);
  const sortedSeg = [...segShares].sort((a, b) => b.value - a.value);
  const bestSeg = sortedSeg[0];
  const weakSeg = sortedSeg.length > 1 ? sortedSeg[sortedSeg.length - 1] : null;

  const isLeader = marketShare.geral >= 20;
  const isFragmented = marketShare.geral < 10 && concorrentes.length >= 10;
  const highCompetition = concorrentes.length >= 10;

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-8 px-3 sm:px-4 space-y-5 sm:space-y-7">
      <div>
        <h2 className="page-title text-xl sm:text-2xl">INSIGHTS ESTRATÉGICOS</h2>
        <p className="page-subtitle text-xs sm:text-sm">
          Diagnóstico estruturado: dado observado · leitura · implicação comercial
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">

        {demografica && (
          <InsightCard
            tone={popGrowth >= 0 ? 'teal' : 'risk'}
            icon={popGrowth >= 0 ? TrendingUp : TrendingDown}
            title="Tendência Demográfica"
            dado={<>{popGrowth >= 0 ? '+' : ''}{popGrowth.toFixed(1).replace('.', ',')}% <span className="text-xs font-normal text-muted-foreground">na faixa 0–4 (2024→2025)</span></>}
            leitura={popGrowth >= 0
              ? 'A base infantil do município cresce, sustentando a demanda futura por Educação Infantil e séries iniciais.'
              : 'A faixa 0–4 está em retração — a captação de EI tende a ficar mais disputada nos próximos ciclos.'}
            implicacao={popGrowth >= 0
              ? 'Reforçar comunicação de Educação Infantil agora protege o pipeline dos próximos anos.'
              : 'Antecipar ações de retenção e diversificar oferta para reduzir dependência da EI.'}
          />
        )}

        <InsightCard
          tone={highCompetition ? 'risk' : 'navy'}
          icon={Users}
          title="Pressão Competitiva"
          dado={<>{concorrentes.length} <span className="text-xs font-normal text-muted-foreground">concorrentes · {formatNumber(universo)} alunos no universo</span></>}
          leitura={isFragmented
            ? 'Mercado fragmentado: nenhum player domina, e a diferenciação se torna o principal driver de escolha.'
            : isLeader
              ? 'Posição relevante na região — barreira natural à entrada de novos concorrentes.'
              : 'Concorrência presente, mas há espaço claro para ganho de share via posicionamento.'}
          implicacao={adotamBrasil > 0
            ? `${adotamBrasil} concorrente(s) já adota(m) a Editora do Brasil — a parceria fortalece o ecossistema regional.`
            : 'Nenhum concorrente adota Editora do Brasil — diferencial competitivo disponível para a escola.'}
        />

        <InsightCard
          tone="navy"
          icon={Target}
          title="Posicionamento"
          dado={<>{formatPercent(marketShare.geral)} <span className="text-xs font-normal text-muted-foreground">share geral · raio {raioOperacional} km</span></>}
          leitura={bestSeg
            ? `Maior penetração em ${bestSeg.label} (${formatPercent(bestSeg.value)}) — segmento que sustenta a marca da escola na região.`
            : 'Sem segmento com share dominante claro.'}
          implicacao={isLeader
            ? 'Capitalizar a liderança em comunicação ("escola mais escolhida" no segmento forte).'
            : 'Concentrar esforços comerciais no segmento de maior share antes de expandir frentes.'}
        />

        {matrix && (
          <InsightCard
            tone="lime"
            icon={DollarSign}
            title="Aderência Econômica"
            dado={<>{aderencia.toFixed(0)}% <span className="text-xs font-normal text-muted-foreground">da pop. 0–19 nas faixas aderentes</span></>}
            leitura={`${aderenteCls.label} ao ticket atual${rendaMedia ? ` — renda média municipal R$ ${rendaMedia.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}.` : '.'}`}
            implicacao={aderencia >= 30
              ? 'Base sólida para sustentar preço — comunicar valor e diferenciais pedagógicos sem recorrer a desconto.'
              : aderencia >= 15
                ? 'Há nicho relevante; reforçar custo-benefício e parcelamento para reduzir sensibilidade a preço.'
                : 'Atenção à elasticidade — calibrar discurso comercial e considerar política de bolsas/escalonamento.'}
          />
        )}

        <InsightCard
          tone="teal"
          icon={Lightbulb}
          title="Oportunidade Comercial"
          dado={<>{bestSeg ? bestSeg.label : 'Captação ampla'}</>}
          leitura={`A vitrine forte em ${bestSeg?.label || 'segmento principal'} é porta de entrada natural — famílias entram aqui e migram entre segmentos da própria escola.`}
          implicacao="Estruturar funil de captação dedicado ao segmento líder (cadastros → agendas → visitas → matrículas) com meta clara e CPA monitorado."
        />

        <InsightCard
          tone="risk"
          icon={AlertTriangle}
          title="Risco de Captação"
          dado={<>{popGrowth < 0 || isFragmented || aderencia < 15 ? 'Atenção' : 'Controlado'}</>}
          leitura={[
            popGrowth < 0 ? 'queda demográfica na base 0–4' : null,
            isFragmented ? 'mercado pulverizado dilui share' : null,
            aderencia < 15 ? 'baixa aderência ao ticket' : null,
            highCompetition ? `${concorrentes.length} concorrentes ativos no raio` : null,
          ].filter(Boolean).join(' · ') || 'Sem fatores de risco relevantes identificados na área de influência.'}
          implicacao="Definir meta agressiva (mas factível) e ampliar volume de interessados — captação eficiente exige funil mais largo no topo."
        />

        {weakSeg && (
          <InsightCard
            tone="navy"
            icon={Heart}
            title="Oportunidade de Retenção"
            dado={<>{weakSeg.label} <span className="text-xs font-normal text-muted-foreground">share {formatPercent(weakSeg.value)}</span></>}
            leitura={`Segmento mais vulnerável da escola — risco de evasão natural (~12%) e dificuldade de reposição quando o share está baixo.`}
            implicacao="Programa estruturado de rematrícula antecipada e jornada da família reduzem a perda. Lembre-se: cada aluno retido vale por 8–12 anos de ciclo."
          />
        )}
      </div>
    </div>
  );
}
