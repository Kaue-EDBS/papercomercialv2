import { AnalysisResult } from '@/lib/types';
import { num, formatPercent, formatNumber, parseBrNumber } from '@/lib/analysis';
import { TrendingDown, TrendingUp, Users, Target, DollarSign, Lightbulb } from 'lucide-react';

interface Props {
  analysis: AnalysisResult;
}

export default function PageInsights({ analysis }: Props) {
  const { escola, concorrentes, marketShare, demografica, raioOperacional } = analysis;
  const escolaTotal = num(escola['Alunado Total']);
  const concTotal = concorrentes.reduce((s, c) => s + num(c.escola['Alunado Total']), 0);
  const universo = escolaTotal + concTotal;
  const isLeader = marketShare.geral >= 20;
  const isFragmented = marketShare.geral < 10 && concorrentes.length >= 10;

  const rendaMedia = demografica ? parseBrNumber(demografica['Renda Média']) : 0;

  const pop2025_0_4 = demografica ? parseInt(demografica['População por Faixa Etária (2025) - 0 a 4 anos'] || '0') : 0;
  const pop2024_0_4 = demografica ? parseInt(demografica['População por Faixa Etária (2024) - 0 a 4 anos'] || '0') : 0;
  const popGrowth = pop2024_0_4 > 0 ? ((pop2025_0_4 - pop2024_0_4) / pop2024_0_4 * 100) : 0;

  const adotamBrasil = concorrentes.filter(c => c.escola['Adota Brasil']?.toLowerCase() === 'sim').length;

  // Find best segment
  const segShares = [
    { label: 'Educação Infantil', value: marketShare.ei },
    { label: 'Ens. Fund. AI', value: marketShare.efi },
    { label: 'Ens. Fund. AF', value: marketShare.efii },
    { label: 'Ensino Médio', value: marketShare.em },
  ].filter(s => s.value > 0).sort((a, b) => b.value - a.value);
  const bestSeg = segShares[0];

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-3 sm:px-4 space-y-5 sm:space-y-7">
      <div>
        <h2 className="page-title text-xl sm:text-2xl">INSIGHTS E RECOMENDAÇÕES</h2>
        <p className="page-subtitle text-xs sm:text-sm">Análise estratégica baseada nos dados da área de influência e do município</p>
      </div>

      {/* ─── INSIGHTS ─── */}
      <div>
        <h3 className="font-bold text-sm sm:text-base mb-3 sm:mb-4" style={{ color: 'hsl(var(--navy))' }}>Insights Estratégicos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          {/* Tendência Demográfica */}
          {demografica && (
            <div className="bg-card rounded-xl border p-4 space-y-2">
              <div className="flex items-center gap-2">
                {popGrowth >= 0
                  ? <TrendingUp className="w-4 h-4" style={{ color: 'hsl(var(--teal))' }} />
                  : <TrendingDown className="w-4 h-4 text-destructive" />}
                <span className="font-semibold text-xs sm:text-sm" style={{ color: 'hsl(var(--navy))' }}>Tendência Demográfica</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold" style={{ color: popGrowth >= 0 ? 'hsl(var(--teal))' : 'hsl(0, 84%, 60%)' }}>
                {popGrowth >= 0 ? '+' : ''}{popGrowth.toFixed(1).replace('.', ',')}%
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                {popGrowth < 0
                  ? 'Redução na faixa 0-4 anos (2024→2025). Possível queda na demanda futura por EI.'
                  : 'Crescimento na faixa 0-4 anos (2024→2025). Potencial de demanda crescente para EI.'}
              </p>
            </div>
          )}

          {/* Pressão Competitiva */}
          <div className="bg-card rounded-xl border p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: 'hsl(var(--navy))' }} />
              <span className="font-semibold text-xs sm:text-sm" style={{ color: 'hsl(var(--navy))' }}>Pressão Competitiva</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold" style={{ color: 'hsl(var(--navy))' }}>
              {concorrentes.length} <span className="text-sm font-normal text-muted-foreground">concorrentes</span>
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
              {formatNumber(universo)} alunos no universo elegível. {isFragmented ? 'Mercado fragmentado — diferenciação é essencial.' : isLeader ? 'Posição de destaque no mercado local.' : 'Há espaço para ganho de participação.'}
              {adotamBrasil > 0 && ` ${adotamBrasil} concorrente(s) já adota(m) a Editora do Brasil.`}
            </p>
          </div>

          {/* Posicionamento */}
          <div className="bg-card rounded-xl border p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" style={{ color: 'hsl(var(--teal))' }} />
              <span className="font-semibold text-xs sm:text-sm" style={{ color: 'hsl(var(--navy))' }}>Posicionamento da Escola</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold" style={{ color: 'hsl(var(--teal))' }}>
              {formatPercent(marketShare.geral)}
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
              Market share geral. {bestSeg ? `Maior penetração em ${bestSeg.label} (${formatPercent(bestSeg.value)}).` : ''} Raio operacional de {raioOperacional} km.
            </p>
          </div>

          {/* Aderência Econômica */}
          {rendaMedia > 0 && (
            <div className="bg-card rounded-xl border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" style={{ color: 'hsl(var(--lime))' }} />
                <span className="font-semibold text-xs sm:text-sm" style={{ color: 'hsl(var(--navy))' }}>Aderência Econômica</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold" style={{ color: 'hsl(var(--navy))' }}>
                R$ {rendaMedia.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                Renda média municipal. {rendaMedia > 5000 ? 'Perfil favorece propostas de maior valor agregado.' : rendaMedia > 3000 ? 'Espaço para comunicação de custo-benefício.' : 'Fator preço é determinante na decisão.'}
              </p>
            </div>
          )}

          {/* Oportunidade Comercial */}
          <div className="bg-card rounded-xl border p-4 space-y-2 sm:col-span-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" style={{ color: 'hsl(var(--lime))' }} />
              <span className="font-semibold text-xs sm:text-sm" style={{ color: 'hsl(var(--navy))' }}>Oportunidade Comercial</span>
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
              {escola.Mensalidade && escola.Mensalidade !== '0'
                ? `A faixa de mensalidade (R$ ${escola.Mensalidade}) deve ser comunicada junto aos diferenciais pedagógicos para reforçar percepção de valor.`
                : 'A comunicação de valor deve focar nos diferenciais pedagógicos e resultados comprovados.'}
              {' '}{marketShare.geral < 15 ? 'Com share abaixo de 15%, há potencial relevante de captação.' : 'A posição consolidada permite foco em retenção e upsell.'}
            </p>
          </div>
        </div>
      </div>

      {/* ─── RECOMENDAÇÕES ─── */}
      <div>
        <h3 className="font-bold text-sm sm:text-base mb-3 sm:mb-4" style={{ color: 'hsl(var(--navy))' }}>Recomendações Estratégicas</h3>
        <div className="space-y-3">

          <div className="bg-card rounded-xl border p-4">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'hsl(var(--teal))' }}>1</span>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-xs sm:text-sm" style={{ color: 'hsl(var(--navy))' }}>Diferenciação Pedagógica</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ background: 'hsl(var(--teal))' }}>ALTA PRIORIDADE</span>
                </div>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                  <strong>Ação:</strong> Reforçar diferenciais de material didático e proposta pedagógica frente aos {concorrentes.length} concorrentes diretos.
                </p>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                  <strong>Objetivo:</strong> Aumentar percepção de valor e justificar posicionamento de preço.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border p-4">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'hsl(var(--teal))' }}>2</span>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-xs sm:text-sm" style={{ color: 'hsl(var(--navy))' }}>Foco no Segmento de Maior Share</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ background: 'hsl(var(--navy))' }}>ESTRATÉGICA</span>
                </div>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                  <strong>Ação:</strong> {bestSeg ? `Concentrar esforços em ${bestSeg.label}, onde a escola detém ${formatPercent(bestSeg.value)} de share.` : 'Identificar o segmento de maior potencial e concentrar esforços de captação.'}
                </p>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                  <strong>Objetivo:</strong> Consolidar liderança no segmento mais forte e expandir base de alunos.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border p-4">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'hsl(var(--lime))', color: 'hsl(var(--navy))' }}>3</span>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-xs sm:text-sm" style={{ color: 'hsl(var(--navy))' }}>Comunicação de Valor</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: 'hsl(var(--lime))', color: 'hsl(var(--navy))' }}>TÁTICA</span>
                </div>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                  <strong>Ação:</strong> {rendaMedia > 5000 ? 'Posicionar qualidade e resultados como principal argumento comercial.' : 'Enfatizar custo-benefício e retorno sobre investimento educacional.'}
                </p>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                  <strong>Objetivo:</strong> Alinhar discurso comercial ao perfil socioeconômico do município{rendaMedia > 0 ? ` (renda média R$ ${rendaMedia.toLocaleString('pt-BR', { maximumFractionDigits: 0 })})` : ''}.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border p-4">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2" style={{ borderColor: 'hsl(var(--navy))', color: 'hsl(var(--navy))' }}>4</span>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-xs sm:text-sm" style={{ color: 'hsl(var(--navy))' }}>Monitoramento Competitivo</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold border" style={{ borderColor: 'hsl(var(--navy))', color: 'hsl(var(--navy))' }}>CONTÍNUA</span>
                </div>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                  <strong>Ação:</strong> Acompanhar periodicamente movimentos de preço, segmento e posicionamento dos principais concorrentes na área de influência.
                </p>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                  <strong>Objetivo:</strong> Antecipar ameaças e identificar oportunidades de captação antes da concorrência.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
