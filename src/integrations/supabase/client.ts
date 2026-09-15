import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { brokeredPreviewStorage } from './previewAuthStorage';
import { assertPublicConfig } from '@/lib/public-config';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
assertPublicConfig(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
function createSupabaseFetch(supabaseKey: string): typeof fetch {
 return (input, init) => {
  const headers = new Headers(typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined);
  if (init?.headers) new Headers(init.headers).forEach((value,key)=>headers.set(key,value));
  // Opaque publishable keys are not JWTs. Secret keys were rejected above.
  if (supabaseKey.startsWith('sb_publishable_') && headers.get('Authorization')===`Bearer ${supabaseKey}`) headers.delete('Authorization');
  headers.set('apikey',supabaseKey);
  return fetch(input,{...init,headers});
 };
}
export const supabase = createClient<Database>(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
 global:{fetch:createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY)},
 auth:{storage:brokeredPreviewStorage(),persistSession:true,autoRefreshToken:true}
});
