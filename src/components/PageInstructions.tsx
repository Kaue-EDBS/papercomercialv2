import { useEffect, useState } from 'react';
import { HelpCircle, X, Info } from 'lucide-react';
import { AppPage } from '@/lib/types';

interface PageInstructionsProps {
  page: AppPage;
  title: string;
  body: React.ReactNode;
}

const STORAGE_KEY = 'page-instructions:hidden:v1';

function readHidden(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch { return new Set(); }
}
function writeHidden(s: Set<string>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(s))); } catch { /* noop */ }
}

/**
 * Caixa de instrução por página da apresentação.
 * Aparece automaticamente nos primeiros acessos. Usuário pode fechar e marcar
 * "Não mostrar de novo nesta página". Sempre fica disponível um botão flutuante
 * "?" no canto para reabrir quando precisar.
 */
export default function PageInstructions({ page, title, body }: PageInstructionsProps) {
  const [open, setOpen] = useState(false);
  const [dontShow, setDontShow] = useState(false);

  useEffect(() => {
    const hidden = readHidden();
    setOpen(!hidden.has(page));
    setDontShow(false);
  }, [page]);

  const close = () => {
    if (dontShow) {
      const hidden = readHidden();
      hidden.add(page);
      writeHidden(hidden);
    }
    setOpen(false);
  };

  const reopen = () => setOpen(true);

  return (
    <>
      {/* Botão flutuante para reabrir as instruções */}
      {!open && (
        <button
          type="button"
          onClick={reopen}
          aria-label="Mostrar instruções desta página"
          title="Mostrar instruções desta página"
          className="fixed bottom-4 right-4 z-30 w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: 'hsl(var(--teal))', color: 'white' }}
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      )}

      {/* Caixa de instruções */}
      {open && (
        <div
          className="fixed bottom-4 right-4 z-30 w-[min(380px,calc(100vw-2rem))] rounded-2xl border-2 shadow-xl bg-card overflow-hidden animate-in fade-in slide-in-from-bottom-2"
          style={{ borderColor: 'hsl(var(--teal))' }}
          role="region"
          aria-label={`Instruções: ${title}`}
        >
          <div
            className="flex items-center justify-between px-4 py-2.5 gap-2"
            style={{ background: 'hsl(var(--teal-light))' }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Info className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--teal))' }} />
              <h3 className="text-sm font-bold truncate" style={{ color: 'hsl(var(--navy))' }}>
                {title}
              </h3>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Fechar instruções"
              className="p-1 rounded-md hover:bg-card focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-4 py-3 text-sm text-foreground space-y-2 max-h-[40vh] overflow-y-auto">
            {body}
          </div>
          <div className="px-4 py-2.5 border-t flex items-center justify-between gap-2 bg-card">
            <label className="flex items-center gap-2 text-xs cursor-pointer select-none text-muted-foreground">
              <input
                type="checkbox"
                checked={dontShow}
                onChange={e => setDontShow(e.target.checked)}
                className="w-3.5 h-3.5 rounded"
                style={{ accentColor: 'hsl(var(--teal))' }}
              />
              Não mostrar nesta página
            </label>
            <button
              type="button"
              onClick={close}
              className="px-3 py-1.5 rounded-md text-xs font-semibold text-white hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
              style={{ background: 'hsl(var(--teal))' }}
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/** Conteúdos por página, em linguagem simples. */
export const PAGE_INSTRUCTIONS: Record<string, { title: string; body: React.ReactNode }> = {
  abertura: {
    title: 'Abertura',
    body: (
      <>
        <p>Esta é a <strong>capa da apresentação</strong>: identifica a escola analisada e o tipo do paper (prospecção ou renovação).</p>
        <p>Use para abrir a conversa com o gestor da escola e mostrar que o material foi feito sob medida.</p>
      </>
    ),
  },
  resumo: {
    title: 'Resumo Executivo',
    body: (
      <>
        <p>Visão rápida em uma página: <strong>quem é a escola, onde fica, porte e principais indicadores</strong>.</p>
        <p>Ideal para abrir a conversa antes de entrar nos detalhes. Se o gestor tiver pouco tempo, este resumo já entrega o essencial.</p>
      </>
    ),
  },
  panorama: {
    title: 'Panorama',
    body: (
      <>
        <p>Mostra o <strong>cenário da área de influência</strong> da escola: total de escolas no raio definido, distribuição entre rede pública e particular, e densidade escolar.</p>
        <p>Serve para entender quanta concorrência e quanta oportunidade existem dentro da região que a escola realmente atende.</p>
      </>
    ),
  },
  concorrencia: {
    title: 'Concorrência',
    body: (
      <>
        <p>Lista as <strong>escolas concorrentes</strong> mais próximas, dentro do raio operacional definido na Etapa 2.</p>
        <p>Use para mostrar quem disputa o mesmo público e como a escola se posiciona frente a elas.</p>
      </>
    ),
  },
  marketshare: {
    title: 'Market Share',
    body: (
      <>
        <p>Mostra a <strong>participação da escola no mercado local</strong>, por segmento (Educação Infantil, Fundamental, Médio).</p>
        <p>Ajuda a identificar onde a escola é forte e onde há espaço para crescer.</p>
      </>
    ),
  },
  mensalidade: {
    title: 'Mensalidade',
    body: (
      <>
        <p>Compara a <strong>faixa de mensalidade da escola</strong> com a média dos concorrentes na região.</p>
        <p>Útil para discutir posicionamento de preço e percepção de valor.</p>
      </>
    ),
  },
  socioeconomico: {
    title: 'Socioeconômico',
    body: (
      <>
        <p>Apresenta o <strong>perfil socioeconômico da região</strong>: renda média, faixa etária, IDH.</p>
        <p>Mostra ao gestor o tipo de público que vive ao redor da escola — base para decisões pedagógicas e comerciais.</p>
      </>
    ),
  },
  insights: {
    title: 'Insights',
    body: (
      <>
        <p>Reúne os <strong>principais aprendizados</strong> da análise: oportunidades, alertas e recomendações práticas.</p>
        <p>Use para fechar a conversa propondo próximos passos com a escola.</p>
      </>
    ),
  },
  encerramento: {
    title: 'Encerramento',
    body: (
      <>
        <p>Mensagem final da apresentação e <strong>botões para exportar em PDF ou PowerPoint</strong>.</p>
        <p>Os arquivos saem prontos para enviar ao gestor da escola.</p>
      </>
    ),
  },
};
