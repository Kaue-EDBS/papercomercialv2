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

export const DEFAULT_CONSULTOR_PASSWORD = 'codprotheus123';
export const ADMIN_CODIGO = 'ADMIN';
const DOMAIN = 'ebsa.local';

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
 * Login. Para consultor, se a conta ainda não existir e a senha digitada for a default,
 * cria a conta automaticamente (cadastro sob demanda).
 * Retorna `{ profile }` em sucesso, ou `{ error }` em falha.
 */
export async function signInWithCodigo(
  codigoRaw: string,
  senha: string,
  manifestEntry: CarteiraManifestEntry | null,
): Promise<{ profile?: UserProfile; error?: string }> {
  const codigo = codigoRaw.trim();
  if (!codigo) return { error: 'Informe seu código.' };
  if (!senha) return { error: 'Informe sua senha.' };

  const isAdmin = isAdminCodigo(codigo);
  const email = isAdmin ? `admin@${DOMAIN}` : codigoToEmail(codigo);

  // Tentativa 1: login direto
  let { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (signInErr) {
    if (isAdmin) {
      return { error: 'Senha de administrador incorreta.' };
    }
    // Consultor: se senha digitada é a default e a conta não existe, criamos.
    if (senha === DEFAULT_CONSULTOR_PASSWORD) {
      if (!manifestEntry) {
        return { error: `Código "${codigo}" não consta na base de consultores.` };
      }
      const { error: signUpErr } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            cod_protheus: codigo.toUpperCase(),
            nome: manifestEntry.consultor,
            gestor: manifestEntry.gerente ?? null,
            arquivo_carteira: manifestEntry.arquivo ?? null,
            role: 'consultor',
            must_change_password: true,
          },
        },
      });
      if (signUpErr) return { error: signUpErr.message };
      // Após signUp, tenta logar de novo
      const r2 = await supabase.auth.signInWithPassword({ email, password: senha });
      if (r2.error) return { error: r2.error.message };
    } else {
      return { error: 'Código ou senha incorretos.' };
    }
  }

  const profile = await fetchCurrentProfile();
  if (!profile) return { error: 'Conta autenticada, mas perfil não encontrado.' };
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
  if (novaSenha === DEFAULT_CONSULTOR_PASSWORD) return { error: 'Escolha uma senha diferente da padrão.' };
  const { error } = await supabase.auth.updateUser({ password: novaSenha });
  if (error) return { error: error.message };
  const { data: userRes } = await supabase.auth.getUser();
  if (userRes.user) {
    await supabase.from('profiles').update({ must_change_password: false }).eq('id', userRes.user.id);
  }
  return {};
}