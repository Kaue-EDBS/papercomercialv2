import { Navigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageAdmin from '@/components/pages/PageAdmin';
import PageLogin from '@/components/pages/PageLogin';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/auth';
import { useMemo } from 'react';
import { ConsultorSession } from '@/lib/types';

/**
 * Rota dedicada do painel administrativo: /admin
 * - Não logado → mostra a tela de login.
 * - Logado como consultor → redireciona para a home.
 * - Logado como admin → renderiza o painel.
 */
export default function AdminRoute() {
  const { profile, loading } = useAuth();

  const session: ConsultorSession | null = useMemo(() => {
    if (!profile) return null;
    return { codigo: profile.cod_protheus, nome: profile.nome, gestor: profile.gestor ?? '' };
  }, [profile]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-10 h-10 border-4 rounded-full" style={{ borderColor: 'hsl(var(--teal-light))', borderTopColor: 'hsl(var(--teal))' }} />
        </div>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1"><PageLogin onLogin={() => { /* useAuth atualiza sozinho */ }} onForgotPassword={() => {}} /></main>
        <Footer />
      </div>
    );
  }

  if (profile.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header session={session} onLogout={async () => { await signOut(); }} />
      <main className="flex-1"><PageAdmin /></main>
      <Footer />
    </div>
  );
}