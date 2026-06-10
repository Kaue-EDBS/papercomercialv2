/**
 * Camada de autenticação — login via código Protheus + senha.
 *
 * Modelo:
 * - Consultor: email fictício `{cod_protheus}@ebsa.local`, senha inicial `codprotheus123`.
 *   No 1º acesso (profile.must_change_password=true) a UI obriga troca de senha.
 * - Admin: código "ADMIN", email `admin@ebsa.local`, senha `AdmBrasil1405` (criada via edge function).
 * - Cadastro do consultor acontece sob demanda: se o e-mail não existir no Auth,
 *   tentamos `signUp` com a senha digitada. Se o código não estiver no manifest,
 *   o cadastro é recusado antes do signUp.
 */
import { supabase } from '@/integrations/supabase/client';
import type { CarteiraManifestEntry } from '@/hooks/useCarteiraManifest';

export const ADMIN_CODIGO = 'ADMIN';
const DOMAIN = 'ebsa.local';
const DEV_PASSWORD = 'ebsa-dev-2026';

export type AppRole = 'admin' | 'consultor';

export interface UserProfile {
  id: string;
  cod_protheus: string;
  nome: string;
  gestor: string | null;
  arquivo_carteira: string | null;
  must_change_password: boolean;
  role: AppRole;
}

function codigoToEmail(codigo: string): string {
  return `${codigo.trim().toLowerCase()}@${DOMAIN}`;
}

export function isAdminCodigo(codigo: string): boolean {
  return codigo.trim().toUpperCase() === ADMIN_CODIGO;
}

/**
 * DEV-ONLY: login sem senha. Garante o usuário no Auth (via edge function
 * `dev-ensure-user`) usando uma senha fixa de desenvolvimento, e em seguida
 * faz signIn. TODO: remover quando o backend tiver fluxo real de senha.
 */
export async function devSignInWithCodigo(
  codigoRaw: string,
): Promise<{ profile?: UserProfile; error?: string }> {
  const codigo = codigoRaw.trim();
  if (!codigo) return { error: 'Informe seu código.' };

  const { data, error } = await supabase.functions.invoke('dev-ensure-user', {
    body: { codigo },
  });
  if (error || !data?.ok) {
    return { error: (data as { error?: string } | null)?.error || error?.message || 'Não foi possível preparar o acesso.' };
  }
  const email = (data as { email: string }).email;
  const password = (data as { password: string }).password;

  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
  if (signInErr) return { error: signInErr.message };

  const profile = await fetchCurrentProfile();
  if (!profile) return { error: 'Conta autenticada, mas perfil não encontrado.' };
  return { profile };
}

/**
 * Login simples. NÃO cria contas — o consultor precisa usar o fluxo
 * "Primeiro acesso" antes (ver `firstAccessSignup`).
 */
export async function signInWithCodigo(
  codigoRaw: string,
  senha: string,
): Promise<{ profile?: UserProfile; error?: string }> {
  const codigo = codigoRaw.trim();
  if (!codigo) return { error: 'Informe seu código.' };
  if (!senha) return { error: 'Informe sua senha.' };

  const isAdmin = isAdminCodigo(codigo);
  const email = isAdmin ? `admin@${DOMAIN}` : codigoToEmail(codigo);

  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (signInErr) {
    if (isAdmin) return { error: 'Senha de administrador incorreta.' };
    return { error: 'Código ou senha incorretos. Se é seu 1º acesso, use o botão "Primeiro acesso".' };
  }

  const profile = await fetchCurrentProfile();
  if (!profile) return { error: 'Conta autenticada, mas perfil não encontrado.' };
  return { profile };
}

/**
 * Cria a conta do consultor no 1º acesso. O próprio consultor escolhe a senha,
 * portanto `must_change_password` já fica `false`.
 */
export async function firstAccessSignup(
  codigoRaw: string,
  novaSenha: string,
  manifestEntry: CarteiraManifestEntry | null,
): Promise<{ profile?: UserProfile; error?: string }> {
  const codigo = codigoRaw.trim();
  if (!codigo) return { error: 'Informe seu código Protheus.' };
  if (isAdminCodigo(codigo)) return { error: 'O administrador não usa o fluxo de primeiro acesso.' };
  if (!manifestEntry) return { error: `Código "${codigo}" não consta na base de consultores.` };
  if (!novaSenha || novaSenha.length < 8) return { error: 'A senha precisa ter ao menos 8 caracteres.' };

  const email = codigoToEmail(codigo);
  const { error: signUpErr } = await supabase.auth.signUp({
    email,
    password: novaSenha,
    options: {
      emailRedirectTo: window.location.origin,
      data: {
        cod_protheus: codigo.toUpperCase(),
        nome: manifestEntry.consultor,
        gestor: manifestEntry.gerente ?? null,
        arquivo_carteira: manifestEntry.arquivo ?? null,
        role: 'consultor',
        must_change_password: false,
      },
    },
  });
  if (signUpErr) {
    if (/already registered|already exists/i.test(signUpErr.message)) {
      return { error: 'Já existe uma conta para este código. Faça login normalmente ou use "Esqueci a senha".' };
    }
    return { error: signUpErr.message };
  }
  // Tenta logar imediatamente
  const r2 = await supabase.auth.signInWithPassword({ email, password: novaSenha });
  if (r2.error) return { error: r2.error.message };
  const profile = await fetchCurrentProfile();
  if (!profile) return { error: 'Conta criada, mas perfil não encontrado.' };
  return { profile };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function fetchCurrentProfile(): Promise<UserProfile | null> {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) return null;
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('user_roles').select('role').eq('user_id', user.id),
  ]);
  if (!profile) return null;
  const role: AppRole = roles?.some(r => r.role === 'admin') ? 'admin' : 'consultor';
  return {
    id: profile.id,
    cod_protheus: profile.cod_protheus,
    nome: profile.nome,
    gestor: profile.gestor,
    arquivo_carteira: profile.arquivo_carteira,
    must_change_password: profile.must_change_password,
    role,
  };
}

export async function changeOwnPassword(novaSenha: string): Promise<{ error?: string }> {
  if (!novaSenha || novaSenha.length < 8) return { error: 'A senha precisa ter ao menos 8 caracteres.' };
  const { error } = await supabase.auth.updateUser({ password: novaSenha });
  if (error) return { error: error.message };
  const { data: userRes } = await supabase.auth.getUser();
  if (userRes.user) {
    await supabase.from('profiles').update({ must_change_password: false }).eq('id', userRes.user.id);
  }
  return {};
}