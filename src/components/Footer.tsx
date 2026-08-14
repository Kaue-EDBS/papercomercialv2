import logo from '@/assets/ebsa_logo.png';

export default function Footer() {
  return (
    <footer className="flex items-center justify-between px-4 sm:px-6 py-2 sm:py-3 border-t bg-card">
      <span className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
        © {new Date().getFullYear()} Editora do Brasil S/A
        <span className="hidden sm:inline"> — CIT - Centro de Inteligência Territorial — Dados: Censo Escolar 2024</span>
      </span>
      <img
        src={logo}
        alt="Editora do Brasil"
        className="h-6 sm:h-8 object-contain brightness-0 invert"
        style={{ filter: 'brightness(0) invert(1)' }}
      />
    </footer>
  );
}
