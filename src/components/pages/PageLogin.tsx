import { useState, useMemo } from 'react';
import logo from '@/assets/ebsa_logo.png';
import { ConsultorSession } from '@/lib/types';
import { useCarteiraManifest, CarteiraManifestEntry } from '@/hooks/useCarteiraManifest';
import { prefetchCarteira } from '@/hooks/useCarteira';

interface Props {
  onConfirm: (session: ConsultorSession) => void;
}

export default function PageLogin({ onConfirm }: Props) {
  const { consultores, loading, findByCodigo } = useCarteiraManifest();
  const [codigo, setCodigo] = useState('');
  const [focused, setFocused] = useState(false);
  const [erro, setErro] = useState('');

  const suggestions = useMemo(() => {
    if (!focused || codigo.length < 2) return [];
    const q = codigo.toLowerCase();
    return consultores
      .filter(c =>
        String(c.codConsultor).toLowerCase().includes(q) ||
        c.consultor.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [codigo, focused, consultores]);

  const handleConfirm = (cod?: string) => {
    setErro('');
    const value = (cod ?? codigo).trim();
    if (!value) { setErro('Digite seu código Protheus para continuar.'); return; }
    const c = findByCodigo(value);
    if (!c) {
      setErro(`Não encontramos o código "${value}" na base de consultores. Confira o número e tente novamente.`);
      return;
    }
    prefetchCarteira(c.arquivo);
    onConfirm({
      codigo: String(c.codConsultor).toUpperCase(),
      nome: c.consultor,
      gestor: c.gerente,
    });
  };

  const pickSuggestion = (c: CarteiraManifestEntry) => {
    const cod = String(c.codConsultor);
    setCodigo(cod);
    setFocused(false);
    prefetchCarteira(c.arquivo);
    onConfirm({
      codigo: cod.toUpperCase(),
      nome: c.consultor,
      gestor: c.gerente,
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 sm:gap-8 px-4">
      <img src={logo} alt="Editora do Brasil" className="h-16 sm:h-24 object-contain" />
      <div className="text-center">
        <h1 className="page-title text-2xl sm:text-3xl">CIT - Centro de Inteligência Territorial</h1>
        <p className="page-subtitle mt-1 sm:mt-2 text-sm">Acesse sua carteira ou inicie um diagnóstico territorial</p>
      </div>

      <div className="w-full max-w-md space-y-4">
        <div>
          <label htmlFor="cod-protheus" className="block text-sm font-semibold mb-1.5" style={{ color: 'hsl(var(--navy))' }}>
            Código Protheus
          </label>
          <div className="relative">
            <input
              id="cod-protheus"
              type="text"
              autoComplete="off"
              placeholder="Ex.: 11882"
              value={codigo}
              onChange={e => { setCodigo(e.target.value); setErro(''); }}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 200)}
              onKeyDown={e => e.key === 'Enter' && handleConfirm()}
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border bg-card text-foreground text-base sm:text-lg font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-describedby="cod-help"
            />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-xl shadow-lg z-10 max-h-72 overflow-y-auto">
                {suggestions.map(c => (
                  <button
                    key={c.consultor}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => pickSuggestion(c)}
                    className="w-full text-left px-4 py-2.5 hover:bg-teal-light text-sm border-b last:border-0"
                  >
                    <span className="font-semibold">{String(c.codConsultor)}</span>
                    <span className="text-muted-foreground ml-2">{c.consultor}</span>
                    <div className="text-[10px] text-muted-foreground">
                      {c.gerente && <>Gestor: {c.gerente} · </>}
                      {c.totalEscolas} escola{c.totalEscolas !== 1 ? 's' : ''}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <p id="cod-help" className="text-xs text-muted-foreground mt-1.5">
            Digite seu código ou comece a digitar seu nome para usar o autocompletar.
          </p>
        </div>

        {erro && (
          <div role="alert" className="p-3 rounded-lg text-sm border" style={{ background: 'hsl(0,84%,95%)', color: 'hsl(0,84%,40%)', borderColor: 'hsl(0,84%,85%)' }}>
            {erro}
          </div>
        )}

        <button
          onClick={() => handleConfirm()}
          disabled={loading}
          className="w-full py-3.5 rounded-xl font-semibold text-base text-primary-foreground bg-primary hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition disabled:opacity-50"
        >
          {loading ? 'Carregando...' : 'Confirmar'}
        </button>
      </div>
    </div>
  );
}
