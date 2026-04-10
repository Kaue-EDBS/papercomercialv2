import { PresentationType } from '@/lib/types';
import { BookOpen, Users, School, Award, Lightbulb, Handshake } from 'lucide-react';

const HIGHLIGHTS = [
  { number: '80', label: 'anos de experiência', icon: Award },
  { number: '70 mil+', label: 'escolas atendidas', icon: School },
  { number: '20 mi+', label: 'estudantes impactados', icon: Users },
];

const DIFFERENTIALS = [
  { icon: BookOpen, title: 'Excelência Editorial', desc: 'Conteúdo autoral de alta qualidade, alinhado à BNCC.' },
  { icon: Lightbulb, title: 'Inovação Educacional', desc: 'Soluções digitais e pedagógicas integradas.' },
  { icon: Handshake, title: 'Parceria Estratégica', desc: 'Suporte consultivo para crescimento da sua escola.' },
];

interface Props {
  type: PresentationType;
}

export default function PageAbertura({ type }: Props) {
  const isProspeccao = type === 'prospeccao';
  const title = isProspeccao ? 'PROPOSTA COMERCIAL' : 'PROPOSTA DE RENOVAÇÃO';
  const subtitle = isProspeccao
    ? 'Soluções que geram valor real para a sua escola'
    : 'Renovar é fortalecer os resultados já construídos';

  const intro = isProspeccao
    ? 'A Editora do Brasil apresenta esta proposta com o objetivo de mostrar como nossos produtos, soluções educacionais e facilidades podem ajudar a sua escola a crescer com mais inovação, qualidade e competitividade.'
    : 'Sabemos que renovar uma adoção é também renovar a confiança em uma solução que entrega qualidade, credibilidade e apoio ao trabalho pedagógico. Veja como continuamos evoluindo para gerar ainda mais valor.';

  const closing = isProspeccao
    ? 'Nosso compromisso é apoiar instituições que desejam se destacar, fortalecer sua proposta pedagógica, encantar famílias e construir resultados consistentes.'
    : 'Renovar com a Editora do Brasil é reconhecer os resultados já construídos e seguir investindo em educação de qualidade.';

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-3 sm:px-4 space-y-8">
      {/* Hero */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'hsl(var(--navy))' }}>
          {title}
        </h2>
        <p className="text-base sm:text-lg font-medium" style={{ color: 'hsl(var(--teal))' }}>
          {subtitle}
        </p>
      </div>

      {/* Intro block */}
      <div className="bg-card rounded-xl border p-5 sm:p-6 text-sm sm:text-base leading-relaxed text-foreground">
        {intro}
      </div>

      {/* Highlight numbers */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {HIGHLIGHTS.map((h) => (
          <div
            key={h.label}
            className="rounded-xl border p-4 sm:p-5 text-center space-y-1.5"
            style={{ background: 'hsl(var(--navy))', borderColor: 'hsl(var(--navy))' }}
          >
            <h.icon className="w-5 h-5 sm:w-6 sm:h-6 mx-auto" style={{ color: 'hsl(var(--lime))' }} />
            <p className="text-xl sm:text-3xl font-extrabold" style={{ color: 'hsl(var(--lime))' }}>{h.number}</p>
            <p className="text-[10px] sm:text-xs font-medium text-white/80 uppercase tracking-wide">{h.label}</p>
          </div>
        ))}
      </div>

      {/* Differentials */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {DIFFERENTIALS.map((d) => (
          <div key={d.title} className="bg-card rounded-xl border p-4 sm:p-5 space-y-2">
            <div className="flex items-center gap-2">
              <d.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" style={{ color: 'hsl(var(--teal))' }} />
              <h4 className="font-bold text-xs sm:text-sm" style={{ color: 'hsl(var(--navy))' }}>{d.title}</h4>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">{d.desc}</p>
          </div>
        ))}
      </div>

      {/* Closing */}
      <div
        className="rounded-xl p-5 sm:p-6 text-center text-sm sm:text-base font-medium leading-relaxed"
        style={{ background: 'hsl(var(--teal) / 0.08)', color: 'hsl(var(--navy))' }}
      >
        {closing}
      </div>
    </div>
  );
}
