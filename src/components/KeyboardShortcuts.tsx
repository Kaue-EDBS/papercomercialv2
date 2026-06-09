import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

/**
 * (#5) Modal de atalhos de teclado. Abre com `?` (ou Shift+/).
 */
interface Shortcut { keys: string; desc: string }

const DEFAULT_SHORTCUTS: Shortcut[] = [
  { keys: '←  /  →', desc: 'Navegar entre slides' },
  { keys: 'G', desc: 'Ir para um slide (digite o número)' },
  { keys: 'F', desc: 'Alternar tela cheia' },
  { keys: 'P', desc: 'Modo apresentação (esconde header/footer)' },
  { keys: '?', desc: 'Abrir/fechar esta ajuda' },
  { keys: 'Esc', desc: 'Sair de tela cheia / fechar diálogo' },
];

export default function KeyboardShortcuts({ extras = [] }: { extras?: Shortcut[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Atalhos de teclado</DialogTitle>
          <DialogDescription>Use o teclado para apresentar mais rápido.</DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 mt-2">
          {[...DEFAULT_SHORTCUTS, ...extras].map(s => (
            <li key={s.keys} className="flex items-center justify-between text-sm border-b last:border-0 pb-2">
              <span className="text-muted-foreground">{s.desc}</span>
              <kbd className="px-2 py-1 rounded bg-muted font-mono text-xs">{s.keys}</kbd>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}