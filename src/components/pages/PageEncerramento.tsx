import { useState } from 'react';
import { Download, FileText, Presentation, Loader2 } from 'lucide-react';
import { AnalysisResult, PresentationType, ConsultorSession } from '@/lib/types';
import { exportPDF, exportPPTX, downloadBlob, buildFilename, ExportContext } from '@/lib/export';
import { toast } from 'sonner';
import { usePotencialConsumo } from '@/hooks/usePotencialConsumo';
import { useRendaFaixaEtaria } from '@/hooks/useRendaFaixaEtaria';

interface Props {
  analysis?: AnalysisResult | null;
  presentationType?: PresentationType | null;
  session?: ConsultorSession | null;
  raioKm?: number;
  raioMode?: 'padrao' | 'personalizado';
  essenciaisInep?: string[];
}

export default function PageEncerramento({ analysis, presentationType, session, raioKm, raioMode, essenciaisInep }: Props = {}) {
  const [busy, setBusy] = useState<'pdf' | 'pptx' | null>(null);
  const { data: potencialData, loading: loadingPotencial } = usePotencialConsumo();
  const { data: rendaData, loading: loadingRenda } = useRendaFaixaEtaria();
  const dataLoading = loadingPotencial || loadingRenda;

  const canExport = !!(analysis && presentationType) && !dataLoading;

  const handleExport = async (kind: 'pdf' | 'pptx') => {
    if (!analysis || !presentationType) return;
    if (dataLoading) {
      toast.message('Aguarde — finalizando o carregamento dos dados socioeconômicos e de potencial de consumo…');
      return;
    }
    setBusy(kind);
    try {
      const ctx: ExportContext = {
        analysis,
        presentationType,
        session: session ?? null,
        raioKm: raioKm ?? analysis.raioOperacional,
        raioMode: raioMode ?? 'padrao',
        essenciaisInep: essenciaisInep ?? [],
        rendaData: rendaData ?? [],
        potencialData: potencialData ?? null,
      };
      const blob = kind === 'pdf' ? await exportPDF(ctx) : await exportPPTX(ctx);
      downloadBlob(blob, buildFilename(ctx, kind));
      toast.success(kind === 'pdf' ? 'PDF gerado com sucesso.' : 'PPT gerado com sucesso.');
    } catch (e) {
      console.error(e);
      toast.error('Não foi possível gerar o arquivo. Tente novamente.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 pt-10 sm:pt-14 pb-12">
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
        <div className="py-6 space-y-3">
          <p className="text-xl sm:text-2xl font-semibold italic" style={{ color: 'hsl(var(--teal))' }}>
            "Conte com a Editora do Brasil para crescer junto."
          </p>
          <p className="text-base sm:text-lg font-semibold tracking-wide" style={{ color: 'hsl(var(--navy))' }}>
            Transformando o país pela educação.
          </p>
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

        {/* Export actions — agora no fim da página */}
        <section
          aria-labelledby="export-title"
          className="rounded-2xl border-2 p-6 sm:p-7 text-left shadow-sm mt-8"
          style={{ borderColor: 'hsl(var(--teal))', background: 'hsl(var(--teal-light) / 0.35)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Download className="w-5 h-5" style={{ color: 'hsl(var(--teal))' }} />
            <h2 id="export-title" className="text-lg sm:text-xl font-bold" style={{ color: 'hsl(var(--navy))' }}>
              Exportar apresentação
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            Escolha o formato. O arquivo será baixado direto no seu computador.
          </p>
          {!analysis || !presentationType ? (
            <p className="text-sm rounded-lg p-3 mb-4" style={{ background: 'hsl(var(--beige))', color: 'hsl(var(--navy))' }}>
              A exportação fica disponível depois que você concluir a análise da escola.
            </p>
          ) : dataLoading ? (
            <p className="text-sm rounded-lg p-3 mb-4 inline-flex items-center gap-2" style={{ background: 'hsl(var(--beige))', color: 'hsl(var(--navy))' }}>
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando dados de aderência econômica e potencial de consumo…
            </p>
          ) : null}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleExport('pdf')}
              disabled={!canExport || busy !== null}
              aria-label="Exportar apresentação em PDF"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-base shadow-md transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ background: 'hsl(var(--navy))', color: 'white', outlineColor: 'hsl(var(--teal))' }}
            >
              {busy === 'pdf' ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
              Exportar PDF
            </button>
            <button
              onClick={() => handleExport('pptx')}
              disabled={!canExport || busy !== null}
              aria-label="Exportar apresentação em PowerPoint"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-base shadow-md transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ background: 'hsl(var(--teal))', color: 'white', outlineColor: 'hsl(var(--navy))' }}
            >
              {busy === 'pptx' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Presentation className="w-5 h-5" />}
              Exportar PPT
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            9 páginas · layout fiel à apresentação · sem captura de tela.
          </p>
        </section>
      </div>
    </div>
  );
}
