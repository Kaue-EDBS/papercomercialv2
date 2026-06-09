import { useEffect, useState } from 'react';

/**
 * (#5) Overlay invocado com `G`: digite o número do slide e Enter.
 */
export default function JumpToSlideOverlay({ onJump, total }: { onJump: (n: number) => void; total: number }) {
  const [input, setInput] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (input !== null) {
        if (e.key === 'Escape') { e.preventDefault(); setInput(null); return; }
        if (e.key === 'Enter') {
          e.preventDefault();
          const n = parseInt(input, 10);
          if (!isNaN(n) && n >= 1 && n <= total) onJump(n);
          setInput(null);
          return;
        }
        if (e.key === 'Backspace') { e.preventDefault(); setInput(s => (s ?? '').slice(0, -1)); return; }
        if (/^[0-9]$/.test(e.key)) { e.preventDefault(); setInput(s => ((s ?? '') + e.key).slice(0, 2)); return; }
        return;
      }
      if ((e.key === 'g' || e.key === 'G') && !e.metaKey && !e.ctrlKey) {
        e.preventDefault(); setInput('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [input, total, onJump]);

  if (input === null) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-label="Ir para slide">
      <div className="bg-card rounded-2xl p-6 shadow-xl border min-w-[220px] text-center">
        <div className="text-xs text-muted-foreground mb-2">Ir para slide (1–{total})</div>
        <div className="text-4xl font-bold tabular-nums" style={{ color: 'hsl(var(--navy))' }}>
          {input || '_'}
        </div>
        <div className="text-[10px] text-muted-foreground mt-3">Enter para confirmar · Esc para cancelar</div>
      </div>
    </div>
  );
}