// Ações administrativas — exigem usuário autenticado COM role 'admin'.
// Ações suportadas:
//   - reset_password: gera senha temporária para um consultor, marca must_change_password=true
//   - delete_user: remove um consultor (auth + profile cascateia)
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

interface Body {
  action: 'reset_password' | 'delete_user';
  target_user_id: string;
}

function randomPassword(len = 12): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

  try {
    // 1) Verifica usuário autenticado via JWT do header
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!jwt) return json({ error: 'Não autenticado' }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes.user) return json({ error: 'Sessão inválida' }, 401);

    // 2) Verifica role admin
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: roleRow } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userRes.user.id)
      .eq('role', 'admin')
      .maybeSingle();
    if (!roleRow) return json({ error: 'Acesso negado: requer administrador' }, 403);

    // 3) Executa ação
    const body = await req.json() as Body;
    if (!body.target_user_id) return json({ error: 'target_user_id obrigatório' }, 400);

    if (body.action === 'reset_password') {
      const tempPass = randomPassword(10);
      const { error: updErr } = await admin.auth.admin.updateUserById(body.target_user_id, {
        password: tempPass,
      });
      if (updErr) throw updErr;
      await admin.from('profiles').update({ must_change_password: true }).eq('id', body.target_user_id);
      return json({ ok: true, temp_password: tempPass });
    }

    if (body.action === 'delete_user') {
      const { error: delErr } = await admin.auth.admin.deleteUser(body.target_user_id);
      if (delErr) throw delErr;
      return json({ ok: true });
    }

    return json({ error: 'Ação desconhecida' }, 400);
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}