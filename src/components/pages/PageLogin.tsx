import { useState } from 'react';
import logo from '@/assets/ebsa_logo.png';
import { useCarteiraManifest } from '@/hooks/useCarteiraManifest';
import { signInWithCodigo, firstAccessSignup, isAdminCodigo } from '@/lib/auth';
import { prefetchCarteira } from '@/hooks/useCarteira';
import { Eye, EyeOff, UserPlus } from 'lucide-react';

interface Props {
  onLoggedIn: () => void;
  onForgot: () => void;
}

type Mode = 'login' | 'first';

export default function PageLogin({ onLoggedIn, onForgot }: Props) {
  const { findByCodigo, loading: manifestLoading } = useCarteiraManifest();
  const [mode, setMode] = useState<Mode>('login');
  const [codigo, setCodigo] = useState('');
  const [senha, setSenha] = useState('');
  const [senha2, setSenha2] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => { setSenha(''); setSenha2(''); setErro(''); setShowSenha(false); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(''); setSubmitting(true);
    const { profile, error } = await signInWithCodigo(codigo.trim(), senha);
    setSubmitting(false);
    if (error || !profile) { setErro(error || 'Falha no login.'); return; }
    if (profile.arquivo_carteira) prefetchCarteira(profile.arquivo_carteira);
    onLoggedIn();
  };

  const handleFirstAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (senha !== senha2) { setErro('As senhas digitadas não são iguais.'); return; }
    setSubmitting(true);
    const cod = codigo.trim();
    const entry = isAdminCodigo(cod) ? null : findByCodigo(cod);
    const { profile, error } = await firstAccessSignup(cod, senha, entry);
    setSubmitting(false);
    if (error || !profile) { setErro(error || 'Falha ao criar conta.'); return; }
    if (profile.arquivo_carteira) prefetchCarteira(profile.arquivo_carteira);
    onLoggedIn();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 sm:gap-8 px-4">
      <img src={logo} alt="Editora do Brasil" className="h-16 sm:h-24 object-contain" />
      <div className="text-center">
        <h1 className="page-title text-2xl sm:text-3xl">Portal do Consultor Comercial</h1>
        <p className="page-subtitle mt-1 sm:mt-2 text-sm">
          {mode === 'login' ? 'Faça login para acessar sua carteira' : 'Crie sua conta — primeiro acesso'}
        </p>
      </div>

      <form onSubmit={mode === 'login' ? handleLogin : handleFirstAccess} className="w-full max-w-md space-y-4">
        <div>
          <label htmlFor="login-user" className="block text-sm font-semibold mb-1.5" style={{ color: 'hsl(var(--navy))' }}>
            Usuário (Código Protheus)
          </label>
          <input
            id="login-user"
            type="text"
            autoComplete="username"
            placeholder={mode === 'login' ? 'Ex.: 11882 ou ADMIN' : 'Seu código Protheus'}
            value={codigo}
            onChange={e => { setCodigo(e.target.value); setErro(''); }}
            disabled={submitting || manifestLoading}
            className="w-full px-4 py-3 rounded-xl border bg-card text-foreground text-base font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="login-pass" className="block text-sm font-semibold mb-1.5" style={{ color: 'hsl(var(--navy))' }}>
            {mode === 'login' ? 'Senha' : 'Nova senha'}
          </label>
          <div className="relative">
            <input
              id="login-pass"
              type={showSenha ? 'text' : 'password'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder={mode === 'login' ? 'Sua senha' : 'Mínimo 8 caracteres'}
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
        </div>

        {mode === 'first' && (
          <div>
            <label htmlFor="login-pass2" className="block text-sm font-semibold mb-1.5" style={{ color: 'hsl(var(--navy))' }}>
              Confirme a nova senha
            </label>
            <input
              id="login-pass2"
              type={showSenha ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repita a senha"
              value={senha2}
              onChange={e => { setSenha2(e.target.value); setErro(''); }}
              disabled={submitting}
              className="w-full px-4 py-3 rounded-xl border bg-card text-foreground text-base font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        )}

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
          {submitting ? (mode === 'login' ? 'Entrando…' : 'Criando conta…') : (mode === 'login' ? 'Entrar' : 'Criar conta e entrar')}
        </button>

        {mode === 'login' ? (
          <>
            <button
              type="button"
              onClick={() => { setMode('first'); reset(); }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border-2 hover:bg-accent transition"
              style={{ borderColor: 'hsl(var(--primary))', color: 'hsl(var(--primary))' }}
            >
              <UserPlus className="w-4 h-4" /> Primeiro acesso
            </button>
            <button
              type="button"
              onClick={onForgot}
              className="w-full text-sm text-center underline text-muted-foreground hover:text-foreground"
            >
              Esqueci a senha
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => { setMode('login'); reset(); }}
            className="w-full text-sm text-center underline text-muted-foreground hover:text-foreground"
          >
            Já tenho conta — voltar ao login
          </button>
        )}
      </form>
    </div>
  );
}