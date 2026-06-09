import logo from '@/assets/ebsa_logo.png';
import { DEFAULT_CONSULTOR_PASSWORD } from '@/lib/auth';

interface Props { onBack: () => void; }

/**
 * Como as contas usam e-mails fictícios `{cod}@ebsa.local`, não há fluxo de
 * reset por e-mail automático. Esta tela orienta o consultor a contatar o
 * administrador, que pode redefinir a senha pela área administrativa.
 */
export default function PageForgotPassword({ onBack }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-4 text-center">
      <img src={logo} alt="Editora do Brasil" className="h-14 object-contain" />
      <div className="max-w-md space-y-3">
        <h1 className="page-title text-2xl">Esqueci minha senha</h1>
        <p className="text-sm text-muted-foreground">
          Para recuperar o acesso, fale com o administrador da ferramenta. Ele pode redefinir sua senha de volta para a padrão{' '}
          <code className="px-1 rounded bg-muted">{DEFAULT_CONSULTOR_PASSWORD}</code> — no próximo login você cria uma nova senha pessoal.
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