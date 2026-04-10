import { EscolaData, PresentationType } from '@/lib/types';

interface Props {
  escola: EscolaData;
  onSelect: (type: PresentationType) => void;
  onBack?: () => void;
}

export default function PageTipo({ escola, onSelect, onBack }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 px-4">
      {onBack && (
        <button onClick={onBack} className="self-start ml-4 nav-pill text-sm font-semibold" style={{ color: 'hsl(var(--teal))' }}>
          ← Voltar à Capa
        </button>
      )}
      <div className="text-center">
        <h2 className="page-title text-2xl">Escola Selecionada</h2>
        <p className="text-lg font-semibold mt-2" style={{ color: 'hsl(var(--teal))' }}>{escola.Escola}</p>
        <p className="text-sm text-muted-foreground">{escola.Município} / {escola.UF} — Código Inep: {escola['Código Inep']}</p>
      </div>
      <div className="text-center">
        <h3 className="page-title text-xl mb-4">Selecione o tipo de apresentação</h3>
        <div className="flex gap-4">
          <button onClick={() => onSelect('prospeccao')}
            className="px-8 py-4 rounded-xl font-bold text-lg transition hover:opacity-90"
            style={{ background: 'hsl(var(--teal))', color: 'hsl(var(--primary-foreground))' }}>
            Prospecção
          </button>
          <button onClick={() => onSelect('renovacao')}
            className="px-8 py-4 rounded-xl font-bold text-lg transition hover:opacity-90"
            style={{ background: 'hsl(var(--navy))', color: 'hsl(var(--accent-foreground))' }}>
            Renovação
          </button>
        </div>
      </div>
    </div>
  );
}
