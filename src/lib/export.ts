/**
 * Exportação NATIVA da apresentação — 14 slides ricos.
 *
 * Layout: 16:9 widescreen tanto em PDF (paisagem 13.333×7.5", 960×540pt) quanto em PPTX.
 * Cabeçalho e rodapé padronizados em todos os slides de conteúdo.
 * Gráficos, tabelas, mapa estático e leituras estratégicas renderizados nativamente
 * (sem screenshot da página). Fontes embutidas (Helvetica) e shapes vetoriais.
 */

import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage, RGB } from 'pdf-lib';
import PptxGenJS from 'pptxgenjs';
import { AnalysisResult, PresentationType, ConsultorSession } from './types';
import {
  num, formatPercent, formatNumber, parseBrNumber, getMensalidadeFaixa,
} from './analysis';
import {
  findRendaByIBGE, buildMatrix, calcAderenciaEconomica, classificarAderencia,
  getFaixasAderentes, FAIXAS_RENDA,
} from './socioeconomico';

// ============================================================
// PALETA — espelho da UI
// ============================================================

const NAVY = rgb(0.078, 0.149, 0.294);
const TEAL = rgb(0.071, 0.604, 0.588);
const TEAL_DARK = rgb(0.04, 0.40, 0.40);
const TEAL_LIGHT = rgb(0.871, 0.953, 0.953);
const LIME = rgb(0.55, 0.78, 0.32);
const BEIGE = rgb(0.976, 0.961, 0.929);
const TEXT = rgb(0.13, 0.13, 0.16);
const MUTED = rgb(0.42, 0.42, 0.48);
const BORDER = rgb(0.85, 0.85, 0.88);
const BORDER_LIGHT = rgb(0.92, 0.92, 0.95);
const WHITE = rgb(1, 1, 1);
const RED = rgb(0.78, 0.18, 0.18);

const C = {
  navy: '142648',
  teal: '129A96',
  tealDark: '0A6664',
  tealLight: 'DEF3F3',
  lime: '8CC753',
  beige: 'F9F5ED',
  text: '21212A',
  muted: '6A6A7A',
  border: 'D9D9E0',
  borderLight: 'EBEBEF',
  white: 'FFFFFF',
  red: 'C72E2E',
  segEI: '2EA39B',
  segEFI: '142648',
  segEFII: 'B5D964',
  segEM: '0A6664',
  // Padrão editorial — alinhado 100% à identidade web (navy + teal + lima + beige).
  // Aliases mantidos para compatibilidade com chamadas existentes; valores remapeados
  // para tealLight/borderLight/beige. Sem lavender/lilás.
  lavender: 'DEF3F3',       // ex-lavanda → teal-light (chip/card de fundo)
  lavenderDark: '9FCFCC',   // ex-lavanda escuro → teal-light borda
  blueTint: 'DEF3F3',       // callout info → teal-light
  navySoft: '2A3A66',       // texto secundário em superfícies escuras (mantido)
};

// Dimensões 16:9
// PDF: pontos. 13.333" × 7.5" * 72pt/in = 960 × 540pt.
const PDF_W = 960;
const PDF_H = 540;
// Margens internas (área segura)
const M = 36;        // margem lateral
const HEADER_H = 32; // cabeçalho
const FOOTER_H = 26; // rodapé
const CONTENT_TOP = HEADER_H + 18; // y do topo do título
const CONTENT_BOTTOM = FOOTER_H + 12;

// PPTX (polegadas)
const PPT_W = 13.333;
const PPT_H = 7.5;
const PPT_M = 0.5;
const PPT_HEADER = 0.42;
const PPT_FOOTER = 0.4;

// ============================================================
// CONTEXTO
// ============================================================

export interface ExportContext {
  analysis: AnalysisResult;
  presentationType: PresentationType;
  session: ConsultorSession | null;
  raioKm: number;
  raioMode: 'padrao' | 'personalizado';
  rendaData?: any[]; // opcional — para socioeconômico/aderência
  potencialData?: Record<string, any> | null; // opcional — para potencial de consumo
}

// ============================================================
// HELPERS DE FORMATO
// ============================================================

function fmtInt(n: number): string { return Math.round(n).toLocaleString('pt-BR'); }
function fmtPct(n: number, d = 1): string { return `${n.toFixed(d).replace('.', ',')}%`; }
function fmtKm(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return `${n.toFixed(1).replace('.', ',')} km`;
}
function fmtBRL(v: number, compact = false): string {
  if (compact) {
    if (v >= 1e9) return `R$ ${(v / 1e9).toFixed(1).replace('.', ',')} bi`;
    if (v >= 1e6) return `R$ ${(v / 1e6).toFixed(1).replace('.', ',')} mi`;
    if (v >= 1e3) return `R$ ${(v / 1e3).toFixed(0)} mil`;
  }
  return `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
}
function tipoLabel(t: PresentationType): string { return t === 'prospeccao' ? 'Prospecção' : 'Renovação'; }
function truncate(s: string, max: number): string {
  if (!s) return '';
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}
function escolaSegmentos(e: any): string[] {
  return [
    num(e.qt_mat_educacao_infantil) > 0 && 'Educação Infantil',
    num(e.qt_mat_ensino_fundamental_anos_iniciais) > 0 && 'Fund. AI',
    num(e.qt_mat_ensino_fundamental_anos_finais) > 0 && 'Fund. AF',
    num(e.qt_mat_ensino_medio) > 0 && 'Ensino Médio',
  ].filter(Boolean) as string[];
}

// ============================================================
// PDF — primitivas de desenho
// ============================================================

interface DrawCtx {
  page: PDFPage;
  font: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  ctx: ExportContext;
  pageNo: number;
  total: number;
}

function drawPDFHeader(d: DrawCtx) {
  const { page, font, bold, ctx } = d;
  page.drawRectangle({ x: 0, y: PDF_H - HEADER_H, width: PDF_W, height: HEADER_H, color: BEIGE });
  page.drawRectangle({ x: 0, y: PDF_H - HEADER_H, width: 4, height: HEADER_H, color: TEAL });
  page.drawText('EDITORA DO BRASIL', {
    x: M, y: PDF_H - HEADER_H + 12, size: 9, font: bold, color: NAVY,
  });
  page.drawText('Diagnóstico Territorial · Análise Estratégica', {
    x: M + 130, y: PDF_H - HEADER_H + 12, size: 9, font, color: MUTED,
  });
  const right = `${ctx.session?.nome ?? '—'} · ${ctx.analysis.escola.Município}/${ctx.analysis.escola.UF}`;
  const w = font.widthOfTextAtSize(right, 9);
  page.drawText(right, { x: PDF_W - M - w, y: PDF_H - HEADER_H + 12, size: 9, font, color: MUTED });
}

function drawPDFFooter(d: DrawCtx) {
  const { page, font, ctx, pageNo, total } = d;
  page.drawLine({ start: { x: M, y: FOOTER_H + 4 }, end: { x: PDF_W - M, y: FOOTER_H + 4 }, thickness: 0.4, color: BORDER });
  const left = `${ctx.analysis.escola.Escola} · INEP ${ctx.analysis.escola['Código Inep']} · Raio ${fmtKm(ctx.raioKm)} ${ctx.raioMode === 'personalizado' ? '(personalizado)' : '(padrão)'}`;
  page.drawText(truncate(left, 110), { x: M, y: 14, size: 8, font, color: MUTED });
  const right = `${pageNo} / ${total}`;
  const w = font.widthOfTextAtSize(right, 8);
  page.drawText(right, { x: PDF_W - M - w, y: 14, size: 8, font, color: MUTED });
}

function drawPDFTitle(d: DrawCtx, title: string, subtitle?: string) {
  const { page, bold, font } = d;
  page.drawText(title, { x: M, y: PDF_H - CONTENT_TOP - 14, size: 22, font: bold, color: NAVY });
  page.drawRectangle({ x: M, y: PDF_H - CONTENT_TOP - 22, width: 36, height: 3, color: TEAL });
  if (subtitle) {
    page.drawText(subtitle, { x: M, y: PDF_H - CONTENT_TOP - 40, size: 10.5, font, color: MUTED });
  }
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = (text || '').split(/\s+/);
  const out: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth) {
      if (line) out.push(line);
      line = w;
    } else line = test;
  }
  if (line) out.push(line);
  return out;
}

function drawParagraph(page: PDFPage, font: PDFFont, text: string, x: number, y: number, w: number, size = 10, color: RGB = TEXT, lineGap = 3): number {
  const lines = wrapText(text, font, size, w);
  let cy = y;
  for (const ln of lines) {
    page.drawText(ln, { x, y: cy, size, font, color });
    cy -= size + lineGap;
  }
  return cy;
}

function drawCard(page: PDFPage, x: number, y: number, w: number, h: number, accentTop: RGB | null = TEAL) {
  page.drawRectangle({ x, y, width: w, height: h, color: WHITE, borderColor: BORDER, borderWidth: 0.5 });
  if (accentTop) page.drawRectangle({ x, y: y + h - 3, width: w, height: 3, color: accentTop });
}

function drawKpiCard(page: PDFPage, font: PDFFont, bold: PDFFont, x: number, y: number, w: number, h: number, label: string, value: string, accent: RGB = TEAL) {
  drawCard(page, x, y, w, h, accent);
  page.drawText(label.toUpperCase(), { x: x + 12, y: y + h - 18, size: 8, font, color: MUTED });
  // Valor — auto-shrink se muito grande
  let vSize = 22;
  while (bold.widthOfTextAtSize(value, vSize) > w - 24 && vSize > 11) vSize -= 1;
  page.drawText(value, { x: x + 12, y: y + 14, size: vSize, font: bold, color: NAVY });
}

// Barra horizontal (ranking simples)
function drawHBar(page: PDFPage, font: PDFFont, x: number, y: number, w: number, h: number, label: string, valuePct: number, color: RGB = TEAL, valueText?: string, labelW = 130) {
  page.drawText(truncate(label, 28), { x, y: y + (h - 8) / 2, size: 9, font, color: TEXT });
  const trackX = x + labelW;
  const trackW = w - labelW - 50;
  page.drawRectangle({ x: trackX, y, width: trackW, height: h, color: BORDER_LIGHT });
  const barW = Math.max(2, Math.min(trackW, (valuePct / 100) * trackW));
  page.drawRectangle({ x: trackX, y, width: barW, height: h, color });
  const txt = valueText ?? fmtPct(valuePct);
  page.drawText(txt, { x: trackX + trackW + 6, y: y + (h - 8) / 2, size: 9, font, color: NAVY });
}

// Gráfico de barras vertical
function drawVBars(page: PDFPage, font: PDFFont, x: number, y: number, w: number, h: number, data: { label: string; value: number; color?: RGB }[], yMax?: number, fmtVal?: (n: number) => string) {
  if (data.length === 0) return;
  const max = yMax ?? Math.max(...data.map(d => d.value), 1);
  const gap = 8;
  const barW = (w - gap * (data.length - 1)) / data.length;
  // eixo x
  page.drawLine({ start: { x, y }, end: { x: x + w, y }, thickness: 0.5, color: BORDER });
  data.forEach((d, i) => {
    const bx = x + i * (barW + gap);
    const bh = max > 0 ? (d.value / max) * (h - 22) : 0;
    page.drawRectangle({ x: bx, y, width: barW, height: bh, color: d.color ?? TEAL });
    // valor
    const vt = fmtVal ? fmtVal(d.value) : fmtInt(d.value);
    const vw = font.widthOfTextAtSize(vt, 8);
    page.drawText(vt, { x: bx + (barW - vw) / 2, y: y + bh + 4, size: 8, font, color: NAVY });
    // label
    const lw = font.widthOfTextAtSize(d.label, 8);
    page.drawText(d.label, { x: bx + (barW - Math.min(lw, barW)) / 2, y: y - 12, size: 8, font, color: MUTED });
  });
}

// ============================================================
// BUILDER DE DADOS POR PÁGINA
// ============================================================

function buildPageData(ctx: ExportContext) {
  const a = ctx.analysis;
  const e = a.escola;
  const concs = a.concorrentes;
  const ms = a.marketShare;

  // Universo (escola + concorrentes)
  const totalAlunadoArea = num(e['Alunado Total']) + concs.reduce((s, c) => s + num(c.escola['Alunado Total']), 0);
  const allSchoolsRanked = [
    { name: e.Escola, total: num(e['Alunado Total']), isTarget: true, data: e },
    ...concs.map(c => ({ name: c.escola.Escola, total: num(c.escola['Alunado Total']), isTarget: false, data: c.escola })),
  ].sort((x, y) => y.total - x.total);

  // Segmentos do município (panorama)
  const todas = [e, ...concs.map(c => c.escola)];
  const totalAlunos = todas.reduce((s, x) => s + num(x['Alunado Total']), 0);
  const segPanorama = [
    { sigla: 'EI',   nome: 'Educação Infantil',          alunos: todas.reduce((s, x) => s + num(x.qt_mat_educacao_infantil), 0) },
    { sigla: 'EFI',  nome: 'Ens. Fund. — Anos Iniciais', alunos: todas.reduce((s, x) => s + num(x.qt_mat_ensino_fundamental_anos_iniciais), 0) },
    { sigla: 'EFII', nome: 'Ens. Fund. — Anos Finais',   alunos: todas.reduce((s, x) => s + num(x.qt_mat_ensino_fundamental_anos_finais), 0) },
    { sigla: 'EM',   nome: 'Ensino Médio',                alunos: todas.reduce((s, x) => s + num(x.qt_mat_ensino_medio), 0) },
  ].sort((x, y) => y.alunos - x.alunos);

  // Demográfica
  const d = a.demografica;
  const rendaMedia = d ? parseBrNumber(d['Renda Média']) : 0;
  const idhEduc = d?.['IDH - Dimensão Educação Classificação'] ?? '—';
  const idhRenda = d?.['IDH - Dimensão Renda Classificação'] ?? '—';
  const populacao = d?.['População'] ?? '—';
  const pop0_19 = d ? (['0 a 4', '5 a 9', '10 a 14', '15 a 19'] as const)
    .reduce((s, f) => s + (parseInt(d[`População por Faixa Etária (2025) - ${f} anos`] || '0')), 0) : 0;

  // Aderência
  const rendaRow = ctx.rendaData ? findRendaByIBGE(ctx.rendaData, String(e['Código Município'])) : null;
  const matrix = rendaRow ? buildMatrix(rendaRow) : null;
  const aderencia = matrix ? calcAderenciaEconomica(matrix, e.Mensalidade) : 0;
  const aderenteCls = classificarAderencia(aderencia);
  const faixasAderentes = getFaixasAderentes(e.Mensalidade);

  // Potencial de Consumo
  let potencial: any = null;
  if (ctx.potencialData) {
    const cod = String(e['Código Município']).replace(/\D/g, '');
    potencial = ctx.potencialData[cod] ?? null;
    if (!potencial) {
      const cod6 = cod.length === 7 ? cod.slice(0, 6) : cod;
      for (const k of Object.keys(ctx.potencialData)) {
        const k6 = k.length === 7 ? k.slice(0, 6) : k;
        if (k6 === cod6) { potencial = ctx.potencialData[k]; break; }
      }
    }
  }

  // Mensalidade
  const escolaIdx = getMensalidadeFaixa(e.Mensalidade);
  const mesmaFaixa = concs.filter(c => getMensalidadeFaixa(c.escola.Mensalidade) === escolaIdx).length;
  const acima = concs.filter(c => getMensalidadeFaixa(c.escola.Mensalidade) > escolaIdx).length;
  const abaixo = concs.filter(c => {
    const i = getMensalidadeFaixa(c.escola.Mensalidade);
    return i > 0 && i < escolaIdx;
  }).length;

  // Insights base
  const adotamBrasil = concs.filter(c => (c.escola['Adota Brasil'] || '').toLowerCase() === 'sim').length;
  const isFragmented = ms.geral < 10 && concs.length >= 10;
  const isLeader = ms.geral >= 20;
  const popGrowth = (() => {
    if (!d) return 0;
    const a25 = parseInt(d['População por Faixa Etária (2025) - 0 a 4 anos'] || '0');
    const a24 = parseInt(d['População por Faixa Etária (2024) - 0 a 4 anos'] || '0');
    return a24 > 0 ? ((a25 - a24) / a24) * 100 : 0;
  })();

  return {
    a, e, concs, ms, totalAlunadoArea, allSchoolsRanked, segPanorama, totalAlunos,
    d, rendaMedia, idhEduc, idhRenda, populacao, pop0_19,
    matrix, aderencia, aderenteCls, faixasAderentes,
    potencial, mesmaFaixa, acima, abaixo, adotamBrasil, isFragmented, isLeader, popGrowth,
  };
}

// ============================================================
// SLIDE BUILDERS — chamados tanto por PDF quanto por PPT.
// Cada função recebe um "renderer" abstrato que sabe desenhar primitivos.
// Para simplicidade, mantemos PDF e PPT em funções separadas mas com
// mesma fonte de dados (buildPageData).
// ============================================================

const SLIDE_TITLES = [
  'Capa',
  'Abertura comercial',
  'Resumo Executivo',
  'Panorama educacional da região',
  'Concorrência — mapa e régua',
  'Concorrência — tabela',
  'Market share geral',
  'Market share por segmento',
  'Mensalidade e posicionamento competitivo',
  'Perfil socioeconômico e aderência econômica',
  'Potencial de consumo educacional e comercial',
  'Insights estratégicos',
  'Plano de ação comercial e marketing',
  'Ação comercial e marketing',
  'Encerramento',
];

// ============================================================
// PDF — RENDERER COMPLETO (14 slides)
// ============================================================

export async function exportPDF(ctx: ExportContext): Promise<Blob> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);
  const data = buildPageData(ctx);
  const total = SLIDE_TITLES.length;

  const slideRenderers: Array<(page: PDFPage, n: number) => void> = [
    (p) => renderPdfCapa(p, font, bold, italic, ctx),
    (p, n) => renderPdfAbertura(p, font, bold, italic, ctx, n, total),
    (p, n) => renderPdfResumo(p, font, bold, italic, ctx, data, n, total),
    (p, n) => renderPdfPanorama(p, font, bold, italic, ctx, data, n, total),
    (p, n) => renderPdfConcorrenciaMapa(p, font, bold, italic, ctx, data, n, total),
    (p, n) => renderPdfConcorrenciaTabela(p, font, bold, italic, ctx, data, n, total),
    (p, n) => renderPdfMarketShareGeral(p, font, bold, italic, ctx, data, n, total),
    (p, n) => renderPdfMarketShareSegmentos(p, font, bold, italic, ctx, data, n, total),
    (p, n) => renderPdfMensalidade(p, font, bold, italic, ctx, data, n, total),
    (p, n) => renderPdfSocioeconomico(p, font, bold, italic, ctx, data, n, total),
    (p, n) => renderPdfPotencial(p, font, bold, italic, ctx, data, n, total),
    (p, n) => renderPdfInsights(p, font, bold, italic, ctx, data, n, total),
    (p, n) => renderPdfPlanoAcao(p, font, bold, italic, ctx, data, n, total),
    (p, n) => renderPdfAcaoComercial(p, font, bold, italic, ctx, data, n, total),
    (p) => renderPdfEncerramento(p, font, bold, italic, ctx),
  ];

  slideRenderers.forEach((render, i) => {
    const page = pdf.addPage([PDF_W, PDF_H]);
    render(page, i + 1);
  });

  const bytes = await pdf.save();
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}

// ----- 1. Capa
function renderPdfCapa(page: PDFPage, font: PDFFont, bold: PDFFont, italic: PDFFont, ctx: ExportContext) {
  const { escola: e, presentationType } = { escola: ctx.analysis.escola, presentationType: ctx.presentationType };
  page.drawRectangle({ x: 0, y: 0, width: PDF_W, height: PDF_H, color: NAVY });
  // faixa lateral teal
  page.drawRectangle({ x: 0, y: 0, width: 8, height: PDF_H, color: TEAL });

  page.drawText('EDITORA DO BRASIL', { x: M + 8, y: PDF_H - 80, size: 11, font: bold, color: TEAL });
  page.drawRectangle({ x: M + 8, y: PDF_H - 92, width: 50, height: 2.5, color: TEAL });

  page.drawText('Diagnóstico Territorial', { x: M + 8, y: PDF_H - 150, size: 16, font, color: TEAL_LIGHT });
  page.drawText(tipoLabel(presentationType).toUpperCase(), { x: M + 8, y: PDF_H - 200, size: 44, font: bold, color: WHITE });

  // Nome da escola — wrap se necessário
  const nameLines = wrapText(e.Escola, bold, 22, PDF_W - M * 2 - 16);
  let ny = PDF_H - 280;
  for (const ln of nameLines.slice(0, 2)) {
    page.drawText(ln, { x: M + 8, y: ny, size: 22, font: bold, color: WHITE });
    ny -= 28;
  }

  page.drawText(`${e.Município} · ${e.UF}`, { x: M + 8, y: ny - 8, size: 14, font, color: TEAL_LIGHT });
  page.drawText(`Código INEP ${e['Código Inep']}`, { x: M + 8, y: ny - 32, size: 12, font, color: TEAL_LIGHT });

  // Rodapé da capa
  page.drawText('Transformando o país pela educação.', {
    x: M + 8, y: 36, size: 11, font: italic, color: TEAL_LIGHT,
  });
  if (ctx.session) {
    const right = `Consultor: ${ctx.session.nome} · ${ctx.session.codigo}`;
    const w = font.widthOfTextAtSize(right, 10);
    page.drawText(right, { x: PDF_W - M - w, y: 36, size: 10, font, color: TEAL_LIGHT });
  }
}

// ----- 2. Abertura comercial
function renderPdfAbertura(page: PDFPage, font: PDFFont, bold: PDFFont, italic: PDFFont, ctx: ExportContext, n: number, total: number) {
  const d: DrawCtx = { page, font, bold, italic, ctx, pageNo: n, total };
  drawPDFHeader(d); drawPDFFooter(d);
  drawPDFTitle(d, 'Abertura Comercial', `${tipoLabel(ctx.presentationType)} · ${ctx.analysis.escola.Município}/${ctx.analysis.escola.UF}`);

  // Texto institucional
  let y = PDF_H - CONTENT_TOP - 70;
  const intro = ctx.presentationType === 'prospeccao'
    ? 'Esta análise foi construída para apoiar a conversa comercial com a sua escola. Reunimos dados públicos atualizados — Censo Escolar, IBGE e estudos socioeconômicos — e cruzamos com inteligência de mercado para mapear oportunidades reais de captação, retenção e fortalecimento da marca.'
    : 'Esta análise consolida o cenário competitivo, demográfico e socioeconômico da sua área de influência para sustentar a conversa de renovação. Nosso objetivo é tornar visíveis as alavancas de crescimento e os riscos a serem endereçados nos próximos ciclos.';
  y = drawParagraph(page, font, intro, M, y, PDF_W - 2 * M, 11, TEXT, 4);

  // Cards institucionais (3 pilares)
  const cardW = (PDF_W - 2 * M - 24) / 3;
  const cardY = 150;
  const cards = [
    { title: 'METODOLOGIA', body: 'Censo Escolar 2024, IBGE, Pyxis Potencial de Consumo e cruzamento próprio com a base territorial da Editora do Brasil.' },
    { title: 'INTELIGÊNCIA', body: 'Concorrência, market share por segmento, mensalidade, aderência econômica, potencial de consumo e plano de ação.' },
    { title: 'PARCERIA', body: 'Mais do que dados: caminhos comerciais. A Editora do Brasil constrói parceria de longo prazo com a sua escola.' },
  ];
  cards.forEach((c, i) => {
    const x = M + i * (cardW + 12);
    drawCard(page, x, cardY, cardW, 150, TEAL);
    page.drawText(c.title, { x: x + 12, y: cardY + 128, size: 9, font: bold, color: TEAL });
    drawParagraph(page, font, c.body, x + 12, cardY + 102, cardW - 24, 10, TEXT, 3);
  });

  // Frase de fechamento (sem repetir COMPROMISSO)
  page.drawRectangle({ x: M, y: 70, width: PDF_W - 2 * M, height: 50, color: TEAL_LIGHT, borderColor: TEAL, borderWidth: 0.5 });
  page.drawText('Construir caminhos, fortalecer relações e apoiar escolas que desejam crescer com consistência, relevância e valor.', {
    x: M + 14, y: 90, size: 11, font: italic, color: NAVY,
  });
}

// ----- 3. Resumo Executivo
function renderPdfResumo(page: PDFPage, font: PDFFont, bold: PDFFont, italic: PDFFont, ctx: ExportContext, data: any, n: number, total: number) {
  const d: DrawCtx = { page, font, bold, italic, ctx, pageNo: n, total };
  drawPDFHeader(d); drawPDFFooter(d);
  drawPDFTitle(d, 'Resumo Executivo', 'Visão geral do cenário escolar na área de influência');

  const e = ctx.analysis.escola;
  const a = ctx.analysis;
  const segs = escolaSegmentos(e);

  // Texto executivo
  const resumo = `${e.Escola}, em ${e.Município}/${e.UF}, atende ${segs.length} segmento(s) ` +
    `(${segs.join(', ') || 'não informado'}). A área de influência (raio de ${fmtKm(ctx.raioKm)}) reúne ` +
    `${a.concorrentes.length + 1} escolas elegíveis e ${fmtInt(data.totalAlunadoArea)} alunos. ` +
    `Market share geral atual de ${fmtPct(a.marketShare.geral)} no município.`;
  let y = PDF_H - CONTENT_TOP - 64;
  y = drawParagraph(page, font, resumo, M, y, PDF_W - 2 * M, 11, TEXT, 4);

  // Cenário do município
  page.drawText('CENÁRIO EDUCACIONAL DO MUNICÍPIO', { x: M, y: y - 14, size: 9, font: bold, color: TEAL });
  y -= 30;
  const muniW = (PDF_W - 2 * M - 12) / 2;
  drawKpiCard(page, font, bold, M, y - 60, muniW, 60, 'Total de Escolas', fmtInt(a.escolasMunicipio.length), NAVY);
  drawKpiCard(page, font, bold, M + muniW + 12, y - 60, muniW, 60, 'Total de Alunos', fmtInt(a.escolasMunicipio.reduce((s, x) => s + num(x['Alunado Total']), 0)), NAVY);
  y -= 76;

  // Indicadores da escola
  page.drawText('INDICADORES DA ESCOLA ANALISADA', { x: M, y: y - 14, size: 9, font: bold, color: TEAL });
  y -= 30;
  const escW = (PDF_W - 2 * M - 24) / 3;
  const mensLabel = (!e.Mensalidade || e.Mensalidade === '0')
    ? 'Dado não disponível'
    : e.Mensalidade;
  drawKpiCard(page, font, bold, M, y - 60, escW, 60, 'Raio Operacional', fmtKm(ctx.raioKm), TEAL);
  drawKpiCard(page, font, bold, M + escW + 12, y - 60, escW, 60, 'Market Share', fmtPct(a.marketShare.geral), LIME);
  drawKpiCard(page, font, bold, M + 2 * (escW + 12), y - 60, escW, 60, 'Faixa de Mensalidade', mensLabel, NAVY);

  // Metodologia (rodapé)
  page.drawText('Metodologia: Censo Escolar 2024 + critérios de proximidade, faixa de mensalidade e segmentos comuns. Top 15 concorrentes por relevância competitiva.', {
    x: M, y: 56, size: 8.5, font: italic, color: MUTED,
  });
}

// ----- 4. Panorama educacional
function renderPdfPanorama(page: PDFPage, font: PDFFont, bold: PDFFont, italic: PDFFont, ctx: ExportContext, data: any, n: number, total: number) {
  const d: DrawCtx = { page, font, bold, italic, ctx, pageNo: n, total };
  drawPDFHeader(d); drawPDFFooter(d);
  drawPDFTitle(d, 'Panorama Educacional da Região', `${data.a.concorrentes.length + 1} escolas · ${fmtInt(data.totalAlunos)} alunos · raio ${fmtKm(ctx.raioKm)}`);

  // Cards principais
  const cardW = (PDF_W - 2 * M - 36) / 4;
  const cardY = PDF_H - CONTENT_TOP - 130;
  const lider = data.segPanorama[0];
  drawKpiCard(page, font, bold, M + 0 * (cardW + 12), cardY, cardW, 60, 'Escolas',         String(data.a.concorrentes.length + 1), TEAL);
  drawKpiCard(page, font, bold, M + 1 * (cardW + 12), cardY, cardW, 60, 'Total de Alunos', fmtInt(data.totalAlunos), NAVY);
  drawKpiCard(page, font, bold, M + 2 * (cardW + 12), cardY, cardW, 60, 'Média/Escola',    fmtInt(Math.round(data.totalAlunos / Math.max(1, data.a.concorrentes.length + 1))), LIME);
  drawKpiCard(page, font, bold, M + 3 * (cardW + 12), cardY, cardW, 60, 'Segmento Líder',  `${lider?.sigla ?? '—'} · ${data.totalAlunos > 0 ? fmtPct((lider?.alunos ?? 0) / data.totalAlunos * 100, 0) : '—'}`, TEAL);

  // Gráfico de distribuição por segmento
  const chartY = cardY - 200;
  page.drawText('DISTRIBUIÇÃO DO MERCADO POR SEGMENTO', { x: M, y: chartY + 175, size: 10, font: bold, color: NAVY });
  const colors = [TEAL, NAVY, LIME, TEAL_DARK];
  drawVBars(page, font, M + 30, chartY + 25, PDF_W - 2 * M - 200, 140,
    data.segPanorama.map((s: any, i: number) => ({ label: s.sigla, value: s.alunos, color: colors[i] })),
    undefined, fmtInt);

  // Tabela lateral
  const tx = PDF_W - M - 160;
  page.drawText('SEGMENTO', { x: tx, y: chartY + 175, size: 8, font: bold, color: MUTED });
  page.drawText('ALUNOS', { x: tx + 90, y: chartY + 175, size: 8, font: bold, color: MUTED });
  page.drawText('%', { x: tx + 138, y: chartY + 175, size: 8, font: bold, color: MUTED });
  let ty = chartY + 158;
  data.segPanorama.forEach((s: any, i: number) => {
    page.drawRectangle({ x: tx - 4, y: ty - 2, width: 6, height: 6, color: colors[i] });
    page.drawText(s.sigla, { x: tx + 8, y: ty, size: 9, font: bold, color: NAVY });
    page.drawText(fmtInt(s.alunos), { x: tx + 90, y: ty, size: 9, font, color: TEXT });
    page.drawText(data.totalAlunos > 0 ? fmtPct(s.alunos / data.totalAlunos * 100, 0) : '—', { x: tx + 138, y: ty, size: 9, font, color: TEXT });
    ty -= 16;
  });

  // Leitura estratégica
  const lider2 = data.segPanorama[0];
  const menor = data.segPanorama[data.segPanorama.length - 1];
  const leitura = `${lider2?.nome ?? '—'} lidera com ${data.totalAlunos > 0 ? fmtPct(lider2.alunos / data.totalAlunos * 100, 0) : '—'} do mercado. ${menor?.nome ?? '—'} representa ${data.totalAlunos > 0 ? fmtPct(menor.alunos / data.totalAlunos * 100, 0) : '—'} — ${menor?.alunos === 0 ? 'ausência de oferta' : 'oportunidade de diferenciação'}.`;
  page.drawRectangle({ x: M, y: 60, width: PDF_W - 2 * M, height: 50, color: TEAL_LIGHT, borderColor: TEAL, borderWidth: 0.5 });
  page.drawText('LEITURA ESTRATÉGICA', { x: M + 12, y: 92, size: 9, font: bold, color: TEAL });
  drawParagraph(page, font, leitura, M + 12, 76, PDF_W - 2 * M - 24, 10, NAVY, 3);
}

// ----- 5. Concorrência — mapa e régua (mapa estático SVG)
function renderPdfConcorrenciaMapa(page: PDFPage, font: PDFFont, bold: PDFFont, italic: PDFFont, ctx: ExportContext, data: any, n: number, total: number) {
  const d: DrawCtx = { page, font, bold, italic, ctx, pageNo: n, total };
  drawPDFHeader(d); drawPDFFooter(d);
  drawPDFTitle(d, 'Concorrência — Mapa e Régua', `Raio ${fmtKm(ctx.raioKm)} · ${ctx.raioMode === 'personalizado' ? 'Personalizado' : 'Padrão'} · ${data.concs.length} concorrentes`);

  // Mapa estático: área 540×320 à esquerda, painel lateral à direita.
  const mapX = M, mapY = 80, mapW = 540, mapH = 320;
  page.drawRectangle({ x: mapX, y: mapY, width: mapW, height: mapH, color: BEIGE, borderColor: BORDER, borderWidth: 0.5 });

  const e = data.e;
  const lat = parseFloat(String(e.Latitude));
  const lng = parseFloat(String(e.Longitude));
  if (!isNaN(lat) && !isNaN(lng)) {
    // Pega concorrentes com coordenadas
    const points = data.concs
      .map((c: any) => ({
        lat: parseFloat(String(c.escola.Latitude)),
        lng: parseFloat(String(c.escola.Longitude)),
        dist: c.distancia,
        nome: c.escola.Escola,
      }))
      .filter((p: any) => !isNaN(p.lat) && !isNaN(p.lng));

    // Bounding box centrada na escola, com escala = 2× raio operacional
    const kmPerDegLat = 111;
    const kmPerDegLng = 111 * Math.cos(lat * Math.PI / 180);
    const r = ctx.raioKm * 1.4; // pequena folga
    const dLat = r / kmPerDegLat;
    const dLng = r / kmPerDegLng;
    const minLat = lat - dLat, maxLat = lat + dLat;
    const minLng = lng - dLng, maxLng = lng + dLng;

    const proj = (la: number, lo: number) => {
      const px = mapX + ((lo - minLng) / (maxLng - minLng)) * mapW;
      const py = mapY + ((la - minLat) / (maxLat - minLat)) * mapH;
      return { x: px, y: py };
    };

    // Grid leve
    for (let i = 1; i < 4; i++) {
      page.drawLine({ start: { x: mapX + (mapW / 4) * i, y: mapY }, end: { x: mapX + (mapW / 4) * i, y: mapY + mapH }, thickness: 0.3, color: BORDER_LIGHT });
      page.drawLine({ start: { x: mapX, y: mapY + (mapH / 4) * i }, end: { x: mapX + mapW, y: mapY + (mapH / 4) * i }, thickness: 0.3, color: BORDER_LIGHT });
    }

    // Círculo do raio (centro = escola)
    const center = proj(lat, lng);
    const radiusPx = (ctx.raioKm / r) * (mapW / 2);
    page.drawCircle({ x: center.x, y: center.y, size: radiusPx, color: TEAL, opacity: 0.08, borderColor: TEAL, borderWidth: 0.8 });

    // Concorrentes
    points.forEach((p: any) => {
      const { x, y } = proj(p.lat, p.lng);
      if (x < mapX || x > mapX + mapW || y < mapY || y > mapY + mapH) return;
      page.drawCircle({ x, y, size: 4, color: NAVY, borderColor: WHITE, borderWidth: 1 });
    });

    // Escola analisada (por cima)
    page.drawCircle({ x: center.x, y: center.y, size: 7, color: TEAL, borderColor: WHITE, borderWidth: 1.5 });
  } else {
    page.drawText('Coordenadas da escola não disponíveis para renderização do mapa.', {
      x: mapX + 18, y: mapY + mapH / 2, size: 11, font: italic, color: MUTED,
    });
  }

  // Painel lateral
  const px = mapX + mapW + 18;
  const pw = PDF_W - M - px;
  let py = mapY + mapH;
  const drawPanel = (titleTxt: string, items: [string, string][]) => {
    py -= 14;
    page.drawText(titleTxt.toUpperCase(), { x: px, y: py, size: 9, font: bold, color: TEAL });
    py -= 10;
    items.forEach(([k, v]) => {
      page.drawText(k, { x: px, y: py - 8, size: 8.5, font, color: MUTED });
      const w = bold.widthOfTextAtSize(v, 9);
      page.drawText(v, { x: px + pw - w, y: py - 8, size: 9, font: bold, color: NAVY });
      page.drawLine({ start: { x: px, y: py - 14 }, end: { x: px + pw, y: py - 14 }, thickness: 0.3, color: BORDER_LIGHT });
      py -= 18;
    });
    py -= 6;
  };

  const comCoord = data.concs.filter((c: any) => !isNaN(parseFloat(String(c.escola.Latitude))) && !isNaN(parseFloat(String(c.escola.Longitude)))).length;
  drawPanel('Régua', [
    ['Raio operacional', fmtKm(ctx.raioKm)],
    ['Modo', ctx.raioMode === 'personalizado' ? 'Personalizado' : 'Padrão'],
  ]);
  drawPanel('Cobertura', [
    ['Plotados', `${comCoord} / ${data.concs.length}`],
    ['Estimados por CEP', String(data.concs.length - comCoord)],
  ]);
  drawPanel('Legenda', [
    ['● Escola analisada', ''],
    ['● Concorrentes', ''],
  ]);

  // Leitura
  page.drawRectangle({ x: M, y: 50, width: PDF_W - 2 * M, height: 28, color: TEAL_LIGHT, borderColor: TEAL, borderWidth: 0.5 });
  page.drawText(`Área de influência: ${data.concs.length} concorrente(s) elegível(is) · ${data.mesmaFaixa} na mesma faixa de mensalidade · ${data.adotamBrasil} adota(m) Editora do Brasil.`, {
    x: M + 12, y: 60, size: 9.5, font, color: NAVY,
  });
}

// ----- 6. Concorrência — tabela
function renderPdfConcorrenciaTabela(page: PDFPage, font: PDFFont, bold: PDFFont, italic: PDFFont, ctx: ExportContext, data: any, n: number, total: number) {
  const d: DrawCtx = { page, font, bold, italic, ctx, pageNo: n, total };
  drawPDFHeader(d); drawPDFFooter(d);
  drawPDFTitle(d, 'Concorrência — Tabela', `Top ${Math.min(15, data.concs.length)} concorrentes ordenados por relevância`);

  const x0 = M, w = PDF_W - 2 * M;
  const cols = [
    { k: 'esc',  w: w * 0.34, label: 'Escola' },
    { k: 'mens', w: w * 0.16, label: 'Mensalidade' },
    { k: 'mat',  w: w * 0.10, label: 'Matrículas', align: 'right' as const },
    { k: 'dist', w: w * 0.14, label: 'Distância' },
    { k: 'segs', w: w * 0.16, label: 'Segmentos' },
    { k: 'eb',   w: w * 0.10, label: 'Ed. Brasil', align: 'center' as const },
  ];

  const headerY = PDF_H - CONTENT_TOP - 70;
  page.drawRectangle({ x: x0, y: headerY - 22, width: w, height: 22, color: NAVY });
  let cx = x0;
  cols.forEach(c => {
    const tx = c.align === 'right' ? cx + c.w - 8 - bold.widthOfTextAtSize(c.label, 9.5) :
               c.align === 'center' ? cx + (c.w - bold.widthOfTextAtSize(c.label, 9.5)) / 2 :
               cx + 10;
    page.drawText(c.label, { x: tx, y: headerY - 15, size: 9.5, font: bold, color: WHITE });
    cx += c.w;
  });

  let y = headerY - 22;
  const rowH = 22;
  const concs = data.concs.slice(0, 15);
  concs.forEach((c: any, idx: number) => {
    if (y - rowH < CONTENT_BOTTOM + 30) return;
    if (idx % 2 === 0) {
      page.drawRectangle({ x: x0, y: y - rowH, width: w, height: rowH, color: BEIGE });
    }
    cx = x0;
    const dist = c.distancia !== null
      ? fmtKm(c.distancia)
      : (c.proximidadeCEP ? 'Estimado por CEP' : 'Sem coordenadas');
    const distColor = c.distancia !== null ? TEXT : (c.proximidadeCEP ? MUTED : RED);
    const eb = (c.escola['Adota Brasil'] || '').toLowerCase() === 'sim';

    const drawCell = (text: string, col: typeof cols[number], color: RGB = TEXT, fnt: PDFFont = font) => {
      // truncamento adaptativo: tenta caber inteiro, senão reduz fonte
      let size = 9;
      let t = text;
      const max = col.w - 16;
      while (fnt.widthOfTextAtSize(t, size) > max && size > 7) size -= 0.5;
      if (fnt.widthOfTextAtSize(t, size) > max) {
        // ainda grande: trunca
        while (t.length > 4 && fnt.widthOfTextAtSize(t + '…', size) > max) t = t.slice(0, -1);
        t = t + '…';
      }
      const tw = fnt.widthOfTextAtSize(t, size);
      const tx = col.align === 'right' ? cx + col.w - 10 - tw :
                 col.align === 'center' ? cx + (col.w - tw) / 2 :
                 cx + 10;
      page.drawText(t, { x: tx, y: y - 14, size, font: fnt, color });
    };

    drawCell(c.escola.Escola, cols[0], NAVY, bold);
    cx += cols[0].w;
    drawCell(c.escola.Mensalidade && c.escola.Mensalidade !== '0' ? c.escola.Mensalidade : '—', cols[1]);
    cx += cols[1].w;
    drawCell(fmtInt(num(c.escola['Alunado Total'])), cols[2]);
    cx += cols[2].w;
    drawCell(dist, cols[3], distColor);
    cx += cols[3].w;
    drawCell(c.segmentosComum.join(' · ') || '—', cols[4]);
    cx += cols[4].w;
    drawCell(eb ? '✓' : '—', cols[5], eb ? TEAL : MUTED, bold);

    y -= rowH;
  });

  // Borda da tabela
  page.drawRectangle({ x: x0, y, width: w, height: headerY - 22 - y, borderColor: BORDER, borderWidth: 0.4, color: WHITE, opacity: 0 });

  // Resumo
  page.drawText(`${data.concs.length} concorrente(s) elegíveis · ${data.mesmaFaixa} na mesma faixa · ${data.adotamBrasil} adota(m) Editora do Brasil.`, {
    x: M, y: 56, size: 9, font: italic, color: MUTED,
  });
}

// ----- 7. Market share geral
function renderPdfMarketShareGeral(page: PDFPage, font: PDFFont, bold: PDFFont, italic: PDFFont, ctx: ExportContext, data: any, n: number, total: number) {
  const d: DrawCtx = { page, font, bold, italic, ctx, pageNo: n, total };
  drawPDFHeader(d); drawPDFFooter(d);
  drawPDFTitle(d, 'Market Share — Visão Geral', `Participação relativa em ${ctx.analysis.escola.Município}/${ctx.analysis.escola.UF}`);

  const ms = ctx.analysis.marketShare;
  // KPIs principais
  const cardW = (PDF_W - 2 * M - 48) / 5;
  const cardY = PDF_H - CONTENT_TOP - 130;
  const kpis = [
    { l: 'Geral',                v: fmtPct(ms.geral),  c: TEAL },
    { l: 'Educação Infantil',    v: fmtPct(ms.ei),     c: NAVY },
    { l: 'Fund. AI',             v: fmtPct(ms.efi),    c: NAVY },
    { l: 'Fund. AF',             v: fmtPct(ms.efii),   c: NAVY },
    { l: 'Ensino Médio',         v: fmtPct(ms.em),     c: NAVY },
  ];
  kpis.forEach((k, i) => {
    drawKpiCard(page, font, bold, M + i * (cardW + 12), cardY, cardW, 60, k.l, k.v, k.c);
  });

  // Ranking geral — top 10
  const top = data.allSchoolsRanked.slice(0, 10);
  const universe = data.totalAlunadoArea;
  page.drawText('RANKING DE MARKET SHARE — TOP 10', { x: M, y: cardY - 24, size: 10, font: bold, color: NAVY });
  let y = cardY - 44;
  const rowH = 22;
  top.forEach((s: any) => {
    if (y < CONTENT_BOTTOM + 50) return;
    const pct = universe > 0 ? (s.total / universe) * 100 : 0;
    const color = s.isTarget ? TEAL : NAVY;
    drawHBar(page, font, M, y, PDF_W - 2 * M, 14,
      truncate((s.isTarget ? '★ ' : '') + s.name, 36), pct, color,
      `${fmtPct(pct)} · ${fmtInt(s.total)} alunos`, 220);
    y -= rowH;
  });

  // Insight rodapé
  const top3 = data.allSchoolsRanked.slice(0, 3).reduce((s: number, x: any) => s + x.total, 0);
  const top3Pct = universe > 0 ? (top3 / universe) * 100 : 0;
  const txt = `As 3 maiores escolas detêm ${fmtPct(top3Pct)} do alunado da área — mercado ${top3Pct > 50 ? 'concentrado' : 'fragmentado'}. Líder local: ${data.allSchoolsRanked[0]?.name ?? '—'}.`;
  page.drawRectangle({ x: M, y: 50, width: PDF_W - 2 * M, height: 28, color: TEAL_LIGHT, borderColor: TEAL, borderWidth: 0.5 });
  page.drawText(truncate(txt, 145), { x: M + 12, y: 60, size: 9.5, font, color: NAVY });
}

// ----- 8. Market share por segmento + heatmap
function renderPdfMarketShareSegmentos(page: PDFPage, font: PDFFont, bold: PDFFont, italic: PDFFont, ctx: ExportContext, data: any, n: number, total: number) {
  const d: DrawCtx = { page, font, bold, italic, ctx, pageNo: n, total };
  drawPDFHeader(d); drawPDFFooter(d);
  drawPDFTitle(d, 'Market Share por Segmento', 'Composição do alunado e participação por nível de ensino');

  const e = ctx.analysis.escola;
  const escTotal = num(e.qt_mat_educacao_infantil) + num(e.qt_mat_ensino_fundamental_anos_iniciais) + num(e.qt_mat_ensino_fundamental_anos_finais) + num(e.qt_mat_ensino_medio);
  const segs = [
    { k: 'EI',   l: 'Educação Infantil', v: num(e.qt_mat_educacao_infantil), c: TEAL },
    { k: 'EFI',  l: 'Fund. AI',          v: num(e.qt_mat_ensino_fundamental_anos_iniciais), c: NAVY },
    { k: 'EFII', l: 'Fund. AF',          v: num(e.qt_mat_ensino_fundamental_anos_finais), c: LIME },
    { k: 'EM',   l: 'Ensino Médio',      v: num(e.qt_mat_ensino_medio), c: TEAL_DARK },
  ].filter(s => s.v > 0);

  // Composição do alunado da escola — barra empilhada
  const compY = PDF_H - CONTENT_TOP - 90;
  page.drawText('COMPOSIÇÃO DO ALUNADO — ' + truncate(e.Escola, 50).toUpperCase(), { x: M, y: compY + 36, size: 9, font: bold, color: NAVY });
  const barW = PDF_W - 2 * M;
  const barH = 24;
  let bx = M;
  segs.forEach(s => {
    const segW = escTotal > 0 ? (s.v / escTotal) * barW : 0;
    page.drawRectangle({ x: bx, y: compY, width: segW, height: barH, color: s.c });
    if (segW > 60) {
      const lbl = `${s.k} · ${escTotal > 0 ? fmtPct(s.v / escTotal * 100, 0) : '—'}`;
      page.drawText(lbl, { x: bx + 6, y: compY + 8, size: 9, font: bold, color: WHITE });
    }
    bx += segW;
  });
  // legenda
  let lx = M;
  segs.forEach(s => {
    page.drawRectangle({ x: lx, y: compY - 18, width: 8, height: 8, color: s.c });
    page.drawText(`${s.l}: ${fmtInt(s.v)} (${escTotal > 0 ? fmtPct(s.v / escTotal * 100, 0) : '—'})`, { x: lx + 12, y: compY - 17, size: 8.5, font, color: TEXT });
    lx += font.widthOfTextAtSize(`${s.l}: ${fmtInt(s.v)} (${escTotal > 0 ? fmtPct(s.v / escTotal * 100, 0) : '—'})`, 8.5) + 30;
  });

  // Heatmap — top 8 escolas × 4 segmentos
  const heatY = compY - 60;
  page.drawText('HEATMAP DE MARKET SHARE POR SEGMENTO', { x: M, y: heatY, size: 9, font: bold, color: NAVY });
  const heatTop = data.allSchoolsRanked.slice(0, 8);
  const segKeys = [
    { k: 'qt_mat_educacao_infantil', l: 'EI' },
    { k: 'qt_mat_ensino_fundamental_anos_iniciais', l: 'EFI' },
    { k: 'qt_mat_ensino_fundamental_anos_finais', l: 'EFII' },
    { k: 'qt_mat_ensino_medio', l: 'EM' },
  ];
  const colSegW = 60;
  const rowLabelW = 240;
  const tblY = heatY - 16;
  // header
  page.drawText('ESCOLA', { x: M, y: tblY, size: 8, font: bold, color: MUTED });
  segKeys.forEach((s, i) => {
    const tx = M + rowLabelW + i * colSegW + colSegW / 2;
    page.drawText(s.l, { x: tx - 8, y: tblY, size: 8, font: bold, color: MUTED });
  });
  let hy = tblY - 14;
  heatTop.forEach((row: any) => {
    page.drawText((row.isTarget ? '★ ' : '  ') + truncate(row.name, 36), { x: M, y: hy + 4, size: 9, font: row.isTarget ? bold : font, color: row.isTarget ? TEAL : TEXT });
    segKeys.forEach((s, i) => {
      const val = num(row.data[s.k]);
      const segTotal = data.allSchoolsRanked.reduce((acc: number, r: any) => acc + num(r.data[s.k]), 0);
      const pct = segTotal > 0 ? (val / segTotal) * 100 : 0;
      const intensity = Math.min(pct / 30, 1);
      const cx = M + rowLabelW + i * colSegW;
      const cy = hy;
      // Cor com intensidade
      const fill = row.isTarget
        ? rgb(0.05 + (1 - intensity) * 0.5, 0.604 - intensity * 0.2, 0.588 - intensity * 0.2)
        : rgb(0.93 - intensity * 0.55, 0.93 - intensity * 0.7, 0.95 - intensity * 0.5);
      page.drawRectangle({ x: cx, y: cy, width: colSegW - 4, height: 18, color: fill, borderColor: BORDER_LIGHT, borderWidth: 0.3 });
      const tt = pct > 0 ? fmtPct(pct, 0) : '—';
      const tw = font.widthOfTextAtSize(tt, 9);
      page.drawText(tt, { x: cx + (colSegW - 4 - tw) / 2, y: cy + 5, size: 9, font: row.isTarget ? bold : font, color: intensity > 0.6 ? WHITE : NAVY });
    });
    hy -= 22;
  });

  // Leitura
  page.drawRectangle({ x: M, y: 50, width: PDF_W - 2 * M, height: 28, color: TEAL_LIGHT, borderColor: TEAL, borderWidth: 0.5 });
  const ms = ctx.analysis.marketShare;
  const segShares = [
    { l: 'Educação Infantil', v: ms.ei },
    { l: 'Fund. AI', v: ms.efi },
    { l: 'Fund. AF', v: ms.efii },
    { l: 'Ensino Médio', v: ms.em },
  ].filter(s => s.v > 0).sort((a, b) => b.v - a.v);
  const lider = segShares[0];
  const fraco = segShares[segShares.length - 1];
  const txt = lider && fraco
    ? `Maior penetração em ${lider.l} (${fmtPct(lider.v)}). Segmento mais vulnerável: ${fraco.l} (${fmtPct(fraco.v)}).`
    : 'Sem dados suficientes para leitura segmentada.';
  page.drawText(truncate(txt, 150), { x: M + 12, y: 60, size: 9.5, font, color: NAVY });
}

// ----- 9. Mensalidade
function renderPdfMensalidade(page: PDFPage, font: PDFFont, bold: PDFFont, italic: PDFFont, ctx: ExportContext, data: any, n: number, total: number) {
  const d: DrawCtx = { page, font, bold, italic, ctx, pageNo: n, total };
  drawPDFHeader(d); drawPDFFooter(d);
  drawPDFTitle(d, 'Mensalidade · Posicionamento Competitivo', 'Faixa da escola e do grupo concorrencial');

  const e = ctx.analysis.escola;
  const FAIXAS = ['até 399', '400 a 799', '800 a 1.399', '1.400 a 2.399', 'acima de R$ 2.400'];
  const FAIXA_LABEL: Record<string, string> = {
    'até 399': 'Até R$ 399',
    '400 a 799': 'R$ 400 a R$ 799',
    '800 a 1.399': 'R$ 800 a R$ 1.399',
    '1.400 a 2.399': 'R$ 1.400 a R$ 2.399',
    'acima de R$ 2.400': 'Acima de R$ 2.400',
  };
  const dist = FAIXAS.map(f => {
    const tot = (e.Mensalidade === f ? 1 : 0) + data.concs.filter((c: any) => c.escola.Mensalidade === f).length;
    return { faixa: f, label: FAIXA_LABEL[f], total: tot, hasTarget: e.Mensalidade === f };
  });

  // KPIs
  const cardW = (PDF_W - 2 * M - 48) / 5;
  const cardY = PDF_H - CONTENT_TOP - 130;
  const escFaixaLabel = (e.Mensalidade && e.Mensalidade !== '0') ? FAIXA_LABEL[e.Mensalidade] || e.Mensalidade : 'Dado não disponível';
  drawKpiCard(page, font, bold, M + 0 * (cardW + 12), cardY, cardW, 60, 'Faixa da Escola', escFaixaLabel, TEAL);
  drawKpiCard(page, font, bold, M + 1 * (cardW + 12), cardY, cardW, 60, 'Mesma Faixa', String(data.mesmaFaixa), TEAL);
  drawKpiCard(page, font, bold, M + 2 * (cardW + 12), cardY, cardW, 60, 'Acima', String(data.acima), NAVY);
  drawKpiCard(page, font, bold, M + 3 * (cardW + 12), cardY, cardW, 60, 'Abaixo', String(data.abaixo), LIME);
  drawKpiCard(page, font, bold, M + 4 * (cardW + 12), cardY, cardW, 60, 'Concorrentes', String(data.concs.length), NAVY);

  // Distribuição por faixa — gráfico horizontal
  page.drawText('DISTRIBUIÇÃO DE ESCOLAS POR FAIXA', { x: M, y: cardY - 26, size: 10, font: bold, color: NAVY });
  let y = cardY - 50;
  const max = Math.max(...dist.map(d2 => d2.total), 1);
  dist.forEach(d2 => {
    const color = d2.hasTarget ? TEAL : NAVY;
    drawHBar(page, font, M, y, PDF_W - 2 * M, 16, (d2.hasTarget ? '★ ' : '') + d2.label, (d2.total / max) * 100, color, `${d2.total} escola(s)`, 200);
    y -= 24;
  });

  // Leitura
  let leitura: string;
  if (data.acima > data.abaixo + data.mesmaFaixa) leitura = 'Concorrência majoritariamente em faixas superiores — espaço para reposicionamento de valor.';
  else if (data.abaixo > data.acima + data.mesmaFaixa) leitura = 'Concorrência em faixas inferiores — sustentar premium pedagógico e diferenciais.';
  else leitura = 'Posicionamento alinhado ao grupo concorrencial — disputa direta por valor e diferenciação.';
  page.drawRectangle({ x: M, y: 50, width: PDF_W - 2 * M, height: 28, color: TEAL_LIGHT, borderColor: TEAL, borderWidth: 0.5 });
  page.drawText(leitura, { x: M + 12, y: 60, size: 9.5, font, color: NAVY });
}

// ----- 10. Socioeconômico
function renderPdfSocioeconomico(page: PDFPage, font: PDFFont, bold: PDFFont, italic: PDFFont, ctx: ExportContext, data: any, n: number, total: number) {
  const d: DrawCtx = { page, font, bold, italic, ctx, pageNo: n, total };
  drawPDFHeader(d); drawPDFFooter(d);
  drawPDFTitle(d, 'Perfil Socioeconômico e Aderência Econômica', `Município de ${ctx.analysis.escola.Município}/${ctx.analysis.escola.UF}`);

  if (!data.d) {
    page.drawText('Dado não disponível na base fornecida.', { x: M, y: PDF_H / 2, size: 12, font: italic, color: MUTED });
    return;
  }

  // KPIs
  const cardW = (PDF_W - 2 * M - 48) / 5;
  const cardY = PDF_H - CONTENT_TOP - 130;
  const aderTone = data.aderenteCls.tone === 'teal' ? TEAL : data.aderenteCls.tone === 'lime' ? LIME : NAVY;
  drawKpiCard(page, font, bold, M + 0 * (cardW + 12), cardY, cardW, 60, 'Renda Média', fmtBRL(data.rendaMedia), TEAL);
  drawKpiCard(page, font, bold, M + 1 * (cardW + 12), cardY, cardW, 60, 'IDH Educação', String(data.idhEduc), NAVY);
  drawKpiCard(page, font, bold, M + 2 * (cardW + 12), cardY, cardW, 60, 'IDH Renda', String(data.idhRenda), LIME);
  drawKpiCard(page, font, bold, M + 3 * (cardW + 12), cardY, cardW, 60, 'Pop. 0–19', fmtInt(data.pop0_19), TEAL);
  drawKpiCard(page, font, bold, M + 4 * (cardW + 12), cardY, cardW, 60, 'Aderência ao ticket', data.matrix ? `${data.aderencia.toFixed(0)}%` : 'N/D', aderTone);

  // Matriz Renda × Faixa Etária (heatmap)
  if (data.matrix) {
    page.drawText('RENDA × FAIXA ETÁRIA · MUNICÍPIO', { x: M, y: cardY - 26, size: 10, font: bold, color: NAVY });
    const tblY = cardY - 46;
    const colW = [60, 110, 110, 110, 110];
    const headers = ['Classe', '0 a 4', '5 a 14', '15 a 19', 'Total'];
    let cx = M;
    headers.forEach((h, i) => {
      page.drawText(h, { x: cx + 6, y: tblY, size: 9, font: bold, color: MUTED });
      cx += colW[i];
    });
    const allCells: number[] = [];
    data.matrix.forEach((r: any) => { allCells.push(r.ate4, r.de5a14, r.de15a19); });
    const maxCell = Math.max(...allCells, 1);
    let ry = tblY - 16;
    const aderSet = new Set(data.faixasAderentes);
    data.matrix.forEach((r: any) => {
      const isAder = aderSet.has(r.faixa);
      cx = M;
      // classe
      page.drawText((isAder ? '● ' : '  ') + r.faixa, { x: cx + 6, y: ry + 4, size: 9, font: isAder ? bold : font, color: isAder ? TEAL : NAVY });
      cx += colW[0];
      [r.ate4, r.de5a14, r.de15a19].forEach((v, i) => {
        const intensity = v / maxCell;
        const fill = rgb(0.93 - intensity * 0.55, 0.96 - intensity * 0.4, 0.96 - intensity * 0.4);
        page.drawRectangle({ x: cx + 4, y: ry, width: colW[i + 1] - 8, height: 16, color: fill, borderColor: BORDER_LIGHT, borderWidth: 0.3 });
        const tt = fmtInt(v);
        const tw = font.widthOfTextAtSize(tt, 9);
        page.drawText(tt, { x: cx + colW[i + 1] - 8 - tw, y: ry + 4, size: 9, font, color: NAVY });
        cx += colW[i + 1];
      });
      const tot = r.ate4 + r.de5a14 + r.de15a19;
      const tt = fmtInt(tot);
      const tw = bold.widthOfTextAtSize(tt, 9);
      page.drawText(tt, { x: cx + colW[4] - 8 - tw, y: ry + 4, size: 9, font: bold, color: NAVY });
      ry -= 22;
    });
    page.drawText('● Faixas com poder de compra aderente ao ticket atual da escola.', { x: M, y: ry, size: 8, font: italic, color: MUTED });
  } else {
    // Fallback: pirâmide etária 0–19 a partir da demográfica
    page.drawText('DISTRIBUIÇÃO ETÁRIA 0–19 · MUNICÍPIO', { x: M, y: cardY - 26, size: 10, font: bold, color: NAVY });
    const faixas = ['0 a 4', '5 a 9', '10 a 14', '15 a 19'];
    const popData = faixas.map((f) => ({
      label: f,
      value: parseInt(data.d[`População por Faixa Etária (2025) - ${f} anos`] || '0'),
      color: TEAL,
    }));
    drawVBars(page, font, M + 30, cardY - 200, PDF_W - 2 * M - 60, 150, popData, undefined, fmtInt);
    page.drawText('Faixa etária com filhos em idade escolar — base de mercado potencial para captação no município.', { x: M, y: cardY - 220, size: 8.5, font: italic, color: MUTED });
  }

  // Leitura comercial
  const aderencia = data.aderencia;
  let leitura: string;
  if (aderencia >= 30) leitura = 'Base sólida de famílias com poder de compra alinhado — espaço para reforçar valor agregado e diferenciais pedagógicos.';
  else if (aderencia >= 15) leitura = 'Existe nicho relevante — comunique custo-benefício e proposta de valor para reduzir sensibilidade a preço.';
  else leitura = 'Base aderente limitada — atenção à elasticidade de preço e necessidade de comunicar fortemente o retorno do investimento educacional.';
  page.drawRectangle({ x: M, y: 50, width: PDF_W - 2 * M, height: 32, color: TEAL_LIGHT, borderColor: TEAL, borderWidth: 0.5 });
  page.drawText(`LEITURA COMERCIAL · ${data.aderenteCls.label.toUpperCase()} (${aderencia.toFixed(0)}%)`, { x: M + 12, y: 70, size: 9, font: bold, color: TEAL });
  drawParagraph(page, font, leitura, M + 12, 58, PDF_W - 2 * M - 24, 9.5, NAVY, 2);
}

// ----- 11. Potencial de Consumo
function renderPdfPotencial(page: PDFPage, font: PDFFont, bold: PDFFont, italic: PDFFont, ctx: ExportContext, data: any, n: number, total: number) {
  const d: DrawCtx = { page, font, bold, italic, ctx, pageNo: n, total };
  drawPDFHeader(d); drawPDFFooter(d);
  drawPDFTitle(d, 'Potencial de Consumo Educacional e Comercial', `Município de ${ctx.analysis.escola.Município}/${ctx.analysis.escola.UF}`);

  if (!data.potencial) {
    // Fallback: painel proxy com indicadores socioeconômicos disponíveis
    let y = PDF_H - CONTENT_TOP - 70;
    page.drawRectangle({ x: M, y: y - 36, width: PDF_W - 2 * M, height: 32, color: BEIGE, borderColor: BORDER, borderWidth: 0.5 });
    page.drawText('Pyxis Potencial de Consumo não publicado para este município.', { x: M + 14, y: y - 22, size: 10.5, font: italic, color: NAVY });
    page.drawText('Apresentamos abaixo proxies socioeconômicos do município para sustentar a leitura comercial.', { x: M + 14, y: y - 36, size: 9, font, color: MUTED });
    y -= 60;

    if (data.d) {
      const cardW = (PDF_W - 2 * M - 36) / 4;
      drawKpiCard(page, font, bold, M + 0 * (cardW + 12), y - 60, cardW, 60, 'Renda Média', fmtBRL(data.rendaMedia), TEAL);
      drawKpiCard(page, font, bold, M + 1 * (cardW + 12), y - 60, cardW, 60, 'IDH Renda', String(data.idhRenda), NAVY);
      drawKpiCard(page, font, bold, M + 2 * (cardW + 12), y - 60, cardW, 60, 'IDH Educação', String(data.idhEduc), LIME);
      drawKpiCard(page, font, bold, M + 3 * (cardW + 12), y - 60, cardW, 60, 'Pop. 0–19', fmtInt(data.pop0_19), TEAL);
    }

    page.drawRectangle({ x: M, y: 50, width: PDF_W - 2 * M, height: 28, color: TEAL_LIGHT, borderColor: TEAL, borderWidth: 0.5 });
    page.drawText('Sem proxy direto de consumo educacional — use renda média e IDH como referência de capacidade de pagamento da região.', { x: M + 12, y: 60, size: 9.5, font, color: NAVY });
    return;
  }

  const p = data.potencial;
  const matriculas = p.potencial.matriculas_total;
  const livros = p.potencial.livros_material_total;
  const didaticos = p.potencial.livros_didaticos;
  const totEd = matriculas + livros;

  // KPIs
  const cardW = (PDF_W - 2 * M - 36) / 4;
  const cardY = PDF_H - CONTENT_TOP - 130;
  drawKpiCard(page, font, bold, M + 0 * (cardW + 12), cardY, cardW, 60, 'Matrículas/Mensalidades', fmtBRL(matriculas, true), TEAL);
  drawKpiCard(page, font, bold, M + 1 * (cardW + 12), cardY, cardW, 60, 'Livros e Material Escolar', fmtBRL(livros, true), NAVY);
  drawKpiCard(page, font, bold, M + 2 * (cardW + 12), cardY, cardW, 60, 'Livros Didáticos', fmtBRL(didaticos, true), LIME);
  drawKpiCard(page, font, bold, M + 3 * (cardW + 12), cardY, cardW, 60, 'Total Educacional', fmtBRL(totEd, true), TEAL);

  // Distribuição por classe — barras + tabela
  const totalRenda = FAIXAS_RENDA.reduce((s, c) => s + (p.renda_classe[c] || 0), 0);
  const classData = FAIXAS_RENDA.map((c, i) => {
    const peso = totalRenda > 0 ? (p.renda_classe[c] || 0) / totalRenda : 0;
    return { classe: c, dom: p.domicilios_classe[c] || 0, pot: totEd * peso, pct: peso * 100 };
  });
  const colorByClass: Record<string, RGB> = {
    'A++': TEAL_DARK, 'A+': TEAL, 'B1': TEAL_LIGHT, 'B2': rgb(0.55, 0.75, 0.7),
    'C1': LIME, 'C2': rgb(0.7, 0.78, 0.4), 'D': rgb(0.85, 0.65, 0.35), 'E': rgb(0.78, 0.45, 0.3),
  };

  page.drawText('DISTRIBUIÇÃO DO CONSUMO EDUCACIONAL POR CLASSE', { x: M, y: cardY - 26, size: 10, font: bold, color: NAVY });
  drawVBars(page, font, M, cardY - 200, 480, 130, classData.map(c => ({
    label: c.classe, value: c.pot, color: colorByClass[c.classe] || TEAL,
  })), undefined, (v) => fmtBRL(v, true));

  // Tabela lateral
  const tx = M + 500;
  const tw = PDF_W - M - tx;
  page.drawText('CLASSE', { x: tx, y: cardY - 26, size: 8, font: bold, color: MUTED });
  page.drawText('DOMICÍLIOS', { x: tx + 70, y: cardY - 26, size: 8, font: bold, color: MUTED });
  page.drawText('%', { x: tx + tw - 30, y: cardY - 26, size: 8, font: bold, color: MUTED });
  let ty = cardY - 44;
  classData.forEach(c => {
    page.drawRectangle({ x: tx, y: ty, width: 6, height: 6, color: colorByClass[c.classe] || TEAL });
    page.drawText(c.classe, { x: tx + 12, y: ty, size: 9, font: bold, color: NAVY });
    page.drawText(fmtInt(c.dom), { x: tx + 70, y: ty, size: 9, font, color: TEXT });
    const pp = `${c.pct.toFixed(0)}%`;
    const pw = font.widthOfTextAtSize(pp, 9);
    page.drawText(pp, { x: tx + tw - pw - 6, y: ty, size: 9, font: bold, color: NAVY });
    ty -= 14;
  });

  // Leitura comercial
  const altaRenda = classData.filter(c => ['A++', 'A+', 'B1'].includes(c.classe)).reduce((s, c) => s + c.pct, 0);
  const baixaRenda = classData.filter(c => ['D', 'E'].includes(c.classe)).reduce((s, c) => s + c.pct, 0);
  let leitura: string;
  if (altaRenda >= 35) leitura = 'Massa de consumo concentrada em classes de maior renda — discurso de valor e proposta premium têm espaço relevante.';
  else if (baixaRenda >= 50) leitura = 'Massa concentrada em D/E — atenção à sensibilidade de preço; comunicar custo-benefício e condições facilitadas.';
  else leitura = 'Distribuição equilibrada — posicionamento intermediário tende a alcançar maior volume.';
  page.drawRectangle({ x: M, y: 50, width: PDF_W - 2 * M, height: 38, color: TEAL_LIGHT, borderColor: TEAL, borderWidth: 0.5 });
  page.drawText(`LEITURA COMERCIAL · A/B ${altaRenda.toFixed(0)}% · D/E ${baixaRenda.toFixed(0)}%`, { x: M + 12, y: 76, size: 9, font: bold, color: TEAL });
  drawParagraph(page, font, leitura, M + 12, 64, PDF_W - 2 * M - 24, 9.5, NAVY, 2);
}

// ----- 12. Insights estratégicos
function renderPdfInsights(page: PDFPage, font: PDFFont, bold: PDFFont, italic: PDFFont, ctx: ExportContext, data: any, n: number, total: number) {
  const d: DrawCtx = { page, font, bold, italic, ctx, pageNo: n, total };
  drawPDFHeader(d); drawPDFFooter(d);
  drawPDFTitle(d, 'Insights Estratégicos', 'Dado observado · leitura · implicação comercial');

  const ms = ctx.analysis.marketShare;
  const segShares = [
    { l: 'Educação Infantil', v: ms.ei },
    { l: 'Fund. AI', v: ms.efi },
    { l: 'Fund. AF', v: ms.efii },
    { l: 'Ensino Médio', v: ms.em },
  ].filter(s => s.v > 0).sort((a, b) => b.v - a.v);
  const bestSeg = segShares[0];

  const insights: { tag: string; tagColor: RGB; title: string; dado: string; leitura: string; implic: string }[] = [
    {
      tag: data.popGrowth >= 0 ? 'OPORTUNIDADE' : 'RISCO',
      tagColor: data.popGrowth >= 0 ? TEAL : RED,
      title: 'Tendência Demográfica',
      dado: `${data.popGrowth >= 0 ? '+' : ''}${data.popGrowth.toFixed(1).replace('.', ',')}% na faixa 0–4 (2024→2025)`,
      leitura: data.popGrowth >= 0 ? 'Base infantil cresce — sustenta demanda futura por Educação Infantil e séries iniciais.' : 'Faixa 0–4 em retração — captação de Educação Infantil mais disputada nos próximos ciclos.',
      implic: data.popGrowth >= 0 ? 'Reforçar comunicação de Educação Infantil agora protege o pipeline.' : 'Antecipar retenção e diversificar oferta.',
    },
    {
      tag: data.concs.length >= 10 ? 'RISCO' : 'POSICIONAMENTO',
      tagColor: data.concs.length >= 10 ? RED : NAVY,
      title: 'Pressão Competitiva',
      dado: `${data.concs.length} concorrentes · ${fmtInt(data.totalAlunadoArea)} alunos no universo`,
      leitura: data.isFragmented ? 'Mercado fragmentado: diferenciação é o principal driver de escolha.' : data.isLeader ? 'Posição relevante — barreira à entrada de novos concorrentes.' : 'Concorrência presente, espaço para ganho de share via posicionamento.',
      implic: data.adotamBrasil > 0 ? `${data.adotamBrasil} concorrente(s) já adota(m) Editora do Brasil.` : 'Nenhum concorrente adota Editora do Brasil — diferencial disponível.',
    },
    {
      tag: 'POSICIONAMENTO',
      tagColor: NAVY,
      title: 'Posicionamento',
      dado: `${fmtPct(ms.geral)} share geral · raio ${fmtKm(ctx.raioKm)}`,
      leitura: bestSeg ? `Maior penetração em ${bestSeg.l} (${fmtPct(bestSeg.v)}) — segmento que sustenta a marca.` : 'Sem segmento dominante claro.',
      implic: data.isLeader ? 'Capitalizar liderança em comunicação ("escola mais escolhida").' : 'Concentrar esforços comerciais no segmento de maior share.',
    },
    {
      tag: 'ADERÊNCIA',
      tagColor: LIME,
      title: 'Aderência Econômica',
      dado: data.matrix ? `${data.aderencia.toFixed(0)}% da pop. 0–19 nas faixas aderentes` : 'Dado não disponível',
      leitura: data.matrix ? `${data.aderenteCls.label} ao ticket atual${data.rendaMedia ? ` — renda média ${fmtBRL(data.rendaMedia)}.` : '.'}` : '',
      implic: data.aderencia >= 30 ? 'Comunicar valor e diferenciais pedagógicos sem recorrer a desconto.' : data.aderencia >= 15 ? 'Reforçar custo-benefício e parcelamento.' : 'Calibrar discurso comercial; considerar política de bolsas/escalonamento.',
    },
    {
      tag: 'OPORTUNIDADE',
      tagColor: TEAL,
      title: 'Oportunidade Comercial',
      dado: bestSeg?.l ?? 'Captação ampla',
      leitura: `Vitrine forte em ${bestSeg?.l || 'segmento principal'} é porta de entrada — famílias entram aqui e migram entre segmentos.`,
      implic: 'Estruturar funil dedicado: cadastros → agendas → visitas → matrículas, com meta clara e CPA monitorado.',
    },
    {
      tag: 'RISCO',
      tagColor: RED,
      title: 'Risco de Captação',
      dado: data.popGrowth < 0 || data.isFragmented || data.aderencia < 15 ? 'Atenção' : 'Controlado',
      leitura: [
        data.popGrowth < 0 ? 'queda demográfica 0–4' : null,
        data.isFragmented ? 'mercado pulverizado dilui share' : null,
        data.aderencia < 15 ? 'baixa aderência ao ticket' : null,
        data.concs.length >= 10 ? `${data.concs.length} concorrentes ativos` : null,
      ].filter(Boolean).join(' · ') || 'Sem fatores de risco relevantes.',
      implic: 'Definir meta agressiva (mas factível) e ampliar volume de interessados — funil mais largo no topo.',
    },
  ];

  // Grade 3×2
  const cw = (PDF_W - 2 * M - 24) / 3;
  const ch = 168;
  const gx = 12, gy = 12;
  insights.slice(0, 6).forEach((it, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = M + col * (cw + gx);
    const y = PDF_H - CONTENT_TOP - 70 - row * (ch + gy) - ch;
    page.drawRectangle({ x, y, width: cw, height: ch, color: WHITE, borderColor: BORDER, borderWidth: 0.5 });
    page.drawRectangle({ x, y: y + ch - 4, width: cw, height: 4, color: it.tagColor });
    // tag
    page.drawText(it.tag, { x: x + cw - 78, y: y + ch - 18, size: 7, font: bold, color: it.tagColor });
    // title
    page.drawText(it.title.toUpperCase(), { x: x + 12, y: y + ch - 18, size: 9, font: bold, color: NAVY });
    // dado
    let cy = y + ch - 38;
    cy = drawParagraph(page, bold, it.dado, x + 12, cy, cw - 24, 11, it.tagColor, 2);
    cy -= 6;
    cy = drawParagraph(page, font, 'Leitura: ' + it.leitura, x + 12, cy, cw - 24, 8.5, TEXT, 2);
    cy -= 4;
    drawParagraph(page, font, 'Implicação: ' + it.implic, x + 12, cy, cw - 24, 8.5, MUTED, 2);
  });
}

// ----- 13. Plano de Ação
function renderPdfPlanoAcao(page: PDFPage, font: PDFFont, bold: PDFFont, italic: PDFFont, ctx: ExportContext, data: any, n: number, total: number) {
  const d: DrawCtx = { page, font, bold, italic, ctx, pageNo: n, total };
  drawPDFHeader(d); drawPDFFooter(d);
  drawPDFTitle(d, 'Plano de Ação Comercial e Marketing', 'Ações priorizadas por horizonte de execução');

  const ms = ctx.analysis.marketShare;
  const segShares = [
    { l: 'Educação Infantil', v: ms.ei },
    { l: 'Fund. AI', v: ms.efi },
    { l: 'Fund. AF', v: ms.efii },
    { l: 'Ensino Médio', v: ms.em },
  ].filter(s => s.v > 0).sort((a, b) => b.v - a.v);
  const bestSeg = segShares[0];
  const weakSeg = segShares[segShares.length - 1];

  type Acao = { prio: string; prioColor: RGB; horiz: string; horizColor: RGB; titulo: string; oque: string; porque: string; base: string };
  const acoes: Acao[] = [
    { prio: data.aderencia < 15 ? 'CRÍTICA' : 'ALTA', prioColor: data.aderencia < 15 ? RED : TEAL, horiz: 'CURTO PRAZO', horizColor: RED,
      titulo: 'Reforçar comunicação de valor e diferenciais pedagógicos',
      oque: `Estruturar mensagens claras sobre o que a escola entrega de diferente${bestSeg ? ` em ${bestSeg.l}` : ''} — proposta pedagógica, resultados, formação e tecnologia.`,
      porque: data.aderencia < 15 ? 'Baixa aderência econômica torna preço o critério principal se valor não estiver evidente.' : 'A "Era de vender" deu lugar à "Era de ajudar a comprar" — família precisa enxergar valor antes do preço.',
      base: `Aderência ${data.aderencia.toFixed(0)}% · renda média ${fmtBRL(data.rendaMedia)}` },
    bestSeg && { prio: 'ALTA', prioColor: TEAL, horiz: 'PRÓXIMO CICLO COMERCIAL', horizColor: TEAL,
      titulo: `Concentrar captação no segmento líder: ${bestSeg.l}`,
      oque: `Definir meta numérica para ${bestSeg.l}, dimensionar o funil (cadastros → agendas → visitas → matrículas) e calcular CPA-alvo.`,
      porque: 'Meta sem volume de interessados é só desejo. Captação eficiente exige planejamento de funil.',
      base: `Share atual em ${bestSeg.l}: ${fmtPct(bestSeg.v)}` },
    (weakSeg || data.popGrowth < 0) && { prio: data.popGrowth < 0 ? 'CRÍTICA' : 'ALTA', prioColor: data.popGrowth < 0 ? RED : TEAL, horiz: 'PRÓXIMO CICLO COMERCIAL', horizColor: TEAL,
      titulo: 'Programa de rematrícula antecipada e jornada da família',
      oque: `Antecipar campanha de rematrícula${weakSeg ? `, com foco em ${weakSeg.l}` : ''}. Mapear sinais de evasão e atuar antes da decisão.`,
      porque: 'Cada aluno perdido (~12% ao ano) precisa ser reposto na captação. Fidelização >90% é patamar de excelência.',
      base: weakSeg ? `Segmento vulnerável: ${weakSeg.l} (${fmtPct(weakSeg.v)})` : `Queda demográfica: ${data.popGrowth.toFixed(1)}%` },
    { prio: data.isFragmented ? 'ALTA' : 'MÉDIA', prioColor: data.isFragmented ? TEAL : LIME, horiz: 'CONTÍNUA', horizColor: NAVY,
      titulo: 'Monitoramento competitivo estruturado',
      oque: `Acompanhar trimestralmente movimentos dos ${data.concs.length} concorrentes diretos: preço, novos segmentos, comunicação, parcerias.`,
      porque: `Mercado ${data.isFragmented ? 'fragmentado exige vigilância' : 'recompensa quem antecipa movimentos'}.`,
      base: `${data.concs.length} concorrentes na área de influência` },
    { prio: 'ALTA', prioColor: TEAL, horiz: 'CONTÍNUA', horizColor: NAVY,
      titulo: 'Reforço de marca e presença digital',
      oque: 'Profissionalizar comunicação: posicionamento claro, presença orgânica forte, depoimentos de famílias e indicadores de resultado.',
      porque: 'Famílias pesquisam antes de visitar — quem não aparece bem no digital perde matrícula antes do primeiro contato.',
      base: 'Pedagógico + marketing + captação + financeiro + fidelização' },
    { prio: 'ALTA', prioColor: TEAL, horiz: 'CONTÍNUA', horizColor: NAVY,
      titulo: 'Disciplina comercial: pessoas, processo e tecnologia',
      oque: 'Rotina semanal de acompanhamento, conversões por etapa, plano corretivo a cada 30 dias.',
      porque: 'Processo sem pessoas gera alienação; pessoas sem processo geram caos. Equilíbrio sustenta resultado.',
      base: 'Funil · meta × volume × eficiência' },
  ].filter(Boolean) as Acao[];

  // Render — lista vertical com cards compactos
  let y = PDF_H - CONTENT_TOP - 60;
  const cardH = 64;
  acoes.slice(0, 6).forEach((act, i) => {
    if (y - cardH < CONTENT_BOTTOM + 20) return;
    page.drawRectangle({ x: M, y: y - cardH, width: PDF_W - 2 * M, height: cardH, color: WHITE, borderColor: BORDER, borderWidth: 0.4 });
    page.drawRectangle({ x: M, y: y - cardH, width: 4, height: cardH, color: act.horizColor });
    // num
    page.drawCircle({ x: M + 22, y: y - cardH / 2, size: 11, color: TEAL_LIGHT });
    const nt = String(i + 1);
    const ntw = bold.widthOfTextAtSize(nt, 11);
    page.drawText(nt, { x: M + 22 - ntw / 2, y: y - cardH / 2 - 4, size: 11, font: bold, color: NAVY });
    // tag horizonte
    page.drawText(act.horiz, { x: M + 40, y: y - 16, size: 7, font: bold, color: act.horizColor });
    // tag prioridade
    const pw = bold.widthOfTextAtSize(act.prio, 8);
    page.drawRectangle({ x: PDF_W - M - pw - 14, y: y - 18, width: pw + 10, height: 12, color: act.prioColor });
    page.drawText(act.prio, { x: PDF_W - M - pw - 9, y: y - 16, size: 8, font: bold, color: WHITE });
    // titulo
    page.drawText(truncate(act.titulo, 100), { x: M + 40, y: y - 28, size: 10.5, font: bold, color: NAVY });
    // o que / por que
    const oqLines = wrapText('O que: ' + act.oque, font, 8.5, PDF_W - 2 * M - 56);
    page.drawText(truncate(oqLines[0], 150), { x: M + 40, y: y - 42, size: 8.5, font, color: TEXT });
    const pqLines = wrapText('Por que: ' + act.porque, font, 8.5, PDF_W - 2 * M - 56);
    page.drawText(truncate(pqLines[0], 150), { x: M + 40, y: y - 54, size: 8.5, font, color: MUTED });
    y -= cardH + 8;
  });
}

// ----- 14. Ação Comercial e Marketing (PDF)
function renderPdfAcaoComercial(page: PDFPage, font: PDFFont, bold: PDFFont, italic: PDFFont, ctx: ExportContext, data: any, n: number, total: number) {
  const d: DrawCtx = { page, font, bold, italic, ctx, pageNo: n, total };
  drawPDFHeader(d); drawPDFFooter(d);
  drawPDFTitle(d, 'Ação Comercial & Marketing', 'Recomendações de captação, posicionamento e comunicação');

  const ms = ctx.analysis.marketShare;
  const segShares = [
    { l: 'Educação Infantil', v: ms.ei },
    { l: 'Fund. AI', v: ms.efi },
    { l: 'Fund. AF', v: ms.efii },
    { l: 'Ensino Médio', v: ms.em },
  ].filter(x => x.v > 0).sort((a, b) => b.v - a.v);
  const bestSeg = segShares[0]?.l ?? 'segmento principal';
  const weakSeg = segShares[segShares.length - 1]?.l ?? 'segmento de menor share';

  const frentes = [
    { tag: 'CAPTAÇÃO',        titulo: `Funil dedicado em ${bestSeg}`,
      bullets: ['Meta numérica por etapa do funil.', 'CPA-alvo por canal.', 'Portas abertas e aulas-experiência.'] },
    { tag: 'RETENÇÃO',        titulo: `Reforço em ${weakSeg} e rematrícula`,
      bullets: ['Mapeamento de sinais de evasão.', 'Programa de fidelidade e irmãos.', 'Encontros de transição entre segmentos.'] },
    { tag: 'POSICIONAMENTO',  titulo: 'Comunicação de valor',
      bullets: ['Mensagem central pedagógica.',
        data.adotamBrasil > 0 ? `${data.adotamBrasil} concorrente(s) já adota(m) Editora do Brasil.` : 'Editora do Brasil como diferencial exclusivo.',
        'Depoimentos e provas sociais.'] },
    { tag: 'PRESENÇA DIGITAL', titulo: 'Marca, conteúdo e dados',
      bullets: ['Site otimizado para conversão.', 'Conteúdo orgânico mensal.', 'Dashboard de leads e conversão.'] },
  ];

  const cardW = (PDF_W - 2 * M - 16) / 2;
  const cardH = 130;
  const startY = PDF_H - CONTENT_TOP - 70;
  frentes.forEach((f, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = M + col * (cardW + 16);
    const y = startY - row * (cardH + 14) - cardH;
    drawCard(page, x, y, cardW, cardH, null);
    // Borda lateral teal
    page.drawRectangle({ x, y, width: 4, height: cardH, color: TEAL });
    // Tag
    page.drawText(f.tag, { x: x + 14, y: y + cardH - 18, size: 8.5, font: bold, color: TEAL });
    // Título
    page.drawText(truncate(f.titulo, 60), { x: x + 14, y: y + cardH - 38, size: 12, font: bold, color: NAVY });
    // Bullets
    let by = y + cardH - 60;
    f.bullets.forEach(b => {
      page.drawText('•', { x: x + 14, y: by, size: 9, font: bold, color: TEAL });
      const lines = wrapText(b, font, 9, cardW - 38);
      lines.slice(0, 2).forEach((ln, idx) => {
        page.drawText(ln, { x: x + 24, y: by - idx * 11, size: 9, font, color: TEXT });
      });
      by -= 11 * Math.min(2, lines.length) + 4;
    });
  });

  // Princípio (rodapé acima do footer)
  page.drawRectangle({ x: M, y: 56, width: PDF_W - 2 * M, height: 32, color: TEAL_LIGHT });
  page.drawRectangle({ x: M, y: 56, width: 3, height: 32, color: NAVY });
  page.drawText('PRINCÍPIO', { x: M + 12, y: 76, size: 8, font: bold, color: NAVY });
  page.drawText('Captação, retenção, posicionamento e presença digital se reforçam — ritual mensal sustenta o resultado.', {
    x: M + 80, y: 64, size: 9, font, color: NAVY,
  });
}

// ----- 14. Encerramento
function renderPdfEncerramento(page: PDFPage, font: PDFFont, bold: PDFFont, italic: PDFFont, ctx: ExportContext) {
  page.drawRectangle({ x: 0, y: 0, width: PDF_W, height: PDF_H, color: BEIGE });
  page.drawRectangle({ x: 0, y: 0, width: 8, height: PDF_H, color: TEAL });

  // Linha decorativa central
  const cx = PDF_W / 2;
  page.drawRectangle({ x: cx - 24, y: PDF_H - 90, width: 48, height: 3, color: TEAL });

  // Título
  const title = 'Obrigado pelo seu tempo';
  const tw = bold.widthOfTextAtSize(title, 32);
  page.drawText(title, { x: cx - tw / 2, y: PDF_H - 150, size: 32, font: bold, color: NAVY });

  // Texto principal
  let y = PDF_H - 210;
  const para1 = 'Encerrar esta análise é também abrir espaço para novas possibilidades. A Editora do Brasil agradece pela atenção, pelo tempo dedicado e pela oportunidade de apresentar esta visão comercial e estratégica.';
  const lines1 = wrapText(para1, font, 12, 700);
  for (const ln of lines1) {
    const w = font.widthOfTextAtSize(ln, 12);
    page.drawText(ln, { x: cx - w / 2, y, size: 12, font, color: TEXT });
    y -= 18;
  }

  // CTA destaque
  y -= 20;
  const cta = '"Conte com a Editora do Brasil para crescer junto."';
  const cw = italic.widthOfTextAtSize(cta, 18);
  page.drawText(cta, { x: cx - cw / 2, y, size: 18, font: italic, color: TEAL });
  y -= 32;
  const lema = 'Transformando o país pela educação.';
  const lw = bold.widthOfTextAtSize(lema, 16);
  page.drawText(lema, { x: cx - lw / 2, y, size: 16, font: bold, color: NAVY });

  // Linha inferior
  page.drawRectangle({ x: cx - 36, y: 90, width: 72, height: 2, color: NAVY });

  // Assinatura
  const sig = 'EDITORA DO BRASIL';
  const sw = bold.widthOfTextAtSize(sig, 11);
  page.drawText(sig, { x: cx - sw / 2, y: 64, size: 11, font: bold, color: NAVY });
  const tag = 'Educação que transforma, parceria que constrói.';
  const tgw = font.widthOfTextAtSize(tag, 10);
  page.drawText(tag, { x: cx - tgw / 2, y: 48, size: 10, font: italic, color: MUTED });
}

// ============================================================
// PPTX — RENDERER (espelha o PDF, formato editável)
// ============================================================

export async function exportPPTX(ctx: ExportContext): Promise<Blob> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.333" x 7.5"
  pptx.title = `Editora do Brasil — ${ctx.analysis.escola.Escola}`;
  pptx.company = 'Editora do Brasil';

  const data = buildPageData(ctx);
  const total = SLIDE_TITLES.length;

  const renderers: Array<(s: PptxGenJS.Slide, n: number) => void> = [
    (s) => pptCapa(s, ctx),
    (s, n) => pptAbertura(s, ctx, n, total),
    (s, n) => pptResumo(s, ctx, data, n, total),
    (s, n) => pptPanorama(s, ctx, data, n, total),
    (s, n) => pptConcorrenciaMapa(s, ctx, data, n, total),
    (s, n) => pptConcorrenciaTabela(s, ctx, data, n, total),
    (s, n) => pptMSGeral(s, ctx, data, n, total),
    (s, n) => pptMSSeg(s, ctx, data, n, total),
    (s, n) => pptMensalidade(s, ctx, data, n, total),
    (s, n) => pptSocio(s, ctx, data, n, total),
    (s, n) => pptPotencial(s, ctx, data, n, total),
    (s, n) => pptInsights(s, ctx, data, n, total),
    (s, n) => pptPlano(s, ctx, data, n, total),
    (s, n) => pptAcaoComercial(s, ctx, data, n, total),
    (s) => pptEncerramento(s, ctx),
  ];

  renderers.forEach((render, i) => {
    const slide = pptx.addSlide();
    render(slide, i + 1);
  });

  const blob = await pptx.write({ outputType: 'blob' });
  return blob as Blob;
}

// ----- helpers PPT -----
// Padrão editorial Santa Mônica:
// - sem header pesado; rodapé enxuto com 1 linha cinza
// - chip lavanda em vez de "linha teal" sob o título
// - cards lavanda discretos para KPI
// - leitura/callout: card branco com borda ESQUERDA grossa navy
function pptFooter(s: PptxGenJS.Slide, ctx: ExportContext, n: number, total: number) {
  s.addText(
    `${truncate(ctx.analysis.escola.Escola, 60)} · INEP ${ctx.analysis.escola['Código Inep']} · Raio ${fmtKm(ctx.raioKm)} ${ctx.raioMode === 'personalizado' ? '(personalizado)' : '(padrão)'}`,
    { x: PPT_M, y: PPT_H - 0.32, w: PPT_W - 2 * PPT_M - 0.8, h: 0.22, fontSize: 8.5, color: C.muted, italic: true, fontFace: 'Calibri' }
  );
  s.addText(`${n} · ${total}`, { x: PPT_W - PPT_M - 0.8, y: PPT_H - 0.32, w: 0.8, h: 0.22, fontSize: 8.5, color: C.muted, align: 'right', fontFace: 'Calibri' });
}
// Mantido por compatibilidade (não chama mais nada visual no topo)
function pptHeader(_s: PptxGenJS.Slide, _ctx: ExportContext) { /* no-op no padrão Santa Mônica */ }

// Chip "tag" lavanda no estilo Santa Mônica
function pptChip(s: PptxGenJS.Slide, x: number, y: number, label: string) {
  const w = Math.max(0.9, label.length * 0.085 + 0.4);
  s.addShape('roundRect', { x, y, w, h: 0.32, fill: { color: C.lavender }, line: { color: C.lavender }, rectRadius: 0.06 } as any);
  s.addText(label.toUpperCase(), { x, y: y + 0.04, w, h: 0.24, fontSize: 9.5, bold: true, color: C.navy, align: 'center', fontFace: 'Calibri', charSpacing: 1 });
}

// Título grande estilo editorial: chip + headline 32pt + parágrafo opcional
function pptTitle(s: PptxGenJS.Slide, title: string, subtitle?: string, chip?: string) {
  let yCursor = 0.55;
  if (chip) { pptChip(s, PPT_M, yCursor, chip); yCursor += 0.45; }
  s.addText(title, { x: PPT_M, y: yCursor, w: PPT_W - 2 * PPT_M, h: 0.85, fontSize: 32, bold: true, color: C.navy, fontFace: 'Calibri', shrinkText: true });
  if (subtitle) s.addText(subtitle, { x: PPT_M, y: yCursor + 0.85, w: PPT_W - 2 * PPT_M, h: 0.45, fontSize: 12, color: C.text, fontFace: 'Calibri' });
}

// KPI estilo Santa Mônica: card lavanda discreto, label cinza pequeno, valor grande navy
function pptKpi(s: PptxGenJS.Slide, x: number, y: number, w: number, h: number, label: string, value: string, _accent = C.teal) {
  s.addShape('roundRect', { x, y, w, h, fill: { color: C.lavender }, line: { color: C.lavender }, rectRadius: 0.08 } as any);
  s.addText(label, { x: x + 0.18, y: y + 0.14, w: w - 0.36, h: 0.28, fontSize: 10, color: C.muted, fontFace: 'Calibri' });
  s.addText(value, { x: x + 0.18, y: y + 0.42, w: w - 0.36, h: h - 0.5, fontSize: 22, bold: true, color: C.navy, fontFace: 'Calibri', shrinkText: true, valign: 'top' });
}

// Callout de leitura: card branco com borda lateral ESQUERDA grossa navy + chip de prefixo
function pptLeitura(s: PptxGenJS.Slide, txt: string, y = PPT_H - 1.0, h = 0.5, prefix = 'LEITURA') {
  const x = PPT_M;
  const w = PPT_W - 2 * PPT_M;
  // Borda lateral grossa
  s.addShape('rect', { x, y, w: 0.07, h, fill: { color: C.navy }, line: { color: C.navy } });
  // Texto: prefixo bold navy + corpo
  s.addText(
    [
      { text: `${prefix.toUpperCase()}  `, options: { bold: true, color: C.navy, fontSize: 9.5, charSpacing: 1 } },
      { text: txt, options: { color: C.text, fontSize: 11 } },
    ] as any,
    { x: x + 0.22, y: y + 0.03, w: w - 0.3, h: h - 0.04, fontFace: 'Calibri', valign: 'middle' }
  );
}

// Donut "fake" via 2 elipses sobrepostas + texto central. valuePct entre 0 e 100.
function pptDonut(s: PptxGenJS.Slide, cx: number, cy: number, r: number, valuePct: number, label: string, sub?: string) {
  // Anel de fundo (lavanda) e arco "preenchido" simulado por um anel mais escuro coberto parcialmente.
  // Como pptxgenjs não suporta arco parcial real, usamos chart pie nativo embebido.
  const data = [{
    name: 'donut',
    labels: ['v', 'r'],
    values: [Math.max(0, Math.min(100, valuePct)), Math.max(0, 100 - valuePct)],
  }];
  s.addChart((PptxGenJS as any).ChartType?.doughnut ?? 'doughnut', data, {
    x: cx - r, y: cy - r, w: r * 2, h: r * 2,
    chartColors: [C.navy, C.lavender],
    showLegend: false, showTitle: false, showValue: false,
    dataBorder: { pt: 0, color: C.white },
    holeSize: 70,
  } as any);
  // Valor central
  s.addText(`${valuePct.toFixed(valuePct >= 10 ? 1 : 1).replace('.', ',')}%`, {
    x: cx - r, y: cy - 0.22, w: r * 2, h: 0.45, fontSize: 20, bold: true, color: C.navy, align: 'center', valign: 'middle', fontFace: 'Calibri',
  });
  // Label abaixo
  s.addText(label, { x: cx - r - 0.3, y: cy + r + 0.05, w: r * 2 + 0.6, h: 0.3, fontSize: 11, bold: true, color: C.navy, align: 'center', fontFace: 'Calibri' });
  if (sub) s.addText(sub, { x: cx - r - 0.3, y: cy + r + 0.32, w: r * 2 + 0.6, h: 0.3, fontSize: 9, color: C.muted, align: 'center', fontFace: 'Calibri' });
}

// ----- 1. Capa
function pptCapa(s: PptxGenJS.Slide, ctx: ExportContext) {
  // Layout split: 60% texto branco | 40% painel navy decorativo
  const splitX = 8.0;
  s.background = { color: C.white };
  s.addShape('rect', { x: splitX, y: 0, w: PPT_W - splitX, h: PPT_H, fill: { color: C.navy }, line: { color: C.navy } });
  // Detalhes decorativos no painel navy (círculos concêntricos sutis)
  for (let i = 0; i < 4; i++) {
    const r = 0.6 + i * 0.7;
    s.addShape('ellipse', {
      x: PPT_W - 1.2 - r, y: PPT_H - 1.2 - r, w: r * 2, h: r * 2,
      fill: { type: 'none' } as any, line: { color: C.navySoft, width: 0.6 },
    });
  }
  s.addText('EDB', { x: PPT_W - 2.2, y: 0.6, w: 1.7, h: 0.5, fontSize: 22, bold: true, color: C.lavender, align: 'right', fontFace: 'Calibri', charSpacing: 2 });
  s.addText('Editora do Brasil', { x: PPT_W - 3.5, y: 1.0, w: 3.0, h: 0.3, fontSize: 11, italic: true, color: C.lavender, align: 'right', fontFace: 'Calibri' });

  // Lado esquerdo: chip + título grande + dados
  pptChip(s, 0.6, 0.85, `Diagnóstico Territorial · ${tipoLabel(ctx.presentationType)}`);
  s.addText(ctx.analysis.escola.Escola, {
    x: 0.6, y: 1.5, w: splitX - 1.0, h: 2.6,
    fontSize: 44, bold: true, color: C.navy, fontFace: 'Calibri', valign: 'top', shrinkText: true,
  });
  s.addText(`${ctx.analysis.escola.Município} · ${ctx.analysis.escola.UF}  |  Código INEP ${ctx.analysis.escola['Código Inep']}`, {
    x: 0.6, y: 4.3, w: splitX - 1.0, h: 0.4, fontSize: 13, color: C.text, fontFace: 'Calibri',
  });

  // Card lavanda com consultor
  s.addShape('roundRect', { x: 0.6, y: 5.0, w: splitX - 1.0, h: 1.5, fill: { color: C.lavender }, line: { color: C.lavender }, rectRadius: 0.1 } as any);
  if (ctx.session) {
    s.addText('Consultor', { x: 0.85, y: 5.15, w: 4, h: 0.3, fontSize: 11, color: C.muted, fontFace: 'Calibri' });
    s.addText(`${ctx.session.nome} · ${ctx.session.codigo}`, { x: 0.85, y: 5.42, w: splitX - 1.5, h: 0.35, fontSize: 14, bold: true, color: C.navy, fontFace: 'Calibri' });
  }
  s.addShape('line', { x: 0.85, y: 5.85, w: splitX - 1.5, h: 0, line: { color: C.lavenderDark, width: 0.5 } });
  s.addText('Editora do Brasil', { x: 0.85, y: 5.92, w: 4, h: 0.3, fontSize: 11, color: C.muted, fontFace: 'Calibri' });
  s.addText('Transformando o país pela educação.', { x: 0.85, y: 6.18, w: splitX - 1.5, h: 0.3, fontSize: 12, color: C.navy, fontFace: 'Calibri' });
}

// ----- 2. Abertura
function pptAbertura(s: PptxGenJS.Slide, ctx: ExportContext, n: number, total: number) {
  pptFooter(s, ctx, n, total);
  pptTitle(s, 'Uma Análise Construída Para a Sua Escola', undefined, 'Abertura Comercial');
  const intro = ctx.presentationType === 'prospeccao'
    ? `Reunimos dados públicos atualizados — Censo Escolar 2024, IBGE e estudos socioeconômicos — e cruzamos com inteligência de mercado para mapear oportunidades reais de captação, retenção e fortalecimento da marca da ${ctx.analysis.escola.Escola}.`
    : `Esta análise consolida o cenário competitivo, demográfico e socioeconômico da área de influência da ${ctx.analysis.escola.Escola} para sustentar a conversa de renovação. Tornamos visíveis as alavancas de crescimento e os riscos a serem endereçados nos próximos ciclos.`;
  s.addText(intro, { x: PPT_M, y: 2.05, w: PPT_W - 2 * PPT_M, h: 1.1, fontSize: 13, color: C.text, fontFace: 'Calibri' });

  // Dois blocos lado a lado: card navy "Inteligência de Dados" + texto "Nosso Compromisso"
  const colW = (PPT_W - 2 * PPT_M - 0.4) / 2;
  // Card navy à esquerda
  const cx = PPT_M, cy = 3.4, ch = 2.6;
  s.addShape('roundRect', { x: cx, y: cy, w: colW, h: ch, fill: { color: C.navy }, line: { color: C.navy }, rectRadius: 0.12 } as any);
  s.addText('Inteligência de Dados', { x: cx + 0.3, y: cy + 0.2, w: colW - 0.6, h: 0.45, fontSize: 18, bold: true, color: C.white, fontFace: 'Calibri' });
  s.addText('Censo Escolar 2024, IBGE, Pyxis Potencial de Consumo e cruzamento próprio com a base territorial da Editora do Brasil.', {
    x: cx + 0.3, y: cy + 0.75, w: colW - 0.6, h: 0.7, fontSize: 11, color: C.lavender, fontFace: 'Calibri', valign: 'top',
  });
  const bullets = ['Market share por segmento', 'Concorrência e mensalidade', 'Aderência econômica'];
  bullets.forEach((b, i) => {
    s.addText(`•  ${b}`, { x: cx + 0.3, y: cy + 1.55 + i * 0.32, w: colW - 0.6, h: 0.3, fontSize: 11, color: C.white, fontFace: 'Calibri' });
  });

  // Texto "Nosso Compromisso" à direita
  const rx = cx + colW + 0.4;
  s.addText('Nosso Compromisso', { x: rx, y: cy + 0.2, w: colW, h: 0.45, fontSize: 18, bold: true, color: C.navy, fontFace: 'Calibri' });
  s.addText('Mais do que dados: caminhos comerciais. A Editora do Brasil constrói parceria de longo prazo com a sua escola — fortalecendo relações e apoiando instituições que desejam crescer com consistência, relevância e valor.', {
    x: rx, y: cy + 0.8, w: colW, h: ch - 1.0, fontSize: 12, color: C.text, fontFace: 'Calibri', valign: 'top',
  });

  s.addText(`${ctx.analysis.escola.Escola} · INEP ${ctx.analysis.escola['Código Inep']} · Raio ${fmtKm(ctx.raioKm)} ${ctx.raioMode === 'personalizado' ? '(personalizado)' : '(padrão)'}`, {
    x: PPT_M, y: 6.15, w: PPT_W - 2 * PPT_M, h: 0.3, fontSize: 11, italic: true, color: C.muted, fontFace: 'Calibri',
  });
}

// ----- 3. Resumo
function pptResumo(s: PptxGenJS.Slide, ctx: ExportContext, data: any, n: number, total: number) {
  pptHeader(s, ctx); pptFooter(s, ctx, n, total);
  pptTitle(s, 'Resumo Executivo', 'Visão geral do cenário escolar na área de influência');
  const e = ctx.analysis.escola;
  const a = ctx.analysis;
  const segs = escolaSegmentos(e);
  const resumo = `${e.Escola}, em ${e.Município}/${e.UF}, atende ${segs.length} segmento(s) (${segs.join(', ') || 'não informado'}). A área de influência (raio de ${fmtKm(ctx.raioKm)}) reúne ${a.concorrentes.length + 1} escolas elegíveis e ${fmtInt(data.totalAlunadoArea)} alunos. Market share geral atual de ${fmtPct(a.marketShare.geral)} no município.`;
  s.addText(resumo, { x: PPT_M, y: 1.7, w: PPT_W - 2 * PPT_M, h: 0.9, fontSize: 12, color: C.text, fontFace: 'Calibri' });

  // Cenário município
  s.addText('CENÁRIO EDUCACIONAL DO MUNICÍPIO', { x: PPT_M, y: 2.7, w: 8, h: 0.3, fontSize: 10, bold: true, color: C.teal, fontFace: 'Calibri' });
  const w2 = (PPT_W - 2 * PPT_M - 0.2) / 2;
  pptKpi(s, PPT_M, 3.05, w2, 0.85, 'Total de Escolas', fmtInt(a.escolasMunicipio.length), C.navy);
  pptKpi(s, PPT_M + w2 + 0.2, 3.05, w2, 0.85, 'Total de Alunos', fmtInt(a.escolasMunicipio.reduce((s2: number, x: any) => s2 + num(x['Alunado Total']), 0)), C.navy);

  // Indicadores escola
  s.addText('INDICADORES DA ESCOLA ANALISADA', { x: PPT_M, y: 4.1, w: 8, h: 0.3, fontSize: 10, bold: true, color: C.teal, fontFace: 'Calibri' });
  const w3 = (PPT_W - 2 * PPT_M - 0.4) / 3;
  const mensLabel = (!e.Mensalidade || e.Mensalidade === '0') ? 'Dado não disponível' : e.Mensalidade;
  pptKpi(s, PPT_M, 4.45, w3, 0.85, 'Raio Operacional', fmtKm(ctx.raioKm), C.teal);
  pptKpi(s, PPT_M + w3 + 0.2, 4.45, w3, 0.85, 'Market Share', fmtPct(a.marketShare.geral), C.lime);
  pptKpi(s, PPT_M + 2 * (w3 + 0.2), 4.45, w3, 0.85, 'Faixa de Mensalidade', mensLabel, C.navy);

  s.addText('Metodologia: Censo Escolar 2024 + critérios de proximidade, faixa de mensalidade e segmentos comuns. Top 15 concorrentes por relevância competitiva.', {
    x: PPT_M, y: 5.5, w: PPT_W - 2 * PPT_M, h: 0.5, fontSize: 10, italic: true, color: C.muted, fontFace: 'Calibri',
  });
}

// ----- 4. Panorama
function pptPanorama(s: PptxGenJS.Slide, ctx: ExportContext, data: any, n: number, total: number) {
  pptHeader(s, ctx); pptFooter(s, ctx, n, total);
  pptTitle(s, 'Panorama Educacional da Região', `${data.a.concorrentes.length + 1} escolas · ${fmtInt(data.totalAlunos)} alunos · raio ${fmtKm(ctx.raioKm)}`);
  const cw = (PPT_W - 2 * PPT_M - 0.45) / 4;
  const lider = data.segPanorama[0];
  pptKpi(s, PPT_M + 0 * (cw + 0.15), 1.7, cw, 0.85, 'Escolas', String(data.a.concorrentes.length + 1), C.teal);
  pptKpi(s, PPT_M + 1 * (cw + 0.15), 1.7, cw, 0.85, 'Total de Alunos', fmtInt(data.totalAlunos), C.navy);
  pptKpi(s, PPT_M + 2 * (cw + 0.15), 1.7, cw, 0.85, 'Média/Escola', fmtInt(Math.round(data.totalAlunos / Math.max(1, data.a.concorrentes.length + 1))), C.lime);
  pptKpi(s, PPT_M + 3 * (cw + 0.15), 1.7, cw, 0.85, 'Segmento Líder', `${lider?.sigla ?? '—'} · ${data.totalAlunos > 0 ? fmtPct((lider?.alunos ?? 0) / data.totalAlunos * 100, 0) : '—'}`, C.teal);

  // Gráfico nativo PPT
  const chartData = [{
    name: 'Alunos',
    labels: data.segPanorama.map((x: any) => x.sigla),
    values: data.segPanorama.map((x: any) => x.alunos),
  }];
  s.addChart(pptxgenChartType('bar'), chartData, {
    x: PPT_M, y: 2.85, w: 8, h: 2.6,
    showTitle: true, title: 'Distribuição do Mercado por Segmento',
    titleFontFace: 'Calibri', titleFontSize: 11, titleColor: C.navy,
    chartColors: [C.teal, C.navy, C.lime, C.tealDark],
    showValue: true, valAxisHidden: false, catAxisLabelFontFace: 'Calibri', catAxisLabelFontSize: 10,
    barDir: 'col', dataLabelFontSize: 9, dataLabelColor: C.navy,
    showLegend: false, valAxisLabelFontSize: 9,
  });

  // Tabela lateral
  const rows: any[] = [
    [
      { text: 'Segmento', options: { bold: true, color: C.muted, fontSize: 10, fill: { color: C.beige } } },
      { text: 'Alunos',   options: { bold: true, color: C.muted, fontSize: 10, fill: { color: C.beige } } },
      { text: '%',         options: { bold: true, color: C.muted, fontSize: 10, fill: { color: C.beige } } },
    ],
    ...data.segPanorama.map((seg: any, i: number) => [
      { text: seg.nome, options: { fontSize: 10, color: C.navy, bold: i === 0 } },
      { text: fmtInt(seg.alunos), options: { fontSize: 10, color: C.text, align: 'right' } },
      { text: data.totalAlunos > 0 ? fmtPct(seg.alunos / data.totalAlunos * 100, 0) : '—', options: { fontSize: 10, color: C.text, align: 'right' } },
    ]),
  ];
  s.addTable(rows, { x: 8.5, y: 2.85, w: 4.4, colW: [2.3, 1.2, 0.9], rowH: 0.32, fontFace: 'Calibri', border: { type: 'solid', color: C.borderLight, pt: 0.5 } });

  const lider2 = data.segPanorama[0];
  const menor = data.segPanorama[data.segPanorama.length - 1];
  pptLeitura(s, `${lider2?.nome ?? '—'} lidera com ${data.totalAlunos > 0 ? fmtPct(lider2.alunos / data.totalAlunos * 100, 0) : '—'}. ${menor?.nome ?? '—'}: ${data.totalAlunos > 0 ? fmtPct(menor.alunos / data.totalAlunos * 100, 0) : '—'} — ${menor?.alunos === 0 ? 'ausência de oferta' : 'oportunidade de diferenciação'}.`, 5.7, 0.55, 'LEITURA ESTRATÉGICA');
}

// helper para chart enum
function pptxgenChartType(t: 'bar' | 'pie'): any {
  // pptxgenjs exporta enum ChartType
  return ((PptxGenJS as any).ChartType ?? { bar: 'bar', pie: 'pie' })[t];
}

// ----- 5. Concorrência mapa
function pptConcorrenciaMapa(s: PptxGenJS.Slide, ctx: ExportContext, data: any, n: number, total: number) {
  pptHeader(s, ctx); pptFooter(s, ctx, n, total);
  pptTitle(s, 'Concorrência — Mapa e Régua', `Raio ${fmtKm(ctx.raioKm)} · ${ctx.raioMode === 'personalizado' ? 'Personalizado' : 'Padrão'} · ${data.concs.length} concorrentes`);

  // Área do mapa — começa um pouco mais abaixo para não conflitar com subtítulo
  const mx = PPT_M, my = 1.95, mw = 8, mh = 3.8;
  s.addShape('rect', { x: mx, y: my, w: mw, h: mh, fill: { color: C.beige }, line: { color: C.border, width: 0.5 } });

  const e = data.e;
  const lat = parseFloat(String(e.Latitude));
  const lng = parseFloat(String(e.Longitude));
  if (!isNaN(lat) && !isNaN(lng)) {
    const points = data.concs.map((c: any) => ({
      lat: parseFloat(String(c.escola.Latitude)),
      lng: parseFloat(String(c.escola.Longitude)),
    })).filter((p: any) => !isNaN(p.lat) && !isNaN(p.lng));

    const r = ctx.raioKm * 1.4;
    const dLat = r / 111;
    const dLng = r / (111 * Math.cos(lat * Math.PI / 180));
    const proj = (la: number, lo: number) => ({
      x: mx + ((lo - (lng - dLng)) / (2 * dLng)) * mw,
      y: my + (1 - (la - (lat - dLat)) / (2 * dLat)) * mh,
    });

    // Grid
    for (let i = 1; i < 4; i++) {
      s.addShape('line', { x: mx + (mw / 4) * i, y: my, w: 0, h: mh, line: { color: C.borderLight, width: 0.4 } });
      s.addShape('line', { x: mx, y: my + (mh / 4) * i, w: mw, h: 0, line: { color: C.borderLight, width: 0.4 } });
    }
    // Círculo do raio
    const center = proj(lat, lng);
    const radiusIn = (ctx.raioKm / r) * (mw / 2);
    s.addShape('ellipse', {
      x: center.x - radiusIn, y: center.y - radiusIn, w: radiusIn * 2, h: radiusIn * 2,
      fill: { color: C.teal, transparency: 92 }, line: { color: C.teal, width: 0.8 },
    });
    // Concorrentes
    points.forEach((p: any) => {
      const { x, y } = proj(p.lat, p.lng);
      if (x < mx || x > mx + mw || y < my || y > my + mh) return;
      s.addShape('ellipse', { x: x - 0.06, y: y - 0.06, w: 0.12, h: 0.12, fill: { color: C.navy }, line: { color: C.white, width: 1 } });
    });
    // Escola
    s.addShape('ellipse', { x: center.x - 0.1, y: center.y - 0.1, w: 0.2, h: 0.2, fill: { color: C.teal }, line: { color: C.white, width: 1.5 } });
  } else {
    s.addText('Coordenadas da escola não disponíveis para renderização do mapa.', {
      x: mx + 0.3, y: my + mh / 2 - 0.2, w: mw - 0.6, h: 0.4, fontSize: 12, italic: true, color: C.muted, align: 'center', fontFace: 'Calibri',
    });
  }

  // Painel lateral
  const px = mx + mw + 0.2;
  const pw = PPT_W - PPT_M - px;
  const comCoord = data.concs.filter((c: any) => !isNaN(parseFloat(String(c.escola.Latitude))) && !isNaN(parseFloat(String(c.escola.Longitude)))).length;
  const panels = [
    { t: 'RÉGUA', items: [['Raio operacional', fmtKm(ctx.raioKm)], ['Modo', ctx.raioMode === 'personalizado' ? 'Personalizado' : 'Padrão']] },
    { t: 'COBERTURA', items: [['Plotados', `${comCoord} / ${data.concs.length}`], ['Estimados por CEP', String(data.concs.length - comCoord)]] },
    { t: 'LEGENDA', items: [['● Escola analisada', 'teal'], ['● Concorrentes', 'navy']] },
  ];
  let py = my;
  panels.forEach(pn => {
    s.addText(pn.t, { x: px, y: py, w: pw, h: 0.25, fontSize: 10, bold: true, color: C.teal, fontFace: 'Calibri' });
    py += 0.28;
    pn.items.forEach(([k, v]) => {
      s.addText(k, { x: px, y: py, w: pw * 0.6, h: 0.22, fontSize: 10, color: C.muted, fontFace: 'Calibri' });
      s.addText(v, { x: px + pw * 0.6, y: py, w: pw * 0.4, h: 0.22, fontSize: 10, bold: true, color: C.navy, align: 'right', fontFace: 'Calibri' });
      py += 0.24;
    });
    py += 0.15;
  });

  pptLeitura(s, `Área de influência: ${data.concs.length} concorrente(s) · ${data.mesmaFaixa} na mesma faixa · ${data.adotamBrasil} adota(m) Editora do Brasil.`, PPT_H - 1.0, 0.5);
}

// ----- 6. Concorrência tabela
function pptConcorrenciaTabela(s: PptxGenJS.Slide, ctx: ExportContext, data: any, n: number, total: number) {
  pptHeader(s, ctx); pptFooter(s, ctx, n, total);
  const TOP_N = 8;
  const shown = Math.min(TOP_N, data.concs.length);
  pptTitle(s, 'Concorrência — Tabela', `Top ${shown} concorrentes ordenados por relevância competitiva`);
  const headers = ['Escola', 'Mensalidade', 'Matrículas', 'Distância', 'Segmentos', 'Ed. Brasil'];
  const rows: any[] = [headers.map(h => ({ text: h, options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 10, fontFace: 'Calibri' } }))];
  data.concs.slice(0, TOP_N).forEach((c: any, idx: number) => {
    const dist = c.distancia !== null ? fmtKm(c.distancia) : (c.proximidadeCEP ? 'Estimado por CEP' : 'Sem coordenadas');
    const eb = (c.escola['Adota Brasil'] || '').toLowerCase() === 'sim';
    const fill = idx % 2 === 0 ? C.beige : C.white;
    rows.push([
      { text: c.escola.Escola, options: { fontSize: 9.5, color: C.navy, bold: true, fill: { color: fill }, fontFace: 'Calibri' } },
      { text: c.escola.Mensalidade && c.escola.Mensalidade !== '0' ? c.escola.Mensalidade : '—', options: { fontSize: 9.5, color: C.text, fill: { color: fill }, fontFace: 'Calibri' } },
      { text: fmtInt(num(c.escola['Alunado Total'])), options: { fontSize: 9.5, color: C.text, align: 'right', fill: { color: fill }, fontFace: 'Calibri' } },
      { text: dist, options: { fontSize: 9.5, color: c.distancia !== null ? C.text : (c.proximidadeCEP ? C.muted : C.red), fill: { color: fill }, fontFace: 'Calibri' } },
      { text: c.segmentosComum.join(' · ') || '—', options: { fontSize: 9.5, color: C.text, fill: { color: fill }, fontFace: 'Calibri' } },
      { text: eb ? '✓' : '—', options: { fontSize: 10, bold: true, color: eb ? C.teal : C.muted, align: 'center', fill: { color: fill }, fontFace: 'Calibri' } },
    ]);
  });
  s.addTable(rows, {
    x: PPT_M, y: 1.7, w: PPT_W - 2 * PPT_M,
    colW: [4.2, 1.8, 1.3, 1.6, 2.0, 1.4].map(v => v * (PPT_W - 2 * PPT_M) / 12.3),
    rowH: 0.32, fontFace: 'Calibri',
    border: { type: 'solid', color: C.border, pt: 0.4 },
  });
  const restantes = Math.max(0, data.concs.length - shown);
  const linhaResumo = `${data.concs.length} concorrente(s) elegíveis · ${data.mesmaFaixa} na mesma faixa · ${data.adotamBrasil} adota(m) Editora do Brasil.`;
  const nota = restantes > 0
    ? `Top ${shown} exibidos. Demais ${restantes} concorrente(s) disponíveis na ferramenta digital. Ranking por proximidade, faixa de mensalidade e segmentos comuns.`
    : 'Ranking por proximidade, faixa de mensalidade e segmentos comuns. Tabela completa também disponível na ferramenta digital.';
  s.addText(linhaResumo, {
    x: PPT_M, y: PPT_H - 1.05, w: PPT_W - 2 * PPT_M, h: 0.28, fontSize: 10, color: C.text, fontFace: 'Calibri',
  });
  s.addText(nota, {
    x: PPT_M, y: PPT_H - 0.78, w: PPT_W - 2 * PPT_M, h: 0.28, fontSize: 9, italic: true, color: C.muted, fontFace: 'Calibri',
  });
}

// ----- 7. MS Geral
function pptMSGeral(s: PptxGenJS.Slide, ctx: ExportContext, data: any, n: number, total: number) {
  pptHeader(s, ctx); pptFooter(s, ctx, n, total);
  pptTitle(s, 'Participação de Mercado — Visão Geral', undefined, 'Market Share');
  const ms = ctx.analysis.marketShare;
  const universe = data.totalAlunadoArea;
  const top3 = data.allSchoolsRanked.slice(0, 3).reduce((acc: number, x: any) => acc + x.total, 0);
  const top3Pct = universe > 0 ? (top3 / universe) * 100 : 0;

  // Parágrafo introdutório
  s.addText(
    `${truncate(ctx.analysis.escola.Escola, 60)} ${data.allSchoolsRanked[0]?.isTarget ? 'lidera o mercado local' : 'compõe o cenário competitivo'}, com ${fmtPct(ms.geral)} de market share geral. As 3 maiores escolas concentram ${fmtPct(top3Pct)} do alunado — indicativo de mercado ${top3Pct > 50 ? 'concentrado' : 'fragmentado'} ${top3Pct > 50 ? '' : 'com espaço real para crescimento'}.`,
    { x: PPT_M, y: 2.05, w: PPT_W - 2 * PPT_M, h: 0.7, fontSize: 12, color: C.text, fontFace: 'Calibri' }
  );

  // 5 donuts em grid 3 + 2
  const donuts: { v: number; label: string; sub: string }[] = [
    { v: ms.geral, label: 'Market Share Geral', sub: `Participação total no raio de ${fmtKm(ctx.raioKm)}` },
    { v: ms.ei,    label: 'Educação Infantil',  sub: 'Segmento Educação Infantil' },
    { v: ms.efii,  label: 'Fund. Anos Finais',  sub: 'Segmento EFII' },
    { v: ms.efi,   label: 'Fund. Anos Iniciais',sub: 'Segmento EFI' },
    { v: ms.em,    label: 'Ensino Médio',       sub: 'Segmento EM' },
  ];
  const r = 0.75;
  const rowY = [3.4, 5.15];
  // Linha 1: 3 donuts
  const cx1 = [3.0, 6.667, 10.333];
  for (let i = 0; i < 3; i++) pptDonut(s, cx1[i], rowY[0], r, donuts[i].v, donuts[i].label, donuts[i].sub);
  // Linha 2: 2 donuts (centralizados)
  const cx2 = [4.667, 8.667];
  for (let i = 0; i < 2; i++) pptDonut(s, cx2[i], rowY[1], r, donuts[i + 3].v, donuts[i + 3].label, donuts[i + 3].sub);

  pptLeitura(s, `As 3 maiores escolas detêm ${fmtPct(top3Pct)} do alunado. Mercado ${top3Pct > 50 ? 'concentrado' : 'fragmentado'}. Líder local: ${data.allSchoolsRanked[0]?.name ?? '—'}.`, PPT_H - 1.0, 0.5);
}

// ----- 8. MS por segmento
function pptMSSeg(s: PptxGenJS.Slide, ctx: ExportContext, data: any, n: number, total: number) {
  pptHeader(s, ctx); pptFooter(s, ctx, n, total);
  pptTitle(s, 'Market Share por Segmento', 'Composição do alunado e participação por nível de ensino');

  const e = ctx.analysis.escola;
  const escTotal = num(e.qt_mat_educacao_infantil) + num(e.qt_mat_ensino_fundamental_anos_iniciais) + num(e.qt_mat_ensino_fundamental_anos_finais) + num(e.qt_mat_ensino_medio);
  const segs = [
    { l: 'EI',   v: num(e.qt_mat_educacao_infantil), c: C.segEI },
    { l: 'EFI',  v: num(e.qt_mat_ensino_fundamental_anos_iniciais), c: C.segEFI },
    { l: 'EFII', v: num(e.qt_mat_ensino_fundamental_anos_finais), c: C.segEFII },
    { l: 'EM',   v: num(e.qt_mat_ensino_medio), c: C.segEM },
  ].filter(x => x.v > 0);

  s.addText(`COMPOSIÇÃO DO ALUNADO — ${truncate(e.Escola, 60)}`, {
    x: PPT_M, y: 1.7, w: PPT_W - 2 * PPT_M, h: 0.3, fontSize: 11, bold: true, color: C.navy, fontFace: 'Calibri',
  });
  // Barra empilhada manual
  const barW = PPT_W - 2 * PPT_M;
  const barH = 0.45;
  let bx = PPT_M;
  segs.forEach(seg => {
    const w = escTotal > 0 ? (seg.v / escTotal) * barW : 0;
    s.addShape('rect', { x: bx, y: 2.05, w, h: barH, fill: { color: seg.c }, line: { color: seg.c } });
    if (w > 0.8) {
      s.addText(`${seg.l} · ${escTotal > 0 ? fmtPct(seg.v / escTotal * 100, 0) : '—'}`, {
        x: bx, y: 2.05, w, h: barH, fontSize: 11, bold: true, color: C.white, align: 'center', valign: 'middle', fontFace: 'Calibri',
      });
    }
    bx += w;
  });

  // Heatmap como tabela colorida
  const heatTop = data.allSchoolsRanked.slice(0, 8);
  const segKeys = [
    { k: 'qt_mat_educacao_infantil', l: 'EI' },
    { k: 'qt_mat_ensino_fundamental_anos_iniciais', l: 'EFI' },
    { k: 'qt_mat_ensino_fundamental_anos_finais', l: 'EFII' },
    { k: 'qt_mat_ensino_medio', l: 'EM' },
  ];
  const headerRow: any[] = [
    { text: 'Escola', options: { bold: true, color: C.muted, fontSize: 9.5, fill: { color: C.beige }, fontFace: 'Calibri' } },
    ...segKeys.map(sk => ({ text: sk.l, options: { bold: true, color: C.muted, fontSize: 9.5, fill: { color: C.beige }, align: 'center', fontFace: 'Calibri' } })),
  ];
  const heatRows: any[] = [headerRow];
  heatTop.forEach((row: any) => {
    const cells: any[] = [{ text: (row.isTarget ? '★ ' : '') + truncate(row.name, 36), options: { fontSize: 9.5, bold: row.isTarget, color: row.isTarget ? C.teal : C.text, fontFace: 'Calibri' } }];
    segKeys.forEach(sk => {
      const v = num(row.data[sk.k]);
      const segTotal = data.allSchoolsRanked.reduce((acc: number, r: any) => acc + num(r.data[sk.k]), 0);
      const pct = segTotal > 0 ? (v / segTotal) * 100 : 0;
      const intensity = Math.min(pct / 30, 1);
      const fill = row.isTarget
        ? interpolateColor('DEF3F3', '0A6664', intensity)
        : interpolateColor('EBEBEF', '4F556A', intensity);
      cells.push({
        text: pct > 0 ? fmtPct(pct, 0) : '—',
        options: { fontSize: 9.5, color: intensity > 0.6 ? C.white : C.navy, align: 'center', fill: { color: fill }, fontFace: 'Calibri', bold: row.isTarget },
      });
    });
    heatRows.push(cells);
  });
  s.addTable(heatRows, {
    x: PPT_M, y: 2.85, w: PPT_W - 2 * PPT_M,
    colW: [5.0, 1.83, 1.83, 1.83, 1.84],
    rowH: 0.3, fontFace: 'Calibri',
    border: { type: 'solid', color: C.borderLight, pt: 0.4 },
  });

  const ms = ctx.analysis.marketShare;
  const segShares = [
    { l: 'Educação Infantil', v: ms.ei },
    { l: 'Fund. AI', v: ms.efi },
    { l: 'Fund. AF', v: ms.efii },
    { l: 'Ensino Médio', v: ms.em },
  ].filter(x => x.v > 0).sort((a, b) => b.v - a.v);
  const txt = segShares.length > 0
    ? `Maior penetração em ${segShares[0].l} (${fmtPct(segShares[0].v)}). Segmento mais vulnerável: ${segShares[segShares.length - 1].l} (${fmtPct(segShares[segShares.length - 1].v)}).`
    : 'Sem dados suficientes para leitura segmentada.';
  pptLeitura(s, txt, PPT_H - 1.0, 0.5);
}

function interpolateColor(from: string, to: string, t: number): string {
  const f = parseInt(from, 16), to2 = parseInt(to, 16);
  const r1 = (f >> 16) & 0xff, g1 = (f >> 8) & 0xff, b1 = f & 0xff;
  const r2 = (to2 >> 16) & 0xff, g2 = (to2 >> 8) & 0xff, b2 = to2 & 0xff;
  const r = Math.round(r1 + (r2 - r1) * t), g = Math.round(g1 + (g2 - g1) * t), b = Math.round(b1 + (b2 - b1) * t);
  return ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0').toUpperCase();
}

// ----- 9. Mensalidade
function pptMensalidade(s: PptxGenJS.Slide, ctx: ExportContext, data: any, n: number, total: number) {
  pptHeader(s, ctx); pptFooter(s, ctx, n, total);
  pptTitle(s, 'Mensalidade · Posicionamento Competitivo', 'Faixa da escola e do grupo concorrencial');
  const e = ctx.analysis.escola;
  const FAIXA_LABEL: Record<string, string> = {
    'até 399': 'Até R$ 399',
    '400 a 799': 'R$ 400 a R$ 799',
    '800 a 1.399': 'R$ 800 a R$ 1.399',
    '1.400 a 2.399': 'R$ 1.400 a R$ 2.399',
    'acima de R$ 2.400': 'Acima de R$ 2.400',
  };
  const escFaixaLabel = (e.Mensalidade && e.Mensalidade !== '0') ? FAIXA_LABEL[e.Mensalidade] || e.Mensalidade : 'Dado não disponível';

  const cw = (PPT_W - 2 * PPT_M - 0.6) / 5;
  pptKpi(s, PPT_M + 0 * (cw + 0.15), 1.7, cw, 0.85, 'Faixa da Escola', escFaixaLabel, C.teal);
  pptKpi(s, PPT_M + 1 * (cw + 0.15), 1.7, cw, 0.85, 'Mesma Faixa', String(data.mesmaFaixa), C.teal);
  pptKpi(s, PPT_M + 2 * (cw + 0.15), 1.7, cw, 0.85, 'Acima', String(data.acima), C.navy);
  pptKpi(s, PPT_M + 3 * (cw + 0.15), 1.7, cw, 0.85, 'Abaixo', String(data.abaixo), C.lime);
  pptKpi(s, PPT_M + 4 * (cw + 0.15), 1.7, cw, 0.85, 'Concorrentes', String(data.concs.length), C.navy);

  const FAIXAS = ['até 399', '400 a 799', '800 a 1.399', '1.400 a 2.399', 'acima de R$ 2.400'];
  const dist = FAIXAS.map(f => {
    const tot = (e.Mensalidade === f ? 1 : 0) + data.concs.filter((c: any) => c.escola.Mensalidade === f).length;
    return { faixa: FAIXA_LABEL[f] || f, total: tot, hasTarget: e.Mensalidade === f };
  });
  const chartData = [{ name: 'Escolas', labels: dist.map(d => d.faixa), values: dist.map(d => d.total) }];
  s.addChart(pptxgenChartType('bar'), chartData, {
    x: PPT_M, y: 2.85, w: PPT_W - 2 * PPT_M, h: 2.7,
    showTitle: true, title: 'Distribuição de Escolas por Faixa', titleFontFace: 'Calibri', titleFontSize: 11, titleColor: C.navy,
    barDir: 'bar', chartColors: [C.teal],
    showValue: true, dataLabelFontSize: 10, dataLabelColor: C.navy,
    catAxisLabelFontFace: 'Calibri', catAxisLabelFontSize: 10, valAxisLabelFontSize: 9,
    showLegend: false,
  });

  let txt: string;
  if (data.acima > data.abaixo + data.mesmaFaixa) txt = 'Concorrência majoritariamente em faixas superiores — espaço para reposicionamento de valor.';
  else if (data.abaixo > data.acima + data.mesmaFaixa) txt = 'Concorrência em faixas inferiores — sustentar premium pedagógico e diferenciais.';
  else txt = 'Posicionamento alinhado ao grupo concorrencial — disputa direta por valor e diferenciação.';
  pptLeitura(s, txt, PPT_H - 1.0, 0.5);
}

// ----- 10. Socioeconômico
function pptSocio(s: PptxGenJS.Slide, ctx: ExportContext, data: any, n: number, total: number) {
  pptHeader(s, ctx); pptFooter(s, ctx, n, total);
  pptTitle(s, 'Perfil Socioeconômico e Aderência Econômica', `Município de ${ctx.analysis.escola.Município}/${ctx.analysis.escola.UF}`);
  if (!data.d) {
    s.addText('Dado não disponível na base fornecida.', { x: PPT_M, y: 3, w: PPT_W - 2 * PPT_M, h: 0.5, fontSize: 14, italic: true, color: C.muted, align: 'center', fontFace: 'Calibri' });
    return;
  }
  const aderTone = data.aderenteCls.tone === 'teal' ? C.teal : data.aderenteCls.tone === 'lime' ? C.lime : C.navy;
  const cw = (PPT_W - 2 * PPT_M - 0.6) / 5;
  pptKpi(s, PPT_M + 0 * (cw + 0.15), 1.7, cw, 0.85, 'Renda Média', fmtBRL(data.rendaMedia), C.teal);
  pptKpi(s, PPT_M + 1 * (cw + 0.15), 1.7, cw, 0.85, 'IDH Educação', String(data.idhEduc), C.navy);
  pptKpi(s, PPT_M + 2 * (cw + 0.15), 1.7, cw, 0.85, 'IDH Renda', String(data.idhRenda), C.lime);
  pptKpi(s, PPT_M + 3 * (cw + 0.15), 1.7, cw, 0.85, 'Pop. 0–19', fmtInt(data.pop0_19), C.teal);
  pptKpi(s, PPT_M + 4 * (cw + 0.15), 1.7, cw, 0.85, 'Aderência ao ticket', data.matrix ? `${data.aderencia.toFixed(0)}%` : 'N/D', aderTone);

  if (data.matrix) {
    const aderSet = new Set(data.faixasAderentes);
    const allCells: number[] = [];
    data.matrix.forEach((r: any) => allCells.push(r.ate4, r.de5a14, r.de15a19));
    const maxCell = Math.max(...allCells, 1);
    const headerRow: any[] = [
      { text: 'Classe', options: { bold: true, color: C.muted, fontSize: 9.5, fill: { color: C.beige }, fontFace: 'Calibri' } },
      { text: '0 a 4', options: { bold: true, color: C.muted, fontSize: 9.5, fill: { color: C.beige }, align: 'right', fontFace: 'Calibri' } },
      { text: '5 a 14', options: { bold: true, color: C.muted, fontSize: 9.5, fill: { color: C.beige }, align: 'right', fontFace: 'Calibri' } },
      { text: '15 a 19', options: { bold: true, color: C.muted, fontSize: 9.5, fill: { color: C.beige }, align: 'right', fontFace: 'Calibri' } },
      { text: 'Total', options: { bold: true, color: C.muted, fontSize: 9.5, fill: { color: C.beige }, align: 'right', fontFace: 'Calibri' } },
    ];
    const rows: any[] = [headerRow];
    data.matrix.forEach((r: any) => {
      const isAder = aderSet.has(r.faixa);
      const tot = r.ate4 + r.de5a14 + r.de15a19;
      const cells = [r.ate4, r.de5a14, r.de15a19].map(v => {
        const intensity = v / maxCell;
        const fill = interpolateColor('FFFFFF', '129A96', intensity * 0.7);
        return { text: fmtInt(v), options: { fontSize: 9.5, color: intensity > 0.55 ? C.white : C.navy, align: 'right', fill: { color: fill }, fontFace: 'Calibri' } };
      });
      rows.push([
        { text: (isAder ? '● ' : '') + r.faixa, options: { fontSize: 9.5, bold: isAder, color: isAder ? C.teal : C.navy, fontFace: 'Calibri' } },
        ...cells,
        { text: fmtInt(tot), options: { fontSize: 9.5, bold: true, color: C.navy, align: 'right', fontFace: 'Calibri' } },
      ]);
    });
    s.addTable(rows, {
      x: PPT_M, y: 2.85, w: PPT_W - 2 * PPT_M,
      colW: [1.2, 2.6, 2.6, 2.6, 2.66],
      rowH: 0.28, fontFace: 'Calibri',
      border: { type: 'solid', color: C.borderLight, pt: 0.4 },
    });
  } else {
    // Fallback: gráfico de barras de população 0–19
    const faixas = ['0 a 4', '5 a 9', '10 a 14', '15 a 19'];
    const vals = faixas.map(f => parseInt(data.d[`População por Faixa Etária (2025) - ${f} anos`] || '0'));
    const chartData = [{ name: 'População', labels: faixas, values: vals }];
    s.addChart(pptxgenChartType('bar'), chartData, {
      x: PPT_M, y: 2.85, w: PPT_W - 2 * PPT_M, h: 2.7,
      showTitle: true, title: 'Distribuição etária 0–19 · município',
      titleFontFace: 'Calibri', titleFontSize: 11, titleColor: C.navy,
      barDir: 'col', chartColors: [C.teal],
      showValue: true, dataLabelFontSize: 9, dataLabelColor: C.navy,
      catAxisLabelFontFace: 'Calibri', catAxisLabelFontSize: 10, valAxisLabelFontSize: 9,
      showLegend: false,
    });
  }

  const aderencia = data.aderencia;
  let leitura: string;
  if (aderencia >= 30) leitura = 'Base sólida com poder de compra alinhado — espaço para reforçar valor agregado e diferenciais pedagógicos.';
  else if (aderencia >= 15) leitura = 'Existe nicho relevante — comunique custo-benefício e proposta de valor.';
  else leitura = 'Base aderente limitada — atenção à elasticidade de preço e necessidade de comunicar retorno do investimento.';
  pptLeitura(s, `${data.aderenteCls.label.toUpperCase()} (${aderencia.toFixed(0)}%) · ${leitura}`, PPT_H - 1.0, 0.5, 'LEITURA COMERCIAL');
}

// ----- 11. Potencial
function pptPotencial(s: PptxGenJS.Slide, ctx: ExportContext, data: any, n: number, total: number) {
  pptHeader(s, ctx); pptFooter(s, ctx, n, total);
  pptTitle(s, 'Potencial de Consumo Educacional e Comercial', `Município de ${ctx.analysis.escola.Município}/${ctx.analysis.escola.UF}`);
  if (!data.potencial) {
    // Fallback: painel proxy
    s.addShape('rect', { x: PPT_M, y: 1.7, w: PPT_W - 2 * PPT_M, h: 0.7, fill: { color: C.beige }, line: { color: C.border, width: 0.5 } });
    s.addText('Pyxis Potencial de Consumo não publicado para este município.', { x: PPT_M + 0.2, y: 1.78, w: PPT_W - 2 * PPT_M - 0.4, h: 0.3, fontSize: 12, italic: true, color: C.navy, fontFace: 'Calibri' });
    s.addText('Apresentamos proxies socioeconômicos do município para sustentar a leitura comercial.', { x: PPT_M + 0.2, y: 2.05, w: PPT_W - 2 * PPT_M - 0.4, h: 0.3, fontSize: 10, color: C.muted, fontFace: 'Calibri' });
    if (data.d) {
      const cw0 = (PPT_W - 2 * PPT_M - 0.45) / 4;
      pptKpi(s, PPT_M + 0 * (cw0 + 0.15), 2.65, cw0, 0.85, 'Renda Média', fmtBRL(data.rendaMedia), C.teal);
      pptKpi(s, PPT_M + 1 * (cw0 + 0.15), 2.65, cw0, 0.85, 'IDH Renda', String(data.idhRenda), C.navy);
      pptKpi(s, PPT_M + 2 * (cw0 + 0.15), 2.65, cw0, 0.85, 'IDH Educação', String(data.idhEduc), C.lime);
      pptKpi(s, PPT_M + 3 * (cw0 + 0.15), 2.65, cw0, 0.85, 'Pop. 0–19', fmtInt(data.pop0_19), C.teal);
    }
    pptLeitura(s, 'Sem proxy direto de consumo educacional — use renda média e IDH como referência de capacidade de pagamento da região.', PPT_H - 1.0, 0.5, 'LEITURA COMERCIAL');
    return;
  }
  const p = data.potencial;
  const matriculas = p.potencial.matriculas_total;
  const livros = p.potencial.livros_material_total;
  const didaticos = p.potencial.livros_didaticos;
  const totEd = matriculas + livros;

  const cw = (PPT_W - 2 * PPT_M - 0.45) / 4;
  pptKpi(s, PPT_M + 0 * (cw + 0.15), 1.7, cw, 0.85, 'Matrículas/Mensalidades', fmtBRL(matriculas, true), C.teal);
  pptKpi(s, PPT_M + 1 * (cw + 0.15), 1.7, cw, 0.85, 'Livros e Material Escolar', fmtBRL(livros, true), C.navy);
  pptKpi(s, PPT_M + 2 * (cw + 0.15), 1.7, cw, 0.85, 'Livros Didáticos', fmtBRL(didaticos, true), C.lime);
  pptKpi(s, PPT_M + 3 * (cw + 0.15), 1.7, cw, 0.85, 'Total Educacional', fmtBRL(totEd, true), C.teal);

  const totalRenda = FAIXAS_RENDA.reduce((sum, c) => sum + (p.renda_classe[c] || 0), 0);
  const classData = FAIXAS_RENDA.map(c => {
    const peso = totalRenda > 0 ? (p.renda_classe[c] || 0) / totalRenda : 0;
    return { classe: c, dom: p.domicilios_classe[c] || 0, pot: totEd * peso, pct: peso * 100 };
  });
  const chartData = [{ name: 'Potencial', labels: classData.map(c => c.classe), values: classData.map(c => Math.round(c.pot)) }];
  s.addChart(pptxgenChartType('bar'), chartData, {
    x: PPT_M, y: 2.85, w: 7.8, h: 2.7,
    showTitle: true, title: 'Distribuição do Consumo Educacional por Classe', titleFontFace: 'Calibri', titleFontSize: 11, titleColor: C.navy,
    barDir: 'col', chartColors: [C.teal],
    showValue: false, catAxisLabelFontFace: 'Calibri', catAxisLabelFontSize: 10, valAxisLabelFontSize: 9,
    showLegend: false,
  });

  // Tabela lateral
  const headerRow: any[] = [
    { text: 'Classe', options: { bold: true, color: C.muted, fontSize: 9, fill: { color: C.beige }, fontFace: 'Calibri' } },
    { text: 'Domicílios', options: { bold: true, color: C.muted, fontSize: 9, fill: { color: C.beige }, align: 'right', fontFace: 'Calibri' } },
    { text: '%', options: { bold: true, color: C.muted, fontSize: 9, fill: { color: C.beige }, align: 'right', fontFace: 'Calibri' } },
  ];
  const tblRows: any[] = [headerRow, ...classData.map(c => [
    { text: c.classe, options: { fontSize: 10, bold: true, color: C.navy, fontFace: 'Calibri' } },
    { text: fmtInt(c.dom), options: { fontSize: 10, color: C.text, align: 'right', fontFace: 'Calibri' } },
    { text: `${c.pct.toFixed(0)}%`, options: { fontSize: 10, bold: true, color: C.navy, align: 'right', fontFace: 'Calibri' } },
  ])];
  s.addTable(tblRows, { x: 8.55, y: 2.85, w: 4.4, colW: [1.0, 1.9, 1.5], rowH: 0.27, fontFace: 'Calibri', border: { type: 'solid', color: C.borderLight, pt: 0.4 } });

  const altaRenda = classData.filter(c => ['A++', 'A+', 'B1'].includes(c.classe)).reduce((sum, c) => sum + c.pct, 0);
  const baixaRenda = classData.filter(c => ['D', 'E'].includes(c.classe)).reduce((sum, c) => sum + c.pct, 0);
  let leitura: string;
  if (altaRenda >= 35) leitura = 'Massa concentrada em classes de maior renda — discurso de valor e proposta premium têm espaço relevante.';
  else if (baixaRenda >= 50) leitura = 'Massa em D/E — atenção à sensibilidade de preço; comunicar custo-benefício e condições facilitadas.';
  else leitura = 'Distribuição equilibrada — posicionamento intermediário tende a alcançar maior volume.';
  pptLeitura(s, `A/B ${altaRenda.toFixed(0)}% · D/E ${baixaRenda.toFixed(0)}% · ${leitura}`, PPT_H - 1.0, 0.5, 'LEITURA COMERCIAL');
}

// ----- 12. Insights
function pptInsights(s: PptxGenJS.Slide, ctx: ExportContext, data: any, n: number, total: number) {
  pptHeader(s, ctx); pptFooter(s, ctx, n, total);
  pptTitle(s, 'Leituras e Implicações Comerciais', undefined, 'Insights Estratégicos');
  s.addText(
    'Os dados consolidados revelam oportunidades concretas e riscos a serem gerenciados. A seguir, os principais insights com suas implicações diretas para a gestão comercial da escola.',
    { x: PPT_M, y: 2.05, w: PPT_W - 2 * PPT_M, h: 0.7, fontSize: 12, color: C.text, fontFace: 'Calibri' }
  );
  const ms = ctx.analysis.marketShare;
  const segShares = [
    { l: 'Educação Infantil', v: ms.ei },
    { l: 'Fund. AI', v: ms.efi },
    { l: 'Fund. AF', v: ms.efii },
    { l: 'Ensino Médio', v: ms.em },
  ].filter(x => x.v > 0).sort((a, b) => b.v - a.v);
  const bestSeg = segShares[0];

  // 4 insights principais (estilo Santa Mônica): tag + título + dado + leitura + implicação
  const insights = [
    { tag: data.popGrowth >= 0 ? 'OPORTUNIDADE' : 'RISCO',
      title: 'Tendência Demográfica — Faixa 0–4 anos',
      dado: `${data.popGrowth >= 0 ? '+' : ''}${data.popGrowth.toFixed(1).replace('.', ',')}% na faixa 0–4 anos.`,
      leitura: data.popGrowth >= 0 ? 'Base infantil cresce — sustenta demanda futura por Educação Infantil.' : 'Captação de Educação Infantil ficará mais disputada nos próximos anos.',
      implic: data.popGrowth >= 0 ? 'Reforçar Educação Infantil agora protege o pipeline.' : 'Antecipar ações de retenção e diversificar oferta de segmentos.' },
    { tag: data.concs.length >= 10 ? 'POSICIONAMENTO' : 'POSICIONAMENTO',
      title: `Pressão Competitiva — ${data.concs.length} Concorrentes`,
      dado: `${data.concs.length} concorrentes · ${fmtInt(data.totalAlunadoArea)} alunos no raio.`,
      leitura: data.isFragmented ? 'Mercado fragmentado: diferenciação é o principal driver de escolha.' : 'Concorrência presente, mas há espaço real para ganho de share.',
      implic: data.adotamBrasil > 0 ? `${data.adotamBrasil} concorrente(s) adota(m) Editora do Brasil — diferencial em disputa.` : 'A Editora do Brasil é um diferencial disponível e ainda não explorado pela concorrência local.' },
    { tag: 'OPORTUNIDADE',
      title: bestSeg ? `Liderança em ${bestSeg.l}` : 'Oportunidade de Captação',
      dado: bestSeg ? `${fmtPct(bestSeg.v)} de participação em ${bestSeg.l} — maior entre os segmentos.` : 'Captação ampla disponível.',
      leitura: `${bestSeg?.l || 'O segmento principal'} é vitrine forte e porta de entrada para outros níveis.`,
      implic: 'Estruturar funil dedicado: cadastros → agendas → visitas → matrículas.' },
    { tag: 'ATENÇÃO',
      title: 'Aderência Econômica',
      dado: data.matrix ? `Aderência ao ticket classificada como ${data.aderenteCls.label.toLowerCase()}.` : 'Aderência ao ticket não disponível.',
      leitura: data.matrix
        ? (data.aderencia >= 30 ? 'Base aderente sólida — espaço para reforçar valor agregado.' : data.aderencia >= 15 ? 'Existe nicho relevante — comunique custo-benefício.' : 'Base aderente limitada — elasticidade de preço relevante.')
        : 'Use renda média e IDH como referência de capacidade de pagamento.',
      implic: 'Calibrar discurso comercial, estruturar bolsas estratégicas e comunicar retorno do investimento educacional.' },
  ];

  // Grid 2x2 com cards estilo Santa Mônica (borda lateral navy + chip)
  const cw = (PPT_W - 2 * PPT_M - 0.3) / 2;
  const ch = 2.0;
  insights.forEach((it, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = PPT_M + col * (cw + 0.3);
    const y = 2.85 + row * (ch + 0.2);
    // Card branco com borda fina cinza
    s.addShape('roundRect', { x, y, w: cw, h: ch, fill: { color: C.white }, line: { color: C.border, width: 0.5 }, rectRadius: 0.05 } as any);
    // Borda esquerda grossa navy
    s.addShape('rect', { x, y, w: 0.07, h: ch, fill: { color: C.navy }, line: { color: C.navy } });
    // Chip
    pptChip(s, x + 0.25, y + 0.18, it.tag);
    // Título
    s.addText(it.title, { x: x + 0.25, y: y + 0.6, w: cw - 0.4, h: 0.4, fontSize: 14, bold: true, color: C.navy, fontFace: 'Calibri' });
    // Dado
    s.addText([
      { text: 'Dado: ', options: { bold: true, fontSize: 10, color: C.navy } },
      { text: it.dado + ' ', options: { fontSize: 10, color: C.text } },
      { text: 'Leitura: ', options: { bold: true, fontSize: 10, color: C.navy } },
      { text: it.leitura + ' ', options: { fontSize: 10, color: C.text } },
      { text: 'Implicação: ', options: { bold: true, fontSize: 10, color: C.navy } },
      { text: it.implic, options: { fontSize: 10, color: C.text } },
    ] as any, { x: x + 0.25, y: y + 1.05, w: cw - 0.4, h: ch - 1.15, fontFace: 'Calibri', valign: 'top' });
  });
}

// ----- 13. Plano de Ação
function pptPlano(s: PptxGenJS.Slide, ctx: ExportContext, data: any, n: number, total: number) {
  pptHeader(s, ctx); pptFooter(s, ctx, n, total);
  pptTitle(s, 'Plano de Ação Comercial e Marketing', 'Ações priorizadas por horizonte de execução');
  const ms = ctx.analysis.marketShare;
  const segShares = [
    { l: 'Educação Infantil', v: ms.ei },
    { l: 'Fund. AI', v: ms.efi },
    { l: 'Fund. AF', v: ms.efii },
    { l: 'Ensino Médio', v: ms.em },
  ].filter(x => x.v > 0).sort((a, b) => b.v - a.v);
  const bestSeg = segShares[0];
  const weakSeg = segShares[segShares.length - 1];
  const acoes = [
    { prio: data.aderencia < 15 ? 'CRÍTICA' : 'ALTA', prioColor: data.aderencia < 15 ? C.red : C.teal, horiz: 'CURTO PRAZO', horizColor: C.red,
      titulo: 'Reforçar comunicação de valor e diferenciais pedagógicos',
      oque: `Estruturar mensagens claras${bestSeg ? ` em ${bestSeg.l}` : ''} — proposta pedagógica, resultados, formação e tecnologia.`,
      porque: 'Família precisa enxergar valor antes do preço.' },
    bestSeg && { prio: 'ALTA', prioColor: C.teal, horiz: 'PRÓXIMO CICLO', horizColor: C.teal,
      titulo: `Concentrar captação no segmento líder: ${bestSeg.l}`,
      oque: `Meta numérica + funil (cadastros → agendas → visitas → matrículas) + CPA-alvo.`,
      porque: 'Captação eficiente exige planejamento de funil.' },
    (weakSeg || data.popGrowth < 0) && { prio: data.popGrowth < 0 ? 'CRÍTICA' : 'ALTA', prioColor: data.popGrowth < 0 ? C.red : C.teal, horiz: 'PRÓXIMO CICLO', horizColor: C.teal,
      titulo: 'Programa de rematrícula antecipada',
      oque: `Antecipar campanha${weakSeg ? `, foco em ${weakSeg.l}` : ''}. Mapear sinais de evasão.`,
      porque: 'Fidelização >90% é patamar de excelência.' },
    { prio: data.isFragmented ? 'ALTA' : 'MÉDIA', prioColor: data.isFragmented ? C.teal : C.lime, horiz: 'CONTÍNUA', horizColor: C.navy,
      titulo: 'Monitoramento competitivo estruturado',
      oque: `Acompanhar trimestralmente os ${data.concs.length} concorrentes: preço, segmentos, comunicação.`,
      porque: 'Mercado recompensa quem antecipa movimentos.' },
    { prio: 'ALTA', prioColor: C.teal, horiz: 'CONTÍNUA', horizColor: C.navy,
      titulo: 'Reforço de marca e presença digital',
      oque: 'Posicionamento claro, presença orgânica, depoimentos e indicadores de resultado.',
      porque: 'Famílias pesquisam antes de visitar.' },
    { prio: 'ALTA', prioColor: C.teal, horiz: 'CONTÍNUA', horizColor: C.navy,
      titulo: 'Disciplina comercial: pessoas, processo, tecnologia',
      oque: 'Rotina semanal de acompanhamento + conversões por etapa + plano corretivo a cada 30 dias.',
      porque: 'Equilíbrio dos três sustenta o resultado.' },
  ].filter(Boolean) as any[];

  let y = 1.65;
  acoes.slice(0, 6).forEach((a, i) => {
    const ch = 0.78;
    s.addShape('rect', { x: PPT_M, y, w: PPT_W - 2 * PPT_M, h: ch, fill: { color: C.white }, line: { color: C.border, width: 0.4 } });
    s.addShape('rect', { x: PPT_M, y, w: 0.06, h: ch, fill: { color: a.horizColor }, line: { color: a.horizColor } });
    s.addShape('ellipse', { x: PPT_M + 0.18, y: y + 0.18, w: 0.42, h: 0.42, fill: { color: C.tealLight }, line: { color: C.tealLight } });
    s.addText(String(i + 1), { x: PPT_M + 0.18, y: y + 0.18, w: 0.42, h: 0.42, fontSize: 14, bold: true, color: C.navy, align: 'center', valign: 'middle', fontFace: 'Calibri' });
    s.addText(a.horiz, { x: PPT_M + 0.7, y: y + 0.06, w: 4, h: 0.2, fontSize: 8, bold: true, color: a.horizColor, fontFace: 'Calibri' });
    s.addText(a.prio, { x: PPT_W - PPT_M - 1.2, y: y + 0.08, w: 1.05, h: 0.22, fontSize: 9, bold: true, color: C.white, fill: { color: a.prioColor }, align: 'center', fontFace: 'Calibri' });
    s.addText(a.titulo, { x: PPT_M + 0.7, y: y + 0.22, w: PPT_W - 2 * PPT_M - 1.5, h: 0.28, fontSize: 11.5, bold: true, color: C.navy, fontFace: 'Calibri' });
    s.addText([
      { text: 'O que: ', options: { bold: true, fontSize: 9.5, color: C.text } },
      { text: a.oque + '   ', options: { fontSize: 9.5, color: C.text } },
      { text: 'Por que: ', options: { bold: true, fontSize: 9.5, color: C.muted } },
      { text: a.porque, options: { fontSize: 9.5, color: C.muted } },
    ] as any, { x: PPT_M + 0.7, y: y + 0.5, w: PPT_W - 2 * PPT_M - 0.85, h: 0.27, fontFace: 'Calibri', valign: 'top' });
    y += ch + 0.05;
  });
}

// ----- 14. Ação Comercial e Marketing
function pptAcaoComercial(s: PptxGenJS.Slide, ctx: ExportContext, data: any, n: number, total: number) {
  pptHeader(s, ctx); pptFooter(s, ctx, n, total);
  pptTitle(s, 'Ação Comercial & Marketing', 'Recomendações de captação, posicionamento e comunicação', 'Roteiro de execução');

  const ms = ctx.analysis.marketShare;
  const segShares = [
    { l: 'Educação Infantil', v: ms.ei },
    { l: 'Fund. AI', v: ms.efi },
    { l: 'Fund. AF', v: ms.efii },
    { l: 'Ensino Médio', v: ms.em },
  ].filter(x => x.v > 0).sort((a, b) => b.v - a.v);
  const bestSeg = segShares[0]?.l ?? 'segmento principal';
  const weakSeg = segShares[segShares.length - 1]?.l ?? 'segmento de menor share';

  // 4 frentes em grid 2x2 (estilo cards com borda lateral teal)
  const frentes = [
    {
      tag: 'CAPTAÇÃO',
      titulo: `Funil dedicado em ${bestSeg}`,
      bullets: [
        'Meta numérica por etapa: cadastros → agendas → visitas → matrículas.',
        'CPA-alvo definido por canal (orgânico, indicação, mídia paga).',
        'Ofertas de portas abertas e aulas-experiência calendarizadas.',
      ],
    },
    {
      tag: 'RETENÇÃO',
      titulo: `Reforço em ${weakSeg} e rematrícula antecipada`,
      bullets: [
        'Mapear sinais de evasão por turma e antecipar conversa com a família.',
        'Programa de fidelidade e benefícios para irmãos / continuidade.',
        'Encontros pedagógicos de transição entre segmentos.',
      ],
    },
    {
      tag: 'POSICIONAMENTO',
      titulo: 'Comunicação de valor e diferenciais',
      bullets: [
        'Mensagem central: proposta pedagógica, formação docente e resultados.',
        `${data.adotamBrasil > 0 ? `${data.adotamBrasil} concorrente(s) já adota(m) Editora do Brasil — disputar atributo.` : 'Editora do Brasil como diferencial exclusivo na praça.'}`,
        'Depoimentos, indicadores e provas sociais em todos os pontos de contato.',
      ],
    },
    {
      tag: 'PRESENÇA DIGITAL',
      titulo: 'Marca, conteúdo e dados',
      bullets: [
        'Site otimizado para conversão (formulário, WhatsApp, agendamento).',
        'Conteúdo orgânico mensal: pedagogia, projetos, vida escolar.',
        'Dashboard mensal de leads, custo por matrícula e taxa de conversão.',
      ],
    },
  ];

  const cw = (PPT_W - 2 * PPT_M - 0.3) / 2;
  const ch = 2.0;
  frentes.forEach((f, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = PPT_M + col * (cw + 0.3);
    const y = 2.2 + row * (ch + 0.2);
    // Card branco
    s.addShape('roundRect', { x, y, w: cw, h: ch, fill: { color: C.white }, line: { color: C.border, width: 0.5 }, rectRadius: 0.05 } as any);
    // Borda lateral teal
    s.addShape('rect', { x, y, w: 0.07, h: ch, fill: { color: C.teal }, line: { color: C.teal } });
    // Chip
    pptChip(s, x + 0.25, y + 0.18, f.tag);
    // Título
    s.addText(f.titulo, { x: x + 0.25, y: y + 0.6, w: cw - 0.4, h: 0.45, fontSize: 13.5, bold: true, color: C.navy, fontFace: 'Calibri' });
    // Bullets
    s.addText(
      f.bullets.map(b => ({ text: b, options: { bullet: { code: '25A0' }, fontSize: 10, color: C.text, paraSpaceAfter: 4 } })) as any,
      { x: x + 0.3, y: y + 1.05, w: cw - 0.45, h: ch - 1.15, fontFace: 'Calibri', valign: 'top' }
    );
  });

  pptLeitura(
    s,
    'Captação, retenção, posicionamento e presença digital se reforçam: cada frente alimenta um indicador da próxima. Ritual mensal de acompanhamento sustenta o resultado.',
    PPT_H - 1.0, 0.5, 'PRINCÍPIO'
  );
}

// ----- 14. Encerramento
function pptEncerramento(s: PptxGenJS.Slide, ctx?: ExportContext) {
  // Layout split (espelha a capa): painel navy à esquerda + texto à direita em fundo branco
  s.background = { color: C.white };
  const splitX = 5.3;
  s.addShape('rect', { x: 0, y: 0, w: splitX, h: PPT_H, fill: { color: C.navy }, line: { color: C.navy } });
  // Decoração circular sutil
  for (let i = 0; i < 4; i++) {
    const r = 0.5 + i * 0.6;
    s.addShape('ellipse', {
      x: 0.6 - r, y: PPT_H - 0.6 - r, w: r * 2, h: r * 2,
      fill: { type: 'none' } as any, line: { color: C.navySoft, width: 0.6 },
    });
  }
  s.addText('EDB', { x: 0.5, y: 0.6, w: 2, h: 0.5, fontSize: 22, bold: true, color: C.lavender, fontFace: 'Calibri', charSpacing: 2 });
  s.addText('Editora do Brasil', { x: 0.5, y: 1.05, w: 4, h: 0.3, fontSize: 11, italic: true, color: C.lavender, fontFace: 'Calibri' });

  // Lado direito (texto)
  s.addText('Obrigado pelo Seu Tempo', { x: splitX + 0.6, y: 0.85, w: PPT_W - splitX - 1.0, h: 0.85, fontSize: 36, bold: true, color: C.navy, fontFace: 'Calibri' });
  s.addText(
    'Encerrar esta análise é também abrir espaço para novas possibilidades. A Editora do Brasil agradece pela atenção, pelo tempo dedicado e pela oportunidade de apresentar esta visão comercial e estratégica.',
    { x: splitX + 0.6, y: 1.95, w: PPT_W - splitX - 1.0, h: 1.5, fontSize: 13, color: C.text, fontFace: 'Calibri', valign: 'top' }
  );
  // Quote com borda lateral navy
  const qy = 3.65;
  s.addShape('rect', { x: splitX + 0.6, y: qy, w: 0.07, h: 0.7, fill: { color: C.navy }, line: { color: C.navy } });
  s.addText('"Conte com a Editora do Brasil para crescer junto."', {
    x: splitX + 0.85, y: qy, w: PPT_W - splitX - 1.25, h: 0.7, fontSize: 16, italic: true, color: C.navy, fontFace: 'Calibri', valign: 'middle',
  });
  // Card lavanda final
  const cy = 4.6;
  s.addShape('roundRect', { x: splitX + 0.6, y: cy, w: PPT_W - splitX - 1.0, h: 1.7, fill: { color: C.lavender }, line: { color: C.lavender }, rectRadius: 0.1 } as any);
  s.addText('Editora do Brasil', { x: splitX + 0.85, y: cy + 0.18, w: 4, h: 0.3, fontSize: 12, bold: true, color: C.navy, fontFace: 'Calibri' });
  s.addText('Transformando o país pela educação.', { x: splitX + 0.85, y: cy + 0.45, w: PPT_W - splitX - 1.5, h: 0.3, fontSize: 11, color: C.muted, fontFace: 'Calibri' });
  if (ctx?.session) {
    s.addText('Consultor Responsável', { x: splitX + 0.85, y: cy + 0.85, w: 4, h: 0.3, fontSize: 12, bold: true, color: C.navy, fontFace: 'Calibri' });
    s.addText(`${ctx.session.nome} · ${ctx.session.codigo}`, { x: splitX + 0.85, y: cy + 1.12, w: PPT_W - splitX - 1.5, h: 0.3, fontSize: 11, color: C.muted, fontFace: 'Calibri' });
  }
  s.addText('Educação que transforma, parceria que constrói.', { x: splitX + 0.6, y: PPT_H - 0.55, w: PPT_W - splitX - 1.0, h: 0.3, fontSize: 11, italic: true, color: C.muted, fontFace: 'Calibri' });
}

// ============================================================
// DOWNLOAD HELPERS
// ============================================================

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function buildFilename(ctx: ExportContext, ext: 'pdf' | 'pptx'): string {
  const safe = (s: string) => (s || '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
  return `editoradobrasil_${safe(ctx.analysis.escola.Escola).slice(0, 40)}_${safe(ctx.analysis.escola['Código Inep'])}.${ext}`;
}
