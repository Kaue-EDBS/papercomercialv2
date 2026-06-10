// Cria o usuário administrador (admin@ebsa.local / AdmBrasil1405) se ainda não existir.
// Chamada uma única vez no boot do app (idempotente — não recria nem altera se já existe).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const ADMIN_EMAIL = 'admin@ebsa.local';
const ADMIN_PASSWORD = 'AdmBrasil1405';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  try {
    // Verifica se já existe via profile com cod_protheus=ADMIN
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('cod_protheus', 'ADMIN')
      .maybeSingle();

    if (existing) {
      // Garante que a senha do admin permanece a padrão (idempotente)
      try {
        await supabase.auth.admin.updateUserById(existing.id, {
          password: ADMIN_PASSWORD,
          email_confirm: true,
        });
        await supabase.from('user_roles').upsert(
          { user_id: existing.id, role: 'admin' },
          { onConflict: 'user_id,role' },
        );
      } catch (_) { /* ignore */ }
      return new Response(JSON.stringify({ ok: true, created: false, reset: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        cod_protheus: 'ADMIN',
        nome: 'Administrador',
        role: 'admin',
        must_change_password: false,
      },
    });
    if (error) throw error;

    // Garante role admin (caso o trigger tenha criado como consultor por algum motivo)
    await supabase.from('user_roles').upsert(
      { user_id: data.user!.id, role: 'admin' },
      { onConflict: 'user_id,role' },
    );

    return new Response(JSON.stringify({ ok: true, created: true, id: data.user!.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});