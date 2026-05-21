import type { ReactNode } from "react";
import {
  Target, Dna, MessageSquareQuote, Users, GraduationCap,
  Building2, Landmark, CheckCircle2, ExternalLink, Sparkles, ShieldCheck,
  BarChart3,
} from "lucide-react";

export type Slide = {
  id: string;
  title: string;
  subtitle?: string;
  render: () => ReactNode;
};

const APP_URL = "https://matrizpnld.lovable.app";
const DEMO_URL = `${APP_URL}/matriz/223/7`;

const Kicker = ({ children }: { children: ReactNode }) => (
  <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-turquoise">
    <span className="h-px w-8 bg-turquoise" />
    {children}
  </div>
);

const SectionHeader = ({
  kicker, title, lead,
}: { kicker?: string; title: string; lead?: string }) => (
  <div className="max-w-4xl">
    {kicker && <Kicker>{kicker}</Kicker>}
    <h1 className="mt-4 text-4xl md:text-5xl lg:text-[3.4rem] font-bold tracking-tight text-navy-deep leading-[1.05] ic-text-balance">
      {title}
    </h1>
    {lead && (
      <p className="mt-5 text-lg md:text-xl text-navy-soft leading-relaxed max-w-3xl ic-text-balance">
        {lead}
      </p>
    )}
  </div>
);

const Card = ({
  icon: Icon, title, children, accent,
}: { icon?: any; title: string; children: ReactNode; accent?: "lime" | "turquoise" }) => (
  <div className="group relative rounded-2xl bg-gray-soft border border-gray-line p-6 transition-all hover:border-turquoise hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_rgba(20,40,90,0.18)]">
    {Icon && (
      <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${
        accent === "lime" ? "bg-lime text-navy-deep" : "bg-white text-turquoise border border-turquoise-soft"
      }`}>
        <Icon className="h-5 w-5" />
      </div>
    )}
    <h3 className="text-base font-semibold text-navy-deep">{title}</h3>
    <p className="mt-2 text-sm leading-relaxed text-navy-soft">{children}</p>
  </div>
);

const Pill = ({ children, tone = "navy" }: { children: ReactNode; tone?: "navy" | "lime" | "turquoise" }) => {
  const tones = {
    navy: "bg-navy text-white",
    lime: "bg-lime text-navy-deep",
    turquoise: "bg-turquoise-soft text-navy-deep border border-turquoise",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
};

const Quote = ({ children }: { children: ReactNode }) => (
  <div className="relative rounded-2xl ic-gradient-navy p-8 md:p-10 text-white overflow-hidden">
    <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-lime/20 blur-3xl" />
    <div className="absolute bottom-0 left-0 h-1 w-24 bg-lime" />
    <p className="relative text-xl md:text-2xl font-medium leading-snug ic-text-balance">
      <span className="text-lime mr-2">"</span>{children}<span className="text-lime ml-1">"</span>
    </p>
  </div>
);

export const slides: Slide[] = [
  {
    id: "abertura",
    title: "Abertura",
    render: () => (
      <div className="grid lg:grid-cols-5 gap-10 items-center">
        <div className="lg:col-span-3">
          <Kicker>Apresentação executiva — Diretoria</Kicker>
          <h1 className="mt-5 text-5xl lg:text-6xl font-bold tracking-tight text-navy-deep leading-[1.02] ic-text-balance">
            Projeto PNLD <span className="text-turquoise">—</span> Matriz Comparativa Inteligente
          </h1>
          <p className="mt-6 text-lg text-navy-soft leading-relaxed max-w-2xl ic-text-balance">
            Uma ferramenta que transforma evidências pedagógicas em argumentos comerciais
            claros, padronizados e defensáveis para a equipe da Editora do Brasil.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Pill tone="navy">PNLD Anos Iniciais</Pill>
            <Pill tone="turquoise">Editora do Brasil</Pill>
            <Pill tone="lime">Inteligência comercial</Pill>
          </div>
        </div>
        <div className="lg:col-span-2 grid grid-cols-2 gap-3">
          <Card icon={Target} title="Foco">Comparação obra a obra do PNLD.</Card>
          <Card icon={Dna} title="Base" accent="lime">DNA por obra a partir do PDF.</Card>
          <Card icon={MessageSquareQuote} title="Saída">Pitch, scores e matriz prontos.</Card>
          <Card icon={Users} title="Uso">Reuniões one-to-one com escolas.</Card>
        </div>
      </div>
    ),
  },
  {
    id: "o-que-e",
    title: "O que é o projeto",
    render: () => (
      <div className="space-y-8">
        <SectionHeader title="O que é o Projeto PNLD — Matriz Comparativa Inteligente?" />
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-5">
            <p className="text-base text-navy-soft leading-relaxed">
              É uma solução digital que analisa obras didáticas da Editora do Brasil e as
              compara com obras concorrentes do PNLD (FTD, SM e outras), sempre com base
              em evidências extraídas dos próprios materiais.
            </p>
            <p className="text-base text-navy-soft leading-relaxed">
              Cada obra recebe um <strong>DNA próprio</strong> — tese comercial, diferenciais,
              evidências de página e scores pedagógicos — que alimenta a geração automática
              de um pitch comercial específico para aquela comparação.
            </p>
            <div className="rounded-xl bg-gray-soft border-l-4 border-lime p-5">
              <p className="text-sm text-navy-deep leading-relaxed">
                Não é um relatório técnico isolado. É uma <strong>narrativa comercial</strong>{" "}
                rastreável, gerada a partir da leitura analítica de cada obra.
              </p>
            </div>
          </div>
          <Quote>
            Da leitura técnica da obra para uma apresentação comercial objetiva, segura
            e baseada em evidências.
          </Quote>
        </div>
      </div>
    ),
  },
  {
    id: "para-que-serve",
    title: "Para que serve",
    render: () => (
      <div className="space-y-8">
        <SectionHeader
          title="Para que serve a solução?"
          lead="Gerar uma apresentação comparativa pronta para uso comercial, mostrando por que uma obra da Editora do Brasil deve ser escolhida em relação à concorrente equivalente."
        />
        <div className="grid lg:grid-cols-2 gap-6">
          <ul className="space-y-3">
            {[
              "Comparar obra da Editora do Brasil com obra concorrente equivalente.",
              "Gerar pitch comercial pronto, específico para cada par de obras.",
              "Exibir scores pedagógicos e comerciais lado a lado.",
              "Evidenciar diferenciais com referência a página e seção do PDF.",
              "Padronizar o discurso comercial entre os consultores.",
              "Apoiar reuniões com escolas, coordenações e secretarias.",
            ].map((t) => (
              <li key={t} className="flex gap-3 items-start rounded-lg bg-white border border-gray-line px-4 py-3">
                <CheckCircle2 className="h-5 w-5 text-lime-deep shrink-0 mt-0.5" />
                <span className="text-sm text-navy-deep leading-relaxed">{t}</span>
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-1 gap-4">
            <Card icon={ShieldCheck} title="Argumento defensável" accent="lime">
              Cada afirmação no pitch tem evidência rastreável no PDF da obra.
            </Card>
            <Card icon={Sparkles} title="Diferenciação real">
              Obras diferentes geram pitches diferentes — nada de texto genérico.
            </Card>
            <Card icon={BarChart3} title="Comparação estruturada">
              5 dimensões avaliadas em escala 1–5: pedagógico, usabilidade docente,
              experiência do estudante, comercial e vantagem competitiva.
            </Card>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "publico",
    title: "Público-alvo",
    render: () => (
      <div className="space-y-8">
        <SectionHeader title="Quem usa e quem se beneficia?" />
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-navy text-white p-7">
            <Pill tone="lime">Usuário direto</Pill>
            <h3 className="mt-4 text-2xl font-bold">Consultor comercial</h3>
            <p className="mt-3 text-white/80 text-sm leading-relaxed">
              Principal usuário da ferramenta. Seleciona as obras, gera a comparação
              e leva a apresentação pronta para reuniões one-to-one.
            </p>
          </div>
          <div className="rounded-2xl bg-gray-soft border border-gray-line p-7">
            <Pill tone="turquoise">Público da apresentação</Pill>
            <h3 className="mt-4 text-2xl font-bold text-navy-deep">Cliente educacional</h3>
            <p className="mt-3 text-navy-soft text-sm leading-relaxed">
              Coordenações pedagógicas, direções escolares, equipes técnicas de
              secretarias de educação e demais decisores de adoção.
            </p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card icon={Users} title="Consultores comerciais" accent="lime">Agilidade, padronização e segurança argumentativa.</Card>
          <Card icon={GraduationCap} title="Coordenação pedagógica">Leitura clara sobre qualidade, BNCC e apoio docente.</Card>
          <Card icon={Building2} title="Direção escolar">Benefícios de adoção e aplicabilidade na rotina.</Card>
          <Card icon={Landmark} title="Secretarias de educação">Apoio para avaliar consistência e implementação.</Card>
        </div>
      </div>
    ),
  },
  {
    id: "demo",
    title: "Ferramenta ao vivo",
    render: () => (
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Kicker>Demonstração</Kicker>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold text-navy-deep">
              Matriz Comparativa — ao vivo
            </h2>
            <p className="text-sm text-navy-soft mt-1">
              Comparativo real entre uma obra da Editora do Brasil e uma concorrente.
            </p>
          </div>
          <a
            href={DEMO_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-navy text-white px-4 py-2 text-sm font-medium hover:bg-navy-deep transition-colors"
          >
            Abrir em nova aba <ExternalLink className="h-4 w-4" />
          </a>
        </div>
        <div className="rounded-2xl border border-gray-line overflow-hidden bg-white shadow-[0_10px_40px_-20px_rgba(20,40,90,0.25)]">
          <iframe
            src={DEMO_URL}
            title="Matriz Comparativa PNLD"
            className="w-full h-[calc(100vh-260px)] min-h-[520px] block"
            loading="lazy"
          />
        </div>
      </div>
    ),
  },
  {
    id: "proximos",
    title: "Próximos passos",
    render: () => {
      const novidades = [
        { t: "DNA por obra implementado", d: "Cada obra agora tem um JSON canônico ingerido em /admin/dna com tese comercial, diferenciais, evidências por página e 5 scores (1–5)." },
        { t: "Pitch gerado a partir do DNA", d: "O pitch comercial deixou de ser sintético. Agora é construído sobre singularidade → evidências rastreáveis → valor comercial → comparação por dimensão → cautela." },
        { t: "Comparativo lado a lado", d: "Painel novo na Matriz que mostra os dois DNAs em paralelo: scores, top 3 diferenciais com página, leitura estrutural e badges de diferenciação/evidência/risco." },
        { t: "Publicar a versão atualizada", d: "Subir a release com DNA + pitch novo para todos os consultores antes da próxima rodada de reuniões." },
        { t: "Ingerir DNAs das obras prioritárias", d: "Processar o lote prioritário da Editora do Brasil e os concorrentes equivalentes (FTD e SM) no formato JSON canônico." },
        { t: "Validação editorial e teste com consultores", d: "Revisar teses e evidências com o editorial, depois rodar piloto com consultores em reuniões reais." },
      ];
      return (
        <div className="space-y-8">
          <SectionHeader
            title="Próximos passos"
            lead="O que já evoluímos no projeto e ainda não foi publicado, e o que vem em seguida."
          />
          <div className="grid md:grid-cols-2 gap-3">
            {novidades.map((s, i) => (
              <div
                key={s.t}
                className={`flex gap-4 rounded-xl p-4 border ${
                  i < 3 ? "bg-white border-lime" : "bg-gray-soft border-gray-line"
                }`}
              >
                <div className={`text-2xl font-bold tabular-nums w-10 shrink-0 ${
                  i < 3 ? "text-lime-deep" : "text-turquoise"
                }`}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-navy-deep">{s.t}</h4>
                    {i < 3 && <Pill tone="lime">novo</Pill>}
                  </div>
                  <p className="text-xs text-navy-soft mt-1 leading-relaxed">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
          <Quote>
            Com o DNA por obra, a comparação deixa de ser genérica e passa a ser
            específica, rastreável e orientada à decisão.
          </Quote>
        </div>
      );
    },
  },
];