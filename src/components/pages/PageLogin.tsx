import { useState } from 'react';
import logo from '@/assets/ebsa_logo.png';
import { useCarteiraManifest } from '@/hooks/useCarteiraManifest';
import { signInWithCodigo, isAdminCodigo, DEFAULT_CONSULTOR_PASSWORD } from '@/lib/auth';
import { prefetchCarteira } from '@/hooks/useCarteira';
import { Eye, EyeOff } from 'lucide-react';

interface Props {
  onLoggedIn: () => void;
  onForgot: () => void;
}

export default function PageLogin({ onLoggedIn, onForgot }: Props) {
  const { findByCodigo, loading: manifestLoading } = useCarteiraManifest();
  const [codigo, setCodigo] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSubmitting(true);
    const codTrim = codigo.trim();
    const entry = isAdminCodigo(codTrim) ? null : findByCodigo(codTrim);
    const { profile, error } = await signInWithCodigo(codTrim, senha, entry);
    setSubmitting(false);
    if (error || !profile) { setErro(error || 'Falha no login.'); return; }
    if (entry?.arquivo) prefetchCarteira(entry.arquivo);
    onLoggedIn();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 sm:gap-8 px-4">
      <img src={logo} alt="Editora do Brasil" className="h-16 sm:h-24 object-contain" />
      <div className="text-center">
        <h1 className="page-title text-2xl sm:text-3xl">Portal do Consultor Comercial</h1>
        <p className="page-subtitle mt-1 sm:mt-2 text-sm">Faça login para acessar sua carteira</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
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
            disabled={submitting || manifestLoading}
            className="w-full px-4 py-3 rounded-xl border bg-card text-foreground text-base font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="login-pass" className="block text-sm font-semibold mb-1.5" style={{ color: 'hsl(var(--navy))' }}>
            Senha
          </label>
          <div className="relative">
            <input
              id="login-pass"
              type={showSenha ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Sua senha"
              value={senha}
              onChange={e => { setSenha(e.target.value); setErro(''); }}
              disabled={submitting}
              className="w-full px-4 py-3 pr-12 rounded-xl border bg-card text-foreground text-base font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowSenha(v => !v)}
              aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            1º acesso de consultor: senha padrão é <code className="px-1 rounded bg-muted">{DEFAULT_CONSULTOR_PASSWORD}</code>.
          </p>
        </div>

        {erro && (
          <div role="alert" className="p-3 rounded-lg text-sm border" style={{ background: 'hsl(0,84%,95%)', color: 'hsl(0,84%,40%)', borderColor: 'hsl(0,84%,85%)' }}>
            {erro}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || manifestLoading}
          className="w-full py-3.5 rounded-xl font-semibold text-base text-primary-foreground bg-primary hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition disabled:opacity-50"
        >
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>

        <button
          type="button"
          onClick={onForgot}
          className="w-full text-sm text-center underline text-muted-foreground hover:text-foreground"
        >
          Esqueci a senha
        </button>
      </form>
    </div>
  );
}
