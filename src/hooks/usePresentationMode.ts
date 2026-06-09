import { useEffect, useState, useCallback } from 'react';

/**
 * (#6) Modo apresentação: aplica classe `presentation-mode` no <html>
 * para o CSS global esconder elementos `data-presentation-hide`. Atalho `P`.
 */
export function usePresentationMode() {
  const [active, setActive] = useState(false);
  const toggle = useCallback(() => setActive(a => !a), []);

  useEffect(() => {
    const el = document.documentElement;
    if (active) el.classList.add('presentation-mode');
    else el.classList.remove('presentation-mode');
    return () => el.classList.remove('presentation-mode');
  }, [active]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'p' || e.key === 'P') { e.preventDefault(); setActive(a => !a); }
      if (e.key === 'Escape' && active) setActive(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  return { active, toggle };
}