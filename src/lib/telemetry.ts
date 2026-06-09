/**
 * (#8) Tracking de erros + (#9) Logs de uso anônimos — versão local-first.
 *
 * Sem dependência externa: bufferiza eventos em localStorage (ring buffer)
 * e expõe `window.__telemetry` para inspeção/exportação manual. Se a env
 * `VITE_TELEMETRY_ENDPOINT` estiver definida, faz POST em background
 * (best-effort, sem bloquear a UI).
 */

type Severity = 'error' | 'warn' | 'info';

interface TelemetryEvent {
  ts: string;
  type: 'error' | 'event';
  severity?: Severity;
  message?: string;
  name?: string;
  stack?: string;
  context?: Record<string, unknown>;
  url?: string;
  ua?: string;
  sessionId?: string;
}

const KEY_BUFFER = 'telemetry:buffer:v1';
const KEY_SESSION = 'telemetry:sid:v1';
const MAX_EVENTS = 200;
const FLUSH_BATCH = 20;
const FLUSH_INTERVAL_MS = 30_000;

function getSessionId(): string {
  try {
    let sid = sessionStorage.getItem(KEY_SESSION);
    if (!sid) {
      sid = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(KEY_SESSION, sid);
    }
    return sid;
  } catch {
    return 'no-session';
  }
}

function readBuffer(): TelemetryEvent[] {
  try {
    const raw = localStorage.getItem(KEY_BUFFER);
    return raw ? (JSON.parse(raw) as TelemetryEvent[]) : [];
  } catch {
    return [];
  }
}

function writeBuffer(buf: TelemetryEvent[]): void {
  try {
    localStorage.setItem(KEY_BUFFER, JSON.stringify(buf.slice(-MAX_EVENTS)));
  } catch {
    /* quota cheio: ignora */
  }
}

function push(ev: TelemetryEvent): void {
  const buf = readBuffer();
  buf.push(ev);
  writeBuffer(buf);
  const endpoint = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env?.VITE_TELEMETRY_ENDPOINT;
  if (endpoint && typeof navigator !== 'undefined') {
    try {
      const blob = new Blob([JSON.stringify(ev)], { type: 'application/json' });
      if (navigator.sendBeacon) navigator.sendBeacon(endpoint, blob);
      else fetch(endpoint, { method: 'POST', body: blob, keepalive: true }).catch(() => {});
    } catch { /* best-effort */ }
  }
  // Tenta flush para Lovable Cloud se temos lote suficiente
  if (buf.length >= FLUSH_BATCH) void flushToCloud();
}

/**
 * Envia eventos em buffer para a tabela `telemetry_events` no Lovable Cloud.
 * Best-effort: requer usuário autenticado (RLS); falha em silêncio se offline.
 */
let flushing = false;
export async function flushToCloud(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes.user?.id ?? null;
    const buf = readBuffer();
    if (!buf.length) return;
    const rows = buf.map(ev => ({
      user_id: userId,
      session_id: ev.sessionId ?? null,
      type: ev.type,
      name: ev.name ?? null,
      url: ev.url ?? null,
      payload: { message: ev.message, stack: ev.stack, context: ev.context, severity: ev.severity },
      user_agent: ev.ua ?? null,
      created_at: ev.ts,
    }));
    const { error } = await supabase.from('telemetry_events').insert(rows);
    if (!error) writeBuffer([]);
  } catch {
    /* offline / sem auth — mantém buffer local */
  } finally {
    flushing = false;
  }
}

/** Liga flush periódico (chamar 1x no boot). */
let flushTimerStarted = false;
export function startTelemetryFlush(): void {
  if (flushTimerStarted || typeof window === 'undefined') return;
  flushTimerStarted = true;
  setInterval(() => { void flushToCloud(); }, FLUSH_INTERVAL_MS);
  window.addEventListener('beforeunload', () => { void flushToCloud(); });
}

function baseFields(): Pick<TelemetryEvent, 'ts' | 'url' | 'ua' | 'sessionId'> {
  return {
    ts: new Date().toISOString(),
    url: typeof location !== 'undefined' ? location.pathname + location.search : '',
    ua: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    sessionId: getSessionId(),
  };
}

export function reportError(error: Error | string, context?: Record<string, unknown>): void {
  const err = typeof error === 'string' ? new Error(error) : error;
  push({
    ...baseFields(),
    type: 'error',
    severity: 'error',
    name: err.name,
    message: err.message,
    stack: err.stack,
    context,
  });
  if (typeof console !== 'undefined') console.error('[telemetry]', err, context);
}

export function trackEvent(name: string, context?: Record<string, unknown>): void {
  push({
    ...baseFields(),
    type: 'event',
    severity: 'info',
    name,
    context,
  });
}

export function getTelemetryBuffer(): TelemetryEvent[] {
  return readBuffer();
}

export function clearTelemetryBuffer(): void {
  writeBuffer([]);
}

export function downloadTelemetry(): void {
  const data = JSON.stringify(readBuffer(), null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `telemetry-${new Date().toISOString()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Liga os handlers globais (window.onerror + unhandledrejection). Idempotente. */
let installed = false;
export function installGlobalErrorHandlers(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('error', (ev) => {
    reportError(ev.error || new Error(ev.message || 'window.onerror'), {
      filename: ev.filename, lineno: ev.lineno, colno: ev.colno,
    });
  });
  window.addEventListener('unhandledrejection', (ev) => {
    const reason = ev.reason;
    reportError(reason instanceof Error ? reason : new Error(String(reason)), { source: 'unhandledrejection' });
  });
  // Expõe para inspeção manual no console
  (window as unknown as { __telemetry: unknown }).__telemetry = {
    get: getTelemetryBuffer,
    clear: clearTelemetryBuffer,
    download: downloadTelemetry,
    track: trackEvent,
    flush: flushToCloud,
  };
}