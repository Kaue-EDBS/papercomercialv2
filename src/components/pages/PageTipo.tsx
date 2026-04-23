import { EscolaData, PresentationType } from '@/lib/types';

interface Props {
  escola: EscolaData;
  onSelect: (type: PresentationType) => void;
  onBack?: () => void;
}

export default function PageTipo({ escola, onSelect, onBack }: Props) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-14">
      {onBack && (
        <button
          onClick={onBack}
          className="text-xs font-semibold mb-6 inline-flex items-center gap-1 hover:underline focus-visible:ring-2 focus-visible:ring-primary rounded px-1"
          style={{ color: 'hsl(var(--teal))' }}
        >
          ← Voltar
        </button>
      )}

      <div className="text-center space-y-2 mb-8">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--teal))' }}>
          Etapa 3 · Apresentação
        </span>
        <h2 className="page-title text-2xl">Escola selecionada</h2>
      </div>

      <div
        className="rounded-2xl border bg-card p-5 sm:p-6 text-center space-y-1 mb-10 shadow-sm"
        style={{ borderColor: 'hsl(var(--border))' }}
      >
        <p className="text-base sm:text-lg font-bold" style={{ color: 'hsl(var(--navy))' }}>
          {escola.Escola}
        </p>
        <p className="text-sm text-muted-foreground">
          {escola.Município} / {escola.UF} · Código Inep: {escola['Código Inep']}
        </p>
      </div>

      <div className="text-center space-y-2 mb-5">
        <h3 className="page-title text-xl">Como você quer apresentar?</h3>
        <p className="text-sm text-muted-foreground">
          Escolha o modo da apresentação para gerar o paper comercial.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <button
          onClick={() => onSelect('prospeccao')}
          className="px-6 py-4 rounded-xl font-bold text-base sm:text-lg transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 shadow-sm"
          style={{ background: 'hsl(var(--teal))', color: 'hsl(var(--primary-foreground))' }}
        >
          Prospecção
        </button>
        <button
          onClick={() => onSelect('renovacao')}
          className="px-6 py-4 rounded-xl font-bold text-base sm:text-lg transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 shadow-sm"
          style={{ background: 'hsl(var(--navy))', color: 'hsl(var(--accent-foreground))' }}
        >
          Renovação
        </button>
      </div>
    </div>
  );
}
