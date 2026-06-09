/**
 * (#4) Registro guardado do Service Worker. Só roda em produção e fora do
 * preview Lovable. Em qualquer ambiente desligado, faz unregister defensivo
 * de SWs antigos.
 */
function shouldRegister(): boolean {
  if (typeof window === 'undefined') return false;
  if (!('serviceWorker' in navigator)) return false;
  if (!import.meta.env.PROD) return false;
  if (window.self !== window.top) return false;
  const host = location.hostname;
  if (host.startsWith('id-preview--')) return false;
  if (host.startsWith('preview--')) return false;
  if (host === 'lovableproject.com' || host.endsWith('.lovableproject.com')) return false;
  if (host === 'lovableproject-dev.com' || host.endsWith('.lovableproject-dev.com')) return false;
  if (host === 'beta.lovable.dev' || host.endsWith('.beta.lovable.dev')) return false;
  if (new URLSearchParams(location.search).get('sw') === 'off') return false;
  return true;
}

async function unregisterAppSw(): Promise<void> {
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const r of regs) {
      const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || '';
      if (url.endsWith('/sw.js')) await r.unregister();
    }
  } catch { /* ignore */ }
}

export async function registerSwGuarded(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  if (!shouldRegister()) {
    await unregisterAppSw();
    return;
  }
  try {
    const { registerSW } = await import('virtual:pwa-register');
    registerSW({ immediate: true });
  } catch (e) {
    console.warn('[pwa] registro falhou', e);
  }
}