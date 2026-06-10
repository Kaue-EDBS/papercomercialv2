// DEV-ONLY: garante que o usuário (admin ou consultor) exista no Auth com a senha padrão de dev.
// Sem senha do usuário — o front chama essa função antes de signInWithPassword usando a senha fixa.
// TODO: REMOVER quando o backend tiver fluxo real de senha.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const DEV_PASSWORD = 'ebsa-dev-2026';
const DOMAIN = 'ebsa.local';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  try {
    const { codigo } = await req.json() as { codigo?: string };
    const cod = (codigo ?? '').trim();
    if (!cod) return json({ error: 'codigo obrigatório' }, 400);

    const isAdmin = cod.toUpperCase() === 'ADMIN';
    const email = isAdmin ? `admin@${DOMAIN}` : `${cod.toLowerCase()}@${DOMAIN}`;

    // Procura primeiro pelo profile (cod_protheus indexa o usuário)
    let userId: string | null = null;
    const { data: prof } = await admin
      .from('profiles')
      .select('id')
      .eq('cod_protheus', cod.toUpperCase())
      .maybeSingle();
    if (prof?.id) userId = prof.id;

    // Fallback: pagina usuários do Auth
    if (!userId) {
      let page = 1;
      const perPage = 1000;
      while (true) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
        if (error) throw error;
        const found = data.users.find(u => (u.email ?? '').toLowerCase() === email);
        if (found) { userId = found.id; break; }
        if (data.users.length < perPage) break;
        page += 1;
        if (page > 20) break;
      }
    }

    if (userId) {
      await admin.auth.admin.updateUserById(userId, {
        password: DEV_PASSWORD,
        email_confirm: true,
      });
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: DEV_PASSWORD,
        email_confirm: true,
        user_metadata: {
          cod_protheus: cod.toUpperCase(),
          nome: cod.toUpperCase(),
          role: isAdmin ? 'admin' : 'consultor',
          must_change_password: false,
        },
      });
      if (error) throw error;
      userId = data.user!.id;
      if (isAdmin) {
        await admin.from('user_roles').upsert(
          { user_id: userId, role: 'admin' },
          { onConflict: 'user_id,role' },
        );
      }
    }

    return json({ ok: true, email, password: DEV_PASSWORD });
  } catch (e) {
    return json({ ok: false, error: String((e as Error)?.message ?? e) }, 500);
  }
});

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}