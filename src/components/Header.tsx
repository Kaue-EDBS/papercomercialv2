import logo from '@/assets/ebsa_logo.png';

export default function Header() {
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-2 sm:py-3 border-b" style={{ background: 'hsl(var(--navy))' }}>
      <img src={logo} alt="Editora do Brasil" className="h-8 sm:h-10 object-contain" />
      <span className="text-[10px] sm:text-xs font-medium hidden sm:inline" style={{ color: 'hsl(var(--teal-light))' }}>
        Diagnóstico Territorial — Análise Comercial
      </span>
      <span className="text-[10px] font-medium sm:hidden" style={{ color: 'hsl(var(--teal-light))' }}>
        Diagnóstico Territorial
      </span>
    </header>
  );
}
