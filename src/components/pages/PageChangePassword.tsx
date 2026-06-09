import { useState } from 'react';
import logo from '@/assets/ebsa_logo.png';
import { changeOwnPassword } from '@/lib/auth';

interface Props {
  obrigatoria?: boolean;
  onDone: () => void;
  onSkip?: () => void;
}

/**
 * Tela de troca de senha. Quando `obrigatoria=true` (1º acesso), não exibe o botão Pular.
 */
export default function PageChangePassword({ obrigatoria = false, onDone, onSkip }: Props) {
  const [s1, setS1] = useState('');
  const [s2, setS2] = useState('');
  const [erro, setErro] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (s1 !== s2) { setErro('As senhas digitadas não são iguais.'); return; }
    setSubmitting(true);
    const { error } = await changeOwnPassword(s1);
    setSubmitting(false);
    if (error) { setErro(error); return; }
    onDone();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-4">
      <img src={logo} alt="Editora do Brasil" className="h-16 sm:h-20 object-contain" />
      <div className="text-center max-w-md">
        <h1 className="page-title text-2xl">{obrigatoria ? 'Defina sua nova senha' : 'Alterar senha'}</h1>
        <p className="page-subtitle text-sm mt-1">
          {obrigatoria
            ? 'Este é seu primeiro acesso. Para sua segurança, crie uma senha pessoal antes de continuar.'
            : 'Escolha uma nova senha para sua conta.'}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <div>
          <label htmlFor="np1" className="block text-sm font-semibold mb-1.5" style={{ color: 'hsl(var(--navy))' }}>Nova senha</label>
          <input id="np1" type="password" autoComplete="new-password" value={s1} onChange={e => { setS1(e.target.value); setErro(''); }}
            className="w-full px-4 py-3 rounded-xl border bg-card text-foreground text-base focus-visible:ring-2 focus-visible:ring-primary" />
        </div>
        <div>
          <label htmlFor="np2" className="block text-sm font-semibold mb-1.5" style={{ color: 'hsl(var(--navy))' }}>Confirme a nova senha</label>
          <input id="np2" type="password" autoComplete="new-password" value={s2} onChange={e => { setS2(e.target.value); setErro(''); }}
            className="w-full px-4 py-3 rounded-xl border bg-card text-foreground text-base focus-visible:ring-2 focus-visible:ring-primary" />
          <p className="text-xs text-muted-foreground mt-1.5">Mínimo de 8 caracteres. Não use a senha padrão.</p>
        </div>
        {erro && (
          <div role="alert" className="p-3 rounded-lg text-sm border" style={{ background: 'hsl(0,84%,95%)', color: 'hsl(0,84%,40%)', borderColor: 'hsl(0,84%,85%)' }}>{erro}</div>
        )}
        <button type="submit" disabled={submitting}
          className="w-full py-3.5 rounded-xl font-semibold text-base text-primary-foreground bg-primary hover:opacity-90 disabled:opacity-50 transition">
          {submitting ? 'Salvando…' : 'Salvar nova senha'}
        </button>
        {!obrigatoria && onSkip && (
          <button type="button" onClick={onSkip} className="w-full text-sm text-center underline text-muted-foreground hover:text-foreground">
            Cancelar
          </button>
        )}
      </form>
    </div>
  );
}