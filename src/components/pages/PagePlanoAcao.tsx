import { AnalysisResult } from '@/lib/types';
import { num, formatPercent, parseBrNumber } from '@/lib/analysis';
import { useRendaFaixaEtaria } from '@/hooks/useRendaFaixaEtaria';
import { findRendaByIBGE, buildMatrix, calcAderenciaEconomica } from '@/lib/socioeconomico';
import { Megaphone, Target, Users, BarChart3, Heart, Search } from 'lucide-react';

interface Props { analysis: AnalysisResult; }

type Horizonte = 'Curto Prazo' | 'Próximo Ciclo Comercial' | 'Contínua';
type Prioridade = 'Crítica' | 'Alta' | 'Média';

interface Acao {
  prioridade: Prioridade;
  horizonte: Horizonte;
  titulo: string;
  oQueFazer: string;
  porQue: string;
  base: string;
  icon: any;
}

const horizColor: Record<Horizonte, string> = {
  'Curto Prazo':              'hsl(0, 70%, 45%)',
  'Próximo Ciclo Comercial':  'hsl(var(--teal))',
  'Contínua':                 'hsl(var(--navy))',
};
const prioBg: Record<Prioridade, string> = {
  'Crítica': 'hsl(0, 70%, 45%)',
  'Alta':    'hsl(var(--teal))',
  'Média':   'hsl(var(--lime))',
};
const prioFg: Record<Prioridade, string> = {
  'Crítica': 'white',
  'Alta':    'white',
  'Média':   'hsl(var(--navy))',
};

export default function PagePlanoAcao({ analysis }: Props) {
  const { escola, concorrentes, marketShare, demografica } = analysis;
  const { data: rendaData } = useRendaFaixaEtaria();

  const rendaMedia = demografica ? parseBrNumber(demografica['Renda Média']) : 0;
  const pop2025_0_4 = demografica ? parseInt(demografica['População por Faixa Etária (2025) - 0 a 4 anos'] || '0') : 0;
  const pop2024_0_4 = demografica ? parseInt(demografica['População por Faixa Etária (2024) - 0 a 4 anos'] || '0') : 0;
  const popGrowth = pop2024_0_4 > 0 ? ((pop2025_0_4 - pop2024_0_4) / pop2024_0_4 * 100) : 0;

  const rendaRow = findRendaByIBGE(rendaData, String(escola['Código Município']));
  const matrix = rendaRow ? buildMatrix(rendaRow) : null;
  const aderencia = matrix ? calcAderenciaEconomica(matrix, escola.Mensalidade) : 0;

  const segShares = [
    { label: 'Educação Infantil', value: marketShare.ei },
    { label: 'Ens. Fund. Anos Iniciais', value: marketShare.efi },
    { label: 'Ens. Fund. Anos Finais', value: marketShare.efii },
    { label: 'Ensino Médio', value: marketShare.em },
  ].filter(s => s.value > 0).sort((a, b) => b.value - a.value);
  const bestSeg = segShares[0];
  const weakSeg = segShares.length > 1 ? segShares[segShares.length - 1] : null;

  const isFragmented = marketShare.geral < 10 && concorrentes.length >= 10;
  const adotamBrasil = concorrentes.filter(c => c.escola['Adota Brasil']?.toLowerCase() === 'sim').length;

  const acoes: Acao[] = [];

  // 1. Comunicação de valor (sempre)
  acoes.push({
    prioridade: aderencia < 15 ? 'Crítica' : 'Alta',
    horizonte: 'Curto Prazo',
    titulo: 'Reforçar comunicação de valor e diferenciais pedagógicos',
    oQueFazer: `Estruturar mensagens claras sobre o que a escola entrega de diferente${bestSeg ? ` no segmento de ${bestSeg.label}` : ''} — proposta pedagógica, resultados, formação de professores e tecnologia educacional.`,
    porQue: aderencia < 15
      ? `Baixa aderência econômica (${aderencia.toFixed(0)}%) torna preço o principal critério se a proposta de valor não estiver evidente.`
      : 'A "Era de vender" deu lugar à "Era de ajudar a comprar" — a família precisa enxergar valor antes do preço.',
    base: `Aderência ${aderencia.toFixed(0)}% · renda média R$ ${rendaMedia.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
    icon: Megaphone,
  });

  // 2. Foco no segmento líder
  if (bestSeg) {
    acoes.push({
      prioridade: 'Alta',
      horizonte: 'Próximo Ciclo Comercial',
      titulo: `Concentrar captação no segmento de maior share: ${bestSeg.label}`,
      oQueFazer: `Definir meta numérica de matrículas para ${bestSeg.label}, dimensionar o funil necessário (cadastros → agendas → visitas → matrículas) e calcular o CPA-alvo.`,
      porQue: 'Meta sem volume de interessados é só desejo. Captação eficiente exige planejamento de funil — escolas que traçam metas agressivas crescem mais.',
      base: `Share atual em ${bestSeg.label}: ${formatPercent(bestSeg.value)}`,
      icon: Target,
    });
  }

  // 3. Retenção / rematrícula (se há segmento fraco ou queda demográfica)
  if (weakSeg || popGrowth < 0) {
    acoes.push({
      prioridade: popGrowth < 0 ? 'Crítica' : 'Alta',
      horizonte: 'Próximo Ciclo Comercial',
      titulo: 'Programa de rematrícula antecipada e jornada da família',
      oQueFazer: `Antecipar a campanha de rematrícula${weakSeg ? `, com foco especial em ${weakSeg.label}` : ''}. Mapear sinais de evasão (frequência, atrasos, satisfação) e atuar antes da decisão.`,
      porQue: 'Cada aluno perdido por evasão natural (~12% ao ano) precisa ser reposto na captação — barato evitar, caro repor. Fidelização >90% é o patamar de excelência.',
      base: weakSeg ? `Segmento vulnerável: ${weakSeg.label} (${formatPercent(weakSeg.value)})` : `Queda demográfica 0–4: ${popGrowth.toFixed(1)}%`,
      icon: Heart,
    });
  }

  // 4. Monitoramento competitivo
  acoes.push({
    prioridade: isFragmented ? 'Alta' : 'Média',
    horizonte: 'Contínua',
    titulo: 'Monitoramento competitivo estruturado',
    oQueFazer: `Acompanhar trimestralmente movimentos dos ${concorrentes.length} concorrentes diretos: preço, novos segmentos, comunicação, ofertas e parcerias editoriais.`,
    porQue: `Mercado ${isFragmented ? 'fragmentado exige vigilância — qualquer movimento ganha tração rápido' : 'competitivo recompensa quem antecipa movimentos'}. ${adotamBrasil > 0 ? `${adotamBrasil} concorrente(s) já adota(m) Editora do Brasil.` : ''}`,
    base: `${concorrentes.length} concorrentes na área de influência`,
    icon: Search,
  });

  // 5. Marca / Marketing (sempre)
  acoes.push({
    prioridade: 'Alta',
    horizonte: 'Contínua',
    titulo: 'Reforço de marca e presença digital',
    oQueFazer: 'Profissionalizar a comunicação: posicionamento claro, presença orgânica forte (Google, redes sociais, vídeos), depoimentos de famílias e indicadores de resultado visíveis.',
    porQue: 'A escola é uma marca inserida em um contexto. Famílias pesquisam antes de visitar — quem não aparece bem no digital perde matrícula antes mesmo do primeiro contato.',
    base: 'Visão sistêmica: pedagógico + marketing + captação + financeiro + fidelização',
    icon: BarChart3,
  });

  // 6. Disciplina comercial (sempre)
  acoes.push({
    prioridade: 'Alta',
    horizonte: 'Contínua',
    titulo: 'Disciplina comercial: pessoas, processo e tecnologia',
    oQueFazer: 'Definir rotina de acompanhamento semanal (cadastros, agendas, visitas, matrículas), revisar conversões por etapa e ajustar plano corretivo a cada 30 dias.',
    porQue: 'Processo e tecnologia sem pessoas geram alienação; pessoas sem processo geram caos. O equilíbrio entre os três é o que sustenta o resultado comercial.',
    base: 'Funil de captação · meta × volume × eficiência',
    icon: Users,
  });

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-8 px-3 sm:px-4 space-y-5 sm:space-y-7">
      <div>
        <h2 className="page-title text-xl sm:text-2xl">PLANO DE AÇÃO COMERCIAL E MARKETING</h2>
        <p className="page-subtitle text-xs sm:text-sm">
          {acoes.length} ações priorizadas para traduzir o diagnóstico em resultado — organizadas por horizonte de execução
        </p>
      </div>

      {/* Legenda de horizontes */}
      <div className="flex flex-wrap gap-2 sm:gap-3 text-[10px] sm:text-xs">
        {(['Curto Prazo', 'Próximo Ciclo Comercial', 'Contínua'] as Horizonte[]).map(h => (
          <div key={h} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border bg-card">
            <span className="w-2 h-2 rounded-full" style={{ background: horizColor[h] }} />
            <span style={{ color: 'hsl(var(--navy))' }} className="font-medium">{h}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3 sm:space-y-4">
        {acoes.map((a, i) => {
          const Icon = a.icon;
          return (
            <div key={i} className="bg-card rounded-xl border overflow-hidden">
              <div className="flex items-stretch">
                {/* faixa lateral colorida pelo horizonte */}
                <div className="w-1.5 flex-shrink-0" style={{ background: horizColor[a.horizonte] }} />
                <div className="flex-1 p-4 sm:p-5 space-y-2.5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'hsl(var(--teal-light))', color: 'hsl(var(--navy))' }}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Icon className="w-3.5 h-3.5" style={{ color: horizColor[a.horizonte] }} />
                          <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: horizColor[a.horizonte] }}>{a.horizonte}</span>
                        </div>
                        <h4 className="font-semibold text-sm sm:text-base leading-snug" style={{ color: 'hsl(var(--navy))' }}>{a.titulo}</h4>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded flex-shrink-0" style={{ background: prioBg[a.prioridade], color: prioFg[a.prioridade] }}>
                      {a.prioridade}
                    </span>
                  </div>

                  <div className="space-y-1.5 pl-0 sm:pl-10">
                    <p className="text-[12px] sm:text-sm leading-relaxed" style={{ color: 'hsl(var(--navy))' }}>
                      <strong>O que fazer:</strong> <span className="font-normal text-muted-foreground">{a.oQueFazer}</span>
                    </p>
                    <p className="text-[12px] sm:text-sm leading-relaxed" style={{ color: 'hsl(var(--navy))' }}>
                      <strong>Por que fazer:</strong> <span className="font-normal text-muted-foreground">{a.porQue}</span>
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground italic pt-1 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
                      Base analítica: {a.base}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-card rounded-xl border-l-4 p-4 sm:p-5" style={{ borderLeftColor: 'hsl(var(--teal))' }}>
        <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'hsl(var(--navy))' }}>
          <strong>Visão sistêmica:</strong> os resultados de captação e retenção dependem do equilíbrio entre <em>pedagógico, marketing, captação, financeiro e fidelização</em>.
          Nenhuma ação isolada sustenta o crescimento — é a disciplina de execução, com método, dados e acompanhamento, que transforma diagnóstico em matrícula.
        </p>
      </div>
    </div>
  );
}
