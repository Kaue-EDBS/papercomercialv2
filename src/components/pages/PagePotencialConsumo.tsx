import { AnalysisResult } from '@/lib/types';
import { formatNumber } from '@/lib/analysis';
import { usePotencialConsumo, findPotencialByIBGE } from '@/hooks/usePotencialConsumo';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import IndicatorCard from '@/components/IndicatorCard';
import { ShoppingBag, GraduationCap, BookOpen, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Props { analysis: AnalysisResult; }

const CLASSES = ['A++', 'A+', 'B1', 'B2', 'C1', 'C2', 'D', 'E'] as const;

// Cor por classe — gradiente teal→navy (alta renda) para lime (baixa).
const CLASS_COLOR: Record<string, string> = {
  'A++': 'hsl(174, 62%, 28%)',
  'A+':  'hsl(174, 62%, 38%)',
  'B1':  'hsl(174, 62%, 48%)',
  'B2':  'hsl(174, 50%, 58%)',
  'C1':  'hsl(80, 55%, 55%)',
  'C2':  'hsl(80, 55%, 50%)',
  'D':   'hsl(40, 70%, 55%)',
  'E':   'hsl(20, 70%, 55%)',
};

function fmtBRL(v: number, compact = false): string {
  if (compact) {
    if (v >= 1e9) return `R$ ${(v / 1e9).toFixed(1).replace('.', ',')} bi`;
    if (v >= 1e6) return `R$ ${(v / 1e6).toFixed(1).replace('.', ',')} mi`;
    if (v >= 1e3) return `R$ ${(v / 1e3).toFixed(0)} mil`;
  }
  return `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
}

export default function PagePotencialConsumo({ analysis }: Props) {
  const { escola } = analysis;
  const { data, loading } = usePotencialConsumo();
  const codMun = String(escola['Código Município']);
  const pot = !loading ? findPotencialByIBGE(data, codMun) : null;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-6 sm:py-8 px-3 sm:px-4 space-y-5 sm:space-y-7">
        <div>
          <h2 className="page-title text-xl sm:text-2xl">POTENCIAL DE CONSUMO EDUCACIONAL E COMERCIAL</h2>
          <p className="page-subtitle text-xs sm:text-sm">
            Município de {escola.Município}/{escola.UF} · preparando massa de consumo educacional…
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 sm:h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!pot) {
    return (
      <div className="max-w-5xl mx-auto py-6 sm:py-8 px-3 sm:px-4 space-y-4">
        <h2 className="page-title text-xl sm:text-2xl">POTENCIAL DE CONSUMO EDUCACIONAL E COMERCIAL</h2>
        <div className="badge-unavailable text-sm p-4">Dado de potencial de consumo não disponível para este município.</div>
      </div>
    );
  }

  const matriculas = pot.potencial.matriculas_total;
  const livrosMaterial = pot.potencial.livros_material_total;
  const livrosDidaticos = pot.potencial.livros_didaticos;
  const cursosRegulares = pot.potencial.cursos_regulares;
  const totalEducacional = matriculas + livrosMaterial;

  // Distribuição estimada do potencial por classe (proxy: renda nominal por classe)
  const totalRenda = CLASSES.reduce((s, c) => s + (pot.renda_classe[c] || 0), 0);
  const classesData = CLASSES.map(c => {
    const peso = totalRenda > 0 ? (pot.renda_classe[c] || 0) / totalRenda : 0;
    return {
      classe: c,
      domicilios: pot.domicilios_classe[c] || 0,
      potencialEduc: totalEducacional * peso,
      participacao: peso * 100,
      color: CLASS_COLOR[c],
    };
  });

  // Top classes por participação no consumo educacional
  const topClasses = [...classesData].sort((a, b) => b.potencialEduc - a.potencialEduc).slice(0, 3);
  const altaRenda = classesData.filter(c => ['A++', 'A+', 'B1'].includes(c.classe))
    .reduce((s, c) => s + c.participacao, 0);
  const baixaRenda = classesData.filter(c => ['D', 'E'].includes(c.classe))
    .reduce((s, c) => s + c.participacao, 0);

  // Leitura comercial
  let leitura = '';
  if (altaRenda >= 35) {
    leitura = 'Massa de consumo concentrada em classes de maior renda — discurso de valor, diferenciais pedagógicos e proposta premium têm espaço relevante. Sensibilidade a preço tende a ser menor que a média.';
  } else if (baixaRenda >= 50) {
    leitura = 'Massa de consumo concentrada em classes D/E — atenção à sensibilidade de preço. Comunicação deve enfatizar custo-benefício, retorno do investimento educacional e condições facilitadas.';
  } else {
    leitura = 'Distribuição equilibrada entre classes — território com mix de perfis. Posicionamento intermediário tende a alcançar maior volume; reforce diferenciais sem perder competitividade de preço.';
  }

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-8 px-3 sm:px-4 space-y-5 sm:space-y-7">
      <div>
        <h2 className="page-title text-xl sm:text-2xl">POTENCIAL DE CONSUMO EDUCACIONAL E COMERCIAL</h2>
        <p className="page-subtitle text-xs sm:text-sm">
          Município de {escola.Município}/{escola.UF} · massa de consumo educacional e oportunidade comercial
        </p>
      </div>

      {/* BLOCO 1 — KPIs principais de consumo */}
      <div>
        <h3 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-3" style={{ color: 'hsl(var(--navy))' }}>
          Potencial de consumo <span className="text-muted-foreground font-normal">· município (anual)</span>
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <IndicatorCard value={fmtBRL(matriculas, true)} label="Matrículas e mensalidades" color="teal" />
          <IndicatorCard value={fmtBRL(livrosMaterial, true)} label="Livros e material escolar" color="navy" />
          <IndicatorCard value={fmtBRL(livrosDidaticos, true)} label="Livros didáticos" color="lime" />
          <IndicatorCard value={fmtBRL(totalEducacional, true)} label="Total educacional" color="teal" />
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Potencial de consumo = capacidade econômica anual estimada da população do município nas categorias indicadas. Não é previsão de matrícula — é referência de massa de mercado.
        </p>
      </div>

      {/* BLOCO 2 — Distribuição por classe (potencial educacional) */}
      <div className="bg-card rounded-xl border p-4 sm:p-5 space-y-3">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <h3 className="font-semibold text-xs sm:text-sm" style={{ color: 'hsl(var(--navy))' }}>
            Distribuição do consumo educacional por classe <span className="text-muted-foreground font-normal">· município</span>
          </h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Maior massa: <strong style={{ color: 'hsl(var(--teal))' }}>{topClasses.map(c => c.classe).join(' · ')}</strong>
          </p>
        </div>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={classesData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="classe" tick={{ fontSize: 11, fill: 'hsl(var(--navy))' }} />
              <YAxis tickFormatter={v => fmtBRL(v, true)} tick={{ fontSize: 10 }} width={70} />
              <Tooltip
                formatter={(v: number) => [fmtBRL(v), 'Potencial educacional']}
                labelFormatter={l => `Classe ${l}`}
                contentStyle={{ fontSize: 11 }}
              />
              <Bar dataKey="potencialEduc" radius={[4, 4, 0, 0]}>
                {classesData.map((c, i) => <Cell key={i} fill={c.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BLOCO 3 — Tabela detalhada por classe */}
      <div className="bg-card rounded-xl border p-4 sm:p-5 space-y-3">
        <h3 className="font-semibold text-xs sm:text-sm" style={{ color: 'hsl(var(--navy))' }}>
          Detalhamento por classe de renda
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] sm:text-xs border-collapse">
            <thead>
              <tr className="text-left border-b">
                <th className="px-2 py-2 font-semibold" style={{ color: 'hsl(var(--navy))' }}>Classe</th>
                <th className="px-2 py-2 font-semibold text-right" style={{ color: 'hsl(var(--navy))' }}>Domicílios</th>
                <th className="px-2 py-2 font-semibold text-right" style={{ color: 'hsl(var(--navy))' }}>Potencial educacional</th>
                <th className="px-2 py-2 font-semibold text-right" style={{ color: 'hsl(var(--navy))' }}>Participação</th>
              </tr>
            </thead>
            <tbody>
              {classesData.map(c => (
                <tr key={c.classe} className="border-b last:border-0">
                  <td className="px-2 py-1.5">
                    <span className="inline-flex items-center gap-1.5 font-semibold">
                      <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                      {c.classe}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-right">{formatNumber(Math.round(c.domicilios))}</td>
                  <td className="px-2 py-1.5 text-right">{fmtBRL(c.potencialEduc, true)}</td>
                  <td className="px-2 py-1.5 text-right font-semibold" style={{ color: 'hsl(var(--navy))' }}>
                    {c.participacao.toFixed(1).replace('.', ',')}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Potencial educacional por classe estimado pela participação de cada classe na renda nominal total do município.
        </p>
      </div>

      {/* BLOCO 4 — Composição do consumo educacional (cards de apoio) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-card rounded-xl border p-4 space-y-2">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" style={{ color: 'hsl(var(--teal))' }} />
            <h4 className="font-semibold text-xs sm:text-sm" style={{ color: 'hsl(var(--navy))' }}>Matrículas e mensalidades</h4>
          </div>
          <p className="text-lg font-bold" style={{ color: 'hsl(var(--teal))' }}>{fmtBRL(matriculas, true)}</p>
          <div className="text-[11px] text-muted-foreground space-y-0.5">
            <div>· Cursos regulares: <strong>{fmtBRL(cursosRegulares, true)}</strong></div>
            <div>· Cursos superiores: <strong>{fmtBRL(pot.potencial.cursos_superiores, true)}</strong></div>
            <div>· Outros cursos: <strong>{fmtBRL(pot.potencial.outros_cursos, true)}</strong></div>
          </div>
        </div>
        <div className="bg-card rounded-xl border p-4 space-y-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" style={{ color: 'hsl(var(--navy))' }} />
            <h4 className="font-semibold text-xs sm:text-sm" style={{ color: 'hsl(var(--navy))' }}>Livros e material escolar</h4>
          </div>
          <p className="text-lg font-bold" style={{ color: 'hsl(var(--navy))' }}>{fmtBRL(livrosMaterial, true)}</p>
          <div className="text-[11px] text-muted-foreground space-y-0.5">
            <div>· Livros didáticos: <strong>{fmtBRL(livrosDidaticos, true)}</strong></div>
            <div>· Artigos escolares: <strong>{fmtBRL(pot.potencial.artigos_escolares, true)}</strong></div>
            <div>· Outras despesas: <strong>{fmtBRL(pot.potencial.outros_livros, true)}</strong></div>
          </div>
        </div>
      </div>

      {/* BLOCO 5 — Leitura comercial */}
      <div className="bg-card rounded-xl border-l-4 p-4 sm:p-5 space-y-2" style={{ borderLeftColor: 'hsl(var(--teal))' }}>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" style={{ color: 'hsl(var(--teal))' }} />
          <h3 className="font-semibold text-xs sm:text-sm" style={{ color: 'hsl(var(--navy))' }}>Leitura comercial</h3>
        </div>
        <p className="text-[12px] sm:text-sm leading-relaxed" style={{ color: 'hsl(var(--navy))' }}>
          O município movimenta um potencial de <strong>{fmtBRL(totalEducacional, true)}</strong> por ano em consumo educacional
          (matrículas + livros e material). A maior massa está concentrada nas classes <strong>{topClasses.map(c => c.classe).join(', ')}</strong>,
          que respondem por <strong>{topClasses.reduce((s, c) => s + c.participacao, 0).toFixed(0)}%</strong> do potencial total.
        </p>
        <p className="text-[12px] sm:text-sm leading-relaxed text-muted-foreground">
          {leitura}
        </p>
        <div className="grid grid-cols-2 gap-2 pt-2 border-t mt-2">
          <div className="text-[11px]">
            <div className="text-muted-foreground">Classes A/B (alta renda)</div>
            <div className="font-bold text-sm" style={{ color: 'hsl(var(--teal))' }}>{altaRenda.toFixed(0)}% do potencial</div>
          </div>
          <div className="text-[11px]">
            <div className="text-muted-foreground">Classes D/E (baixa renda)</div>
            <div className="font-bold text-sm" style={{ color: 'hsl(var(--navy))' }}>{baixaRenda.toFixed(0)}% do potencial</div>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground italic pt-1">
          <ShoppingBag className="w-3 h-3 inline mr-1" />
          Camada complementar à análise de concorrência, market share e mensalidade — orienta o discurso comercial, sem substituir essas leituras.
        </p>
      </div>
    </div>
  );
}
