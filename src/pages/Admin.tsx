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
  // ⚠️ TEMP: autenticação desativada para liberar o painel de cadastros enquanto
  // o backend é estruturado. Reabilitar quando o fluxo de senha estiver pronto.
  const { profile } = useAuth();
  const session: ConsultorSession | null = useMemo(() => {
    if (!profile) return { codigo: 'ADMIN', nome: 'Administrador', gestor: '' };
    return { codigo: profile.cod_protheus, nome: profile.nome, gestor: profile.gestor ?? '' };
  }, [profile]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header session={session} onLogout={async () => { await signOut(); }} />
      <main className="flex-1"><PageAdmin /></main>
      <Footer />
    </div>
  );
}