import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Menu, X, LogOut } from "lucide-react";
import { slides } from "./slides-data";

export function Presentation() {
  const [index, setIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ended, setEnded] = useState(false);

  const total = slides.length;
  const current = slides[index];

  const next = useCallback(() => setIndex((i) => Math.min(total - 1, i + 1)), [total]);
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (ended) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") next();
      if (e.key === "ArrowLeft" || e.key === "PageUp") prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, ended]);

  if (ended) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="text-center max-w-md">
          <h2 className="text-3xl font-bold text-navy-deep">Apresentação encerrada</h2>
          <p className="mt-3 text-navy-soft">Obrigado pela atenção da diretoria.</p>
          <button
            onClick={() => { setEnded(false); setIndex(0); }}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-navy text-white px-6 py-3 text-sm font-medium hover:bg-navy-deep transition-colors"
          >
            Reiniciar apresentação
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-navy-deep flex">
      <aside
        className={`fixed lg:sticky top-0 left-0 z-30 h-screen w-72 shrink-0 border-r border-gray-line bg-white transition-transform duration-300 ${
          menuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="px-6 py-6 border-b border-gray-line flex items-center justify-between">
            <div>
              <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-turquoise">
                Editora do Brasil
              </div>
              <div className="mt-1 text-sm font-semibold text-navy-deep leading-tight">
                Projeto PNLD<br />Matriz Comparativa
              </div>
            </div>
            <button onClick={() => setMenuOpen(false)} className="lg:hidden p-1 text-navy-soft" aria-label="Fechar menu">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto ic-scrollbar-thin py-3">
            {slides.map((s, i) => {
              const active = i === index;
              return (
                <button
                  key={s.id}
                  onClick={() => { setIndex(i); setMenuOpen(false); }}
                  className={`w-full text-left px-6 py-2.5 flex items-center gap-3 group transition-colors ${
                    active ? "bg-gray-soft" : "hover:bg-gray-soft/60"
                  }`}
                >
                  <span className={`tabular-nums text-[11px] font-semibold w-6 ${active ? "text-lime-deep" : "text-navy-soft/60"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={`text-sm leading-snug ${active ? "text-navy-deep font-semibold" : "text-navy-soft group-hover:text-navy-deep"}`}>
                    {s.title}
                  </span>
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-lime" />}
                </button>
              );
            })}
          </nav>
          <div className="px-6 py-4 border-t border-gray-line text-[11px] text-navy-soft">
            Use as setas ← → para navegar
          </div>
        </div>
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-20 bg-navy-deep/30 lg:hidden" onClick={() => setMenuOpen(false)} />
      )}

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-10 bg-white/85 backdrop-blur border-b border-gray-line">
          <div className="flex items-center justify-between px-5 lg:px-10 py-3.5">
            <div className="flex items-center gap-3">
              <button onClick={() => setMenuOpen(true)} className="lg:hidden p-2 -ml-2 text-navy" aria-label="Abrir menu">
                <Menu className="h-5 w-5" />
              </button>
              <div className="text-xs font-medium text-navy-soft tabular-nums">
                Seção <span className="text-navy-deep font-semibold">{index + 1}</span> de {total}
              </div>
              <div className="hidden sm:block h-4 w-px bg-gray-line" />
              <div className="hidden sm:block text-sm font-medium text-navy-deep truncate max-w-[40ch]">
                {current.title}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={prev}
                disabled={index === 0}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-line text-navy px-3.5 py-1.5 text-sm font-medium hover:bg-gray-soft disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Anterior
              </button>
              {index < total - 1 ? (
                <button
                  onClick={next}
                  className="inline-flex items-center gap-1.5 rounded-full bg-navy text-white px-4 py-1.5 text-sm font-medium hover:bg-navy-deep transition-colors"
                >
                  Próximo <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => setEnded(true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-lime text-navy-deep px-4 py-1.5 text-sm font-semibold hover:bg-lime-deep transition-colors"
                >
                  Encerrar <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="h-0.5 bg-gray-line">
            <div className="h-full bg-lime transition-all duration-300" style={{ width: `${((index + 1) / total) * 100}%` }} />
          </div>
        </header>

        <section key={current.id} className="flex-1 px-6 lg:px-14 py-10 lg:py-14 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="max-w-7xl mx-auto">{current.render()}</div>
        </section>

        <footer className="px-6 lg:px-14 py-4 border-t border-gray-line flex items-center justify-between text-[11px] text-navy-soft">
          <span>Apresentação executiva · Diretoria</span>
          <span>Editora do Brasil — PNLD</span>
        </footer>
      </main>
    </div>
  );
}