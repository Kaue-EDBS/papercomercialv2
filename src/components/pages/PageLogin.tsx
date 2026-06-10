import { useState } from 'react';
import logo from '@/assets/ebsa_logo.png';
import { devSignInWithCodigo } from '@/lib/auth';
import { prefetchCarteira } from '@/hooks/useCarteira';

interface Props {
  onLoggedIn: () => void;
  onForgot: () => void;
}

export default function PageLogin({ onLoggedIn }: Props) {
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(''); setSubmitting(true);
    const { profile, error } = await devSignInWithCodigo(codigo.trim());
    setSubmitting(false);
    if (error || !profile) { setErro(error || 'Falha no login.'); return; }
    if (profile.arquivo_carteira) prefetchCarteira(profile.arquivo_carteira);
    onLoggedIn();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 sm:gap-8 px-4">
      <img src={logo} alt="Editora do Brasil" className="h-16 sm:h-24 object-contain" />
      <div className="text-center">
        <h1 className="page-title text-2xl sm:text-3xl">Portal do Consultor Comercial</h1>
        <p className="page-subtitle mt-1 sm:mt-2 text-sm">
          Acesso temporário sem senha — informe apenas o código
        </p>
      </div>

      <form onSubmit={handleLogin} className="w-full max-w-md space-y-4">
        <div>
          <label htmlFor="login-user" className="block text-sm font-semibold mb-1.5" style={{ color: 'hsl(var(--navy))' }}>
            Usuário (Código Protheus)
          </label>
          <input
            id="login-user"
            type="text"
            autoComplete="username"
            placeholder="Ex.: 11882 ou ADMIN"
            value={codigo}
            onChange={e => { setCodigo(e.target.value); setErro(''); }}
            disabled={submitting}
            className="w-full px-4 py-3 rounded-xl border bg-card text-foreground text-base font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        {erro && (
          <div role="alert" className="p-3 rounded-lg text-sm border" style={{ background: 'hsl(0,84%,95%)', color: 'hsl(0,84%,40%)', borderColor: 'hsl(0,84%,85%)' }}>
            {erro}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 rounded-xl font-semibold text-base text-primary-foreground bg-primary hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition disabled:opacity-50"
        >
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <p className="text-xs text-muted-foreground text-center max-w-md">
        Autenticação por senha está temporariamente desativada para acelerar o desenvolvimento.
      </p>
    </div>
  );
}