import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchCurrentProfile, UserProfile } from '@/lib/auth';

/**
 * Hook central de auth — escuta onAuthStateChange e mantém o perfil atual.
 * Padrão Lovable: registra o listener PRIMEIRO, depois chama getSession.
 */
export function useAuth() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const p = await fetchCurrentProfile();
    setProfile(p);
    return p;
  }, []);

  useEffect(() => {
    let mounted = true;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (!session) { setProfile(null); return; }
      // defer chamadas Supabase para fora do callback de auth
      setTimeout(() => { fetchCurrentProfile().then(p => mounted && setProfile(p)); }, 0);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) fetchCurrentProfile().then(p => { if (mounted) { setProfile(p); setLoading(false); } });
      else setLoading(false);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  return { profile, loading, refreshProfile, setProfile };
}