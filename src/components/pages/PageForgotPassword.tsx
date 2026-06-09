import logo from '@/assets/ebsa_logo.png';

interface Props { onBack: () => void; }

/**
 * Sem reset automático por e-mail (contas usam e-mails fictícios @ebsa.local).
 * Orientamos o consultor a falar com o administrador, que pode resetar pela tela admin.
 */
export default function PageForgotPassword({ onBack }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-4 text-center">
      <img src={logo} alt="Editora do Brasil" className="h-14 object-contain" />
      <div className="max-w-md space-y-3">
        <h1 className="page-title text-2xl">Esqueci minha senha</h1>
        <p className="text-sm text-muted-foreground">
          Para recuperar o acesso, fale com o administrador da ferramenta. Ele pode
          redefinir sua senha por uma nova temporária e você poderá alterá-la em seguida.
        </p>
        <p className="text-xs text-muted-foreground">
          Se você é o administrador e perdeu a senha, contate o time técnico responsável pelo deploy.
        </p>
      </div>
      <button onClick={onBack} className="px-6 py-3 rounded-xl font-semibold bg-primary text-primary-foreground hover:opacity-90 transition">
        Voltar ao login
      </button>
    </div>
  );
}