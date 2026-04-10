import { FileText, Presentation } from 'lucide-react';

interface Props {
  onExportPDF?: () => void;
  onExportPPT?: () => void;
}

export default function PageEncerramento({ onExportPDF, onExportPPT }: Props) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full text-center space-y-10">
        {/* Decorative line */}
        <div className="flex justify-center">
          <div className="w-16 h-1 rounded-full" style={{ background: 'hsl(var(--teal))' }} />
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: 'hsl(var(--navy))' }}>
          Obrigado pelo seu tempo
        </h1>

        {/* Main text */}
        <div className="space-y-5 text-base sm:text-lg leading-relaxed text-muted-foreground px-2">
          <p>
            Encerrar esta análise é também abrir espaço para novas possibilidades.
          </p>
          <p>
            A Editora do Brasil agradece pela atenção, pelo tempo dedicado e pela oportunidade de apresentar esta visão comercial e estratégica. Mais do que compartilhar dados, nosso objetivo é construir caminhos, fortalecer relações e apoiar escolas que desejam crescer com consistência, relevância e valor.
          </p>
          <p>
            Seguimos de portas abertas para estar ao lado da sua escola, somando experiência, parceria e soluções que contribuam para resultados cada vez mais sólidos.
          </p>
        </div>

        {/* Highlight CTA */}
        <div className="py-6">
          <p className="text-xl sm:text-2xl font-semibold italic" style={{ color: 'hsl(var(--teal))' }}>
            "Conte com a Editora do Brasil para crescer junto."
          </p>
        </div>

        {/* Export buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center px-4">
          <button
            onClick={onExportPDF}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition border-2 hover:opacity-90"
            style={{ borderColor: 'hsl(var(--navy))', color: 'hsl(var(--navy))' }}
          >
            <FileText className="w-5 h-5" />
            Exportar em PDF
          </button>
          <button
            onClick={onExportPPT}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition text-primary-foreground bg-primary hover:opacity-90"
          >
            <Presentation className="w-5 h-5" />
            Exportar em PPT
          </button>
        </div>

        {/* Decorative line */}
        <div className="flex justify-center">
          <div className="w-24 h-0.5 rounded-full" style={{ background: 'hsl(var(--navy))' }} />
        </div>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-muted-foreground">
          Estamos prontos para construir os próximos passos junto com a sua escola.
        </p>

        {/* Institutional signature */}
        <div className="pt-4 space-y-1">
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'hsl(var(--navy))' }}>
            Editora do Brasil
          </p>
          <p className="text-xs text-muted-foreground">
            Educação que transforma, parceria que constrói.
          </p>
        </div>
      </div>
    </div>
  );
}
