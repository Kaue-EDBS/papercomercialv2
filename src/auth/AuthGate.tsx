import { useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';

const DOMINIOS_PERMITIDOS = ['editoradobrasil.com.br', 'editoradobrasil1.onmicrosoft.com'];

const dominioValido = (email?: string | null) => {
  if (!email) return false;
  const dominio = email.split('@')[1]?.toLowerCase();
  return !!dominio && DOMINIOS_PERMITIDOS.includes(dominio);
};

export const AuthGate = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [bloqueado, setBloqueado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      if (novaSessao && !dominioValido(novaSessao.user.email)) {
        setBloqueado(true);
        setSession(null);
        setTimeout(() => {
          void supabase.auth.signOut();
        }, 0);
        return;
      }
      setBloqueado(false);
      setSession(novaSessao);
    });

    supabase.auth.getSession().then(({ data }) => {
      const atual = data.session;
      if (atual && !dominioValido(atual.user.email)) {
        setBloqueado(true);
        void supabase.auth.signOut();
      } else {
        setSession(atual);
      }
      setCarregando(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const entrar = async () => {
    setErro(null);
    setEntrando(true);
    const resultado = await lovable.auth.signInWithOAuth('microsoft', {
      redirect_uri: window.location.origin,
    });
    if (resultado.error) {
      setErro('Nao foi possivel iniciar o acesso pela conta Microsoft. Tente novamente.');
      setEntrando(false);
      return;
    }
    if (resultado.redirected) return;
    setEntrando(false);
  };

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <p>Verificando acesso...</p>
      </main>
    );
  }

  if (session) return <>{children}</>;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <section className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">CIT</p>
        <h1 className="mt-2 text-2xl font-bold text-foreground">Centro de Inteligencia Territorial</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Acesso exclusivo para colaboradores da Editora do Brasil.
        </p>

        {bloqueado && (
          <div className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            Acesso nao autorizado. Entre com sua conta corporativa da Editora do Brasil.
          </div>
        )}

        {erro && (
          <div className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {erro}
          </div>
        )}

        <button
          onClick={entrar}
          disabled={entrando}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          <svg viewBox="0 0 23 23" className="h-5 w-5" aria-hidden="true">
            <rect x="1" y="1" width="10" height="10" fill="#F25022" />
            <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
            <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
            <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
          </svg>
          {entrando ? 'Abrindo Microsoft...' : 'Entrar com conta Microsoft'}
        </button>

      </section>
    </main>
  );
};

export default AuthGate;
