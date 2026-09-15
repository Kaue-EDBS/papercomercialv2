// Only publishable/legacy anon keys may enter a browser bundle.
export function assertPublicConfig(url: string, key: string): void {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.supabase.co')) throw new Error('Invalid public backend URL');
  if (key.startsWith('sb_publishable_')) return;
  if (key.startsWith('sb_secret_')) throw new Error('Privileged key forbidden in browser');
  try {
    const part = key.split('.')[1];
    const claims = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
    if (claims.role !== 'anon' || `${claims.ref}.supabase.co` !== parsed.hostname) throw new Error();
  } catch { throw new Error('Expected a matching public anon/publishable key'); }
}
