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
  num, formatPercent, formatNumber, parseBrNumber, getMensalidadeFaixa, getSegmentos,
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
  essenciaisInep?: string[]; // INEPs de concorrentes escolhidos manualmente pelo consultor (Etapa 2)
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
  page.drawText('CIT · Centro de Inteligência Territorial', {
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

function drawKpiCard(page: PDFPage, font: PDFFont, bold: PDFFont, x: number, y: number, w: number, h: number, label: string, value: string, accent: RGB = TEAL, valueStartSize = 22) {
  drawCard(page, x, y, w, h, accent);
  page.drawText(label.toUpperCase(), { x: x + 12, y: y + h - 18, size: 8, font, color: MUTED });
  // Valor — auto-shrink se muito grande
  let vSize = valueStartSize;
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
// CONCORRÊNCIA — helpers compartilhados PDF/PPT
// ============================================================

function tipoAdocaoOf(esc: any): string {
  const t = String(esc?.['Tipo de Adoção'] || '').trim();
  if (!t) return 'Sem dados';
  // Normaliza valores residuais como "Não", "Nao", "N/A", "-" para "Sem dados"
  const norm = t.toLowerCase().replace(/[ãâá]/g, 'a').replace(/[õô]/g, 'o');
  if (norm === 'nao' || norm === 'n/a' || norm === '-' || norm === 'sem dados') return 'Sem dados';
  return t;
}
function tipoAdocaoIsND(esc: any): boolean {
  return tipoAdocaoOf(esc) === 'Sem dados';
}
function distanciaLabel(c: any): { text: string; muted: boolean } {
  if (c.distancia !== null && c.distancia !== undefined) {
    return { text: fmtKm(c.distancia), muted: false };
  }
  if (c.proximidadeCEP) return { text: 'Estimado por CEP', muted: true };
  return { text: 'Sem coordenadas', muted: true };
}

/**
 * Seleciona até 4 mini cards de principais concorrentes:
 *  1) prioridade total para os escolhidos manualmente (essenciais);
 *  2) se faltar, completar com os melhores candidatos restantes usando:
 *     tipo de adoção (igual ao da escola analisada) → proximidade →
 *     segmentos em comum → mesma faixa de mensalidade → alunado.
 */
function selectTopConcorrentes(
  concs: any[], escola: any, essenciaisInep: string[], targetCount = 4,
): { top: any[]; restantes: any[]; isEssencial: (c: any) => boolean } {
  const essSet = new Set(essenciaisInep.map(String));
  const isEssencial = (c: any) => essSet.has(String(c?.escola?.['Código Inep']));

  const escTipo = String(escola?.['Tipo de Adoção'] || '').trim().toLowerCase();
  const escFaixa = getMensalidadeFaixa(escola?.Mensalidade);

  const score = (c: any) => {
    const tipo = String(c.escola?.['Tipo de Adoção'] || '').trim().toLowerCase();
    const tipoMatch = escTipo && tipo && tipo === escTipo ? 1 : 0;
    const prox = c.distancia !== null && c.distancia !== undefined ? c.distancia : (c.proximidadeCEP ? 9000 : 9999);
    const segCount = (c.segmentosComum || []).length;
    const faixaMatch = (escFaixa >= 0 && getMensalidadeFaixa(c.escola?.Mensalidade) === escFaixa) ? 1 : 0;
    const alunado = num(c.escola?.['Alunado Total']);
    return { tipoMatch, prox, segCount, faixaMatch, alunado };
  };
  const cmp = (a: any, b: any) => {
    const sa = score(a), sb = score(b);
    if (sa.tipoMatch !== sb.tipoMatch) return sb.tipoMatch - sa.tipoMatch;
    if (sa.prox !== sb.prox) return sa.prox - sb.prox;
    if (sa.segCount !== sb.segCount) return sb.segCount - sa.segCount;
    if (sa.faixaMatch !== sb.faixaMatch) return sb.faixaMatch - sa.faixaMatch;
    return sb.alunado - sa.alunado;
  };

  const ess = concs.filter(isEssencial);
  const naoEss = concs.filter(c => !isEssencial(c));

  let top: any[];
  if (ess.length >= targetCount) {
    // Mais de 4 essenciais: escolher 4 entre eles pelos critérios
    top = [...ess].sort(cmp).slice(0, targetCount);
  } else {
    const fill = [...naoEss].sort(cmp).slice(0, targetCount - ess.length);
    top = [...ess, ...fill];
  }
  const topSet = new Set(top.map(c => String(c.escola?.['Código Inep'])));
  // Restantes ordenados pelos mesmos critérios (com essenciais primeiro entre eles)
  const restantes = concs
    .filter(c => !topSet.has(String(c.escola?.['Código Inep'])))
    .sort((a, b) => {
      const ea = isEssencial(a) ? 1 : 0, eb = isEssencial(b) ? 1 : 0;
      if (ea !== eb) return eb - ea;
      return cmp(a, b);
    });
  return { top, restantes, isEssencial };
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
  'Concorrência',
  'Market Share',
  'Faixa de Mensalidade',
  'Perfil Socioeconômico e Aderência Econômica',
  'Potencial de Consumo Educacional e Comercial',
  'Insights e Recomendações',
  'Ação comercial e marketing',
  'Encerramento',
];

// Slide 5 unificado de concorrência — sem mapa. Sempre renderizado.

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

  const slideRenderersAll: Array<{ render: (page: PDFPage, n: number) => void; key?: string }> = [
    { render: (p) => renderPdfCapa(p, font, bold, italic, ctx) },
    { render: (p, n) => renderPdfAbertura(p, font, bold, italic, ctx, n, total) },
    { render: (p, n) => renderPdfResumo(p, font, bold, italic, ctx, data, n, total) },
    { render: (p, n) => renderPdfPanorama(p, font, bold, italic, ctx, data, n, total) },
    { render: (p, n) => renderPdfConcorrencia(p, font, bold, italic, ctx, data, n, total) },
    { render: (p, n) => renderPdfMarketShare(p, font, bold, italic, ctx, data, n, total) },
    { render: (p, n) => renderPdfMensalidade(p, font, bold, italic, ctx, data, n, total) },
    { render: (p, n) => renderPdfSocioeconomico(p, font, bold, italic, ctx, data, n, total) },
    { render: (p, n) => renderPdfPotencial(p, font, bold, italic, ctx, data, n, total) },
    { render: (p, n) => renderPdfInsights(p, font, bold, italic, ctx, data, n, total) },
    { render: (p, n) => renderPdfAcaoComercial(p, font, bold, italic, ctx, data, n, total) },
    { render: (p) => renderPdfEncerramento(p, font, bold, italic, ctx) },
  ];
  const slideRenderers = slideRenderersAll.map(r => r.render);

  slideRenderers.forEach((render, i) => {
    const page = pdf.addPage([PDF_W, PDF_H]);
    render(page, i + 1);
  });

  const bytes = await pdf.save();
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}

// ----- 1. Capa
function renderPdfCapa(page: PDFPage, font: PDFFont, bold: PDFFont, italic: PDFFont, ctx: ExportContext) {
  // ============================================================
  // CAPA PDF — composição central, alinhada ao PPT.
  // 16:9 (960x540pt). Margem 0,4" ≈ 29pt nas bordas.
  // ============================================================
  const e = ctx.analysis.escola;
  const SAFE = 29;
  const cx = PDF_W / 2;
  const center = (text: string, fnt: PDFFont, size: number) => cx - fnt.widthOfTextAtSize(text, size) / 2;

  // Fundo navy
  page.drawRectangle({ x: 0, y: 0, width: PDF_W, height: PDF_H, color: NAVY });

  // Filetes lima topo/base
  page.drawRectangle({ x: 0, y: PDF_H - 4, width: PDF_W, height: 4, color: LIME });
  page.drawRectangle({ x: 0, y: 0, width: PDF_W, height: 4, color: LIME });

  // ---------- TOPO: marca ----------
  const edb = 'E D B';
  page.drawText(edb, { x: center(edb, bold, 22), y: PDF_H - SAFE - 36, size: 22, font: bold, color: WHITE });
  const edbSub = 'EDITORA DO BRASIL';
  page.drawText(edbSub, { x: center(edbSub, font, 9), y: PDF_H - SAFE - 56, size: 9, font, color: TEAL_LIGHT });

  // Filete teal centralizado
  page.drawRectangle({ x: cx - 22, y: PDF_H - SAFE - 76, width: 44, height: 2, color: TEAL });

  // ---------- BLOCO CENTRAL ----------
  // Subtítulo: "CIT · Centro de Inteligência Territorial · [Tipo]"
  const subL = 'CIT · Centro de Inteligência Territorial';
  const subSep = '  ·  ';
  const subR = tipoLabel(ctx.presentationType);
  const subSize = 14;
  const wL = font.widthOfTextAtSize(subL, subSize);
  const wSep = bold.widthOfTextAtSize(subSep, subSize);
  const wR = bold.widthOfTextAtSize(subR, subSize);
  const subTotal = wL + wSep + wR;
  let subX = cx - subTotal / 2;
  const subY = PDF_H - SAFE - 130;
  page.drawText(subL, { x: subX, y: subY, size: subSize, font, color: TEAL_LIGHT });
  subX += wL;
  page.drawText(subSep, { x: subX, y: subY, size: subSize, font: bold, color: LIME });
  subX += wSep;
  page.drawText(subR, { x: subX, y: subY, size: subSize, font: bold, color: WHITE });

  // HEADLINE: nome da escola — busca tamanho que caiba (até 2 linhas)
  const maxNameW = PDF_W - 2 * SAFE - 40;
  let nameSize = 44;
  let nameLines: string[] = [];
  while (nameSize >= 26) {
    nameLines = wrapText(e.Escola, bold, nameSize, maxNameW);
    if (nameLines.length <= 2 && nameLines.every(l => bold.widthOfTextAtSize(l, nameSize) <= maxNameW)) break;
    nameSize -= 2;
  }
  nameLines = nameLines.slice(0, 2);
  const lineH = nameSize * 1.15;
  const blockH = nameLines.length * lineH;
  const blockTop = PDF_H / 2 + blockH / 2 - 10;
  nameLines.forEach((ln, i) => {
    page.drawText(ln, {
      x: center(ln, bold, nameSize),
      y: blockTop - (i + 1) * lineH + lineH * 0.25,
      size: nameSize, font: bold, color: WHITE,
    });
  });

  // Filete lima abaixo do nome
  const fileteY = PDF_H / 2 - blockH / 2 - 22;
  page.drawRectangle({ x: cx - 28, y: fileteY, width: 56, height: 2, color: LIME });

  // Município/UF + INEP
  const metaL = `${e.Município} · ${e.UF}`;
  const metaSep = '     |     ';
  const metaR = `Código INEP ${e['Código Inep']}`;
  const metaSize = 12;
  const mwL = bold.widthOfTextAtSize(metaL, metaSize);
  const mwSep = font.widthOfTextAtSize(metaSep, metaSize);
  const mwR = font.widthOfTextAtSize(metaR, metaSize);
  let metaX = cx - (mwL + mwSep + mwR) / 2;
  const metaY = fileteY - 22;
  page.drawText(metaL, { x: metaX, y: metaY, size: metaSize, font: bold, color: WHITE });
  metaX += mwL;
  page.drawText(metaSep, { x: metaX, y: metaY, size: metaSize, font, color: NAVY_SOFT_OR_TEAL_LIGHT() });
  metaX += mwSep;
  page.drawText(metaR, { x: metaX, y: metaY, size: metaSize, font, color: TEAL_LIGHT });

  // ---------- RODAPÉ: ficha técnica + lema ----------
  // Linha divisória curta
  page.drawRectangle({ x: cx - 90, y: 88, width: 180, height: 0.6, color: TEAL });

  if (ctx.session) {
    const lbl = 'CONSULTOR RESPONSÁVEL';
    page.drawText(lbl, { x: center(lbl, bold, 7.5), y: 70, size: 7.5, font: bold, color: LIME });
    const cons = `${ctx.session.nome}  ·  Cód. ${ctx.session.codigo}`;
    page.drawText(cons, { x: center(cons, font, 11), y: 52, size: 11, font, color: WHITE });
  }

  const lema = 'Transformando o país pela educação.';
  page.drawText(lema, { x: center(lema, italic, 10), y: 28, size: 10, font: italic, color: TEAL_LIGHT });
}

// helper local para reutilizar TEAL_LIGHT (separador discreto no centro)
function NAVY_SOFT_OR_TEAL_LIGHT() { return TEAL_LIGHT; }

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

  const e = ctx.analysis.escola;
  const a = ctx.analysis;
  const segs = escolaSegmentos(e);
  const ND = 'Dado não disponível na base fornecida.';
  const W = PDF_W - 2 * M;

  // ---------- TOPO · TÍTULO COMPACTO COM FILETE ----------
  // (substitui drawPDFTitle para encaixar densamente o slide inteiro)
  page.drawText('Resumo Executivo', { x: M, y: PDF_H - CONTENT_TOP - 12, size: 22, font: bold, color: NAVY });
  page.drawRectangle({ x: M, y: PDF_H - CONTENT_TOP - 22, width: 36, height: 3, color: TEAL });
  page.drawText('Visão geral do cenário escolar na área de influência', {
    x: M, y: PDF_H - CONTENT_TOP - 38, size: 10.5, font: italic, color: MUTED,
  });

  // ---------- BLOCO 1 · LEITURA EXECUTIVA (callout robusto) ----------
  const b1Top = PDF_H - CONTENT_TOP - 52;
  const b1H = 100;
  const b1Y = b1Top - b1H;
  // Fundo beige + borda fina + faixa navy à esquerda
  page.drawRectangle({ x: M, y: b1Y, width: W, height: b1H, color: BEIGE, borderColor: BORDER_LIGHT, borderWidth: 0.5 });
  page.drawRectangle({ x: M, y: b1Y, width: 6, height: b1H, color: NAVY });
  // Eyebrow
  page.drawText('LEITURA EXECUTIVA', {
    x: M + 18, y: b1Y + b1H - 16, size: 8.5, font: bold, color: TEAL_DARK,
  });
  // Linha 1 — nome (grande) + município (muted)
  const nomeSize = 16;
  const nomeStr = truncate(e.Escola, 60);
  page.drawText(nomeStr, { x: M + 18, y: b1Y + b1H - 38, size: nomeSize, font: bold, color: NAVY });
  const nomeW = bold.widthOfTextAtSize(nomeStr, nomeSize);
  page.drawText(`   ·   ${e.Município}/${e.UF}`, {
    x: M + 18 + nomeW, y: b1Y + b1H - 38, size: 12, font, color: MUTED,
  });
  // Linha 2 — segmentos
  const segTxt = segs.length ? segs.join(' · ') : ND;
  page.drawText('Segmentos atendidos:', { x: M + 18, y: b1Y + b1H - 60, size: 10, font, color: MUTED });
  page.drawText(segTxt, {
    x: M + 18 + font.widthOfTextAtSize('Segmentos atendidos:', 10) + 6,
    y: b1Y + b1H - 60, size: 10,
    font: segs.length ? bold : italic, color: segs.length ? TEXT : MUTED,
  });
  // Linha 3 — área de influência + market share (números em destaque)
  let lx = M + 18;
  const inlineY3 = b1Y + b1H - 80;
  page.drawText('Área de influência:', { x: lx, y: inlineY3, size: 10, font, color: MUTED });
  lx += font.widthOfTextAtSize('Área de influência:', 10) + 6;
  const escTxt = `${a.concorrentes.length + 1} escolas`;
  page.drawText(escTxt, { x: lx, y: inlineY3, size: 10, font: bold, color: NAVY });
  lx += bold.widthOfTextAtSize(escTxt, 10) + 4;
  page.drawText('e', { x: lx, y: inlineY3, size: 10, font, color: MUTED });
  lx += font.widthOfTextAtSize('e', 10) + 4;
  const aluTxt = `${fmtInt(data.totalAlunadoArea)} alunos`;
  page.drawText(aluTxt, { x: lx, y: inlineY3, size: 10, font: bold, color: NAVY });
  lx += bold.widthOfTextAtSize(aluTxt, 10) + 28;
  page.drawText('Market share atual:', { x: lx, y: inlineY3, size: 10, font, color: MUTED });
  lx += font.widthOfTextAtSize('Market share atual:', 10) + 6;
  page.drawText(fmtPct(a.marketShare.geral), { x: lx, y: inlineY3 - 1, size: 12, font: bold, color: TEAL_DARK });

  // ---------- BLOCO 2 · CENÁRIO DO MUNICÍPIO ----------
  const b2Top = b1Y - 22;
  drawPdfChip(page, font, bold, M, b2Top - 20, 'CENÁRIO DO MUNICÍPIO');
  page.drawText('Dimensão total do mercado escolar no município de referência', {
    x: M + 178, y: b2Top - 14, size: 9.5, font: italic, color: MUTED,
  });
  const muniRowH = 78;
  const muniRowY = b2Top - 30 - muniRowH;
  const muniW = (W - 14) / 2;
  drawResumoCard(page, font, bold, italic, M, muniRowY, muniW, muniRowH, 'Total de Escolas', fmtInt(a.escolasMunicipio.length), NAVY, false);
  drawResumoCard(page, font, bold, italic, M + muniW + 14, muniRowY, muniW, muniRowH, 'Total de Alunos', fmtInt(a.escolasMunicipio.reduce((s, x) => s + num(x['Alunado Total']), 0)), NAVY, false);

  // ---------- BLOCO 3 · RAIO OPERACIONAL ----------
  const b3Top = muniRowY - 22;
  drawPdfChip(page, font, bold, M, b3Top - 20, 'RAIO OPERACIONAL');
  page.drawText('Indicadores escolares no raio operacional', {
    x: M + 178, y: b3Top - 14, size: 9.5, font: italic, color: MUTED,
  });
  const escRowH = 92;
  const escRowY = b3Top - 30 - escRowH;
  const escW = (W - 24) / 3;
  const mensRaw = (!e.Mensalidade || e.Mensalidade === '0') ? '' : e.Mensalidade;
  drawResumoCard(page, font, bold, italic, M, escRowY, escW, escRowH, 'Market Share', fmtPct(a.marketShare.geral), LIME, true);
  drawResumoCard(page, font, bold, italic, M + escW + 12, escRowY, escW, escRowH, 'Raio Operacional', fmtKm(ctx.raioKm), TEAL, true);
  drawResumoCard(page, font, bold, italic, M + 2 * (escW + 12), escRowY, escW, escRowH, 'Faixa de Mensalidade', mensRaw || ND, NAVY, false, !mensRaw);

  // ---------- METODOLOGIA — filete + texto mais legível ----------
  page.drawText('Metodologia ·', { x: M, y: 44, size: 8.5, font: bold, color: TEAL_DARK });
  const methX = M + bold.widthOfTextAtSize('Metodologia ·', 8.5) + 4;
  page.drawText('Censo Escolar 2024 + critérios de proximidade (CEP), faixa de mensalidade e segmentos comuns. Top 15 concorrentes por relevância competitiva.', {
    x: methX, y: 44, size: 8.5, font: italic, color: MUTED,
  });
}

// Chip teal-light (PDF) — equivalente ao pptChip
function drawPdfChip(page: PDFPage, font: PDFFont, bold: PDFFont, x: number, y: number, label: string) {
  const w = Math.max(168, bold.widthOfTextAtSize(label, 9.5) + 28);
  page.drawRectangle({ x, y, width: w, height: 22, color: TEAL_LIGHT });
  page.drawText(label, { x: x + 12, y: y + 7, size: 9.5, font: bold, color: NAVY });
}

// Card do Resumo (PDF) — faixa lateral esquerda + label + valor robusto
function drawResumoCard(
  page: PDFPage, font: PDFFont, bold: PDFFont, italic: PDFFont,
  x: number, y: number, w: number, h: number,
  label: string, value: string, accent: RGB,
  destaque = false, neutro = false,
) {
  const fill = destaque ? TEAL_LIGHT : WHITE;
  page.drawRectangle({ x, y, width: w, height: h, color: fill, borderColor: BORDER_LIGHT, borderWidth: 0.5 });
  // Faixa de acento à ESQUERDA (mais "premium" que faixa superior)
  page.drawRectangle({ x, y, width: 4, height: h, color: accent });
  // Label — pequeno, MAIÚSCULO, em muted, com tracking visual
  page.drawText(label.toUpperCase(), { x: x + 16, y: y + h - 18, size: 8.5, font: bold, color: MUTED });
  // Valor — auto-shrink
  const targetSize = neutro ? 11 : (destaque ? 32 : 24);
  let vSize = targetSize;
  const vFont = neutro ? italic : bold;
  const vColor = neutro ? MUTED : NAVY;
  while (vFont.widthOfTextAtSize(value, vSize) > w - 30 && vSize > 9) vSize -= 1;
  // Posiciona o valor ocupando a parte inferior do card, com espaço respirável
  const valY = y + (destaque ? 18 : 14);
  page.drawText(value, { x: x + 16, y: valY, size: vSize, font: vFont, color: vColor });
}

// ----- 4. Panorama educacional
function renderPdfPanorama(page: PDFPage, font: PDFFont, bold: PDFFont, italic: PDFFont, ctx: ExportContext, data: any, n: number, total: number) {
  const d: DrawCtx = { page, font, bold, italic, ctx, pageNo: n, total };
  drawPDFHeader(d); drawPDFFooter(d);

  const a = ctx.analysis;
  const W = PDF_W - 2 * M;

  // ---------- TOPO · TÍTULO COMPACTO COM FILETE (mesmo padrão do Resumo Executivo) ----------
  page.drawText('Panorama Educacional da Região', { x: M, y: PDF_H - CONTENT_TOP - 12, size: 22, font: bold, color: NAVY });
  page.drawRectangle({ x: M, y: PDF_H - CONTENT_TOP - 22, width: 36, height: 3, color: TEAL });
  const subTopo = `${a.concorrentes.length + 1} escolas  ·  ${fmtInt(data.totalAlunos)} alunos  ·  raio ${fmtKm(ctx.raioKm)}`;
  page.drawText(subTopo, {
    x: M, y: PDF_H - CONTENT_TOP - 38, size: 10.5, font: italic, color: MUTED,
  });

  // ---------- CARDS SUPERIORES (mesmo padrão do Resumo Executivo) ----------
  const segOrd = [...data.segPanorama] as Array<{ sigla: string; nome: string; alunos: number }>;
  const lider = segOrd[0];
  const liderPct = data.totalAlunos > 0 ? (lider?.alunos ?? 0) / data.totalAlunos * 100 : 0;
  const nEscolas = a.concorrentes.length + 1;
  const mediaEsc = Math.round(data.totalAlunos / Math.max(1, nEscolas));

  const cardsTop = PDF_H - CONTENT_TOP - 52;
  const cardH = 78;
  const cardY = cardsTop - cardH;
  const cardW = (W - 36) / 4;
  drawResumoCard(page, font, bold, italic, M + 0 * (cardW + 12), cardY, cardW, cardH, 'Escolas',         String(nEscolas),               NAVY, false);
  drawResumoCard(page, font, bold, italic, M + 1 * (cardW + 12), cardY, cardW, cardH, 'Total de Alunos', fmtInt(data.totalAlunos),       NAVY, false);
  drawResumoCard(page, font, bold, italic, M + 2 * (cardW + 12), cardY, cardW, cardH, 'Média/Escola',    fmtInt(mediaEsc),               NAVY, false);
  drawResumoCard(page, font, bold, italic, M + 3 * (cardW + 12), cardY, cardW, cardH, 'Segmento Líder',  `${lider?.sigla ?? '—'} · ${fmtPct(liderPct, 0)}`, LIME, true);

  // ===== Composição: gráfico (esq) + tabela cobertura (dir) =====
  const todas = [a.escola, ...a.concorrentes.map((c: any) => c.escola)];
  const offerCount = (key: string) => todas.filter(esc => num(esc[key]) > 0).length;
  const segKey: Record<string, string> = {
    EI:   'qt_mat_educacao_infantil',
    EFI:  'qt_mat_ensino_fundamental_anos_iniciais',
    EFII: 'qt_mat_ensino_fundamental_anos_finais',
    EM:   'qt_mat_ensino_medio',
  };
  const totEsc = todas.length;
  const cobertura = segOrd.map(seg => ({
    sigla: seg.sigla,
    nome: seg.nome,
    escolas: offerCount(segKey[seg.sigla]),
  }));
  const cobertOrd = [...cobertura].sort((x, y) => y.escolas - x.escolas);
  const liderCob = cobertOrd[0];

  const blockTop = cardY - 28;
  const blockBottom = 70;
  const blockH = blockTop - blockBottom;
  const gapX = 22;
  const chartW = Math.round((W - gapX) * 0.58);
  const tableX = M + chartW + gapX;
  const tableW = PDF_W - M - tableX;

  // ----- Bloco Gráfico (esquerda) -----
  page.drawText('Volume de alunos por segmento', { x: M, y: blockTop - 4, size: 12, font: bold, color: NAVY });
  page.drawText('Distribuição do total de alunos entre os níveis de ensino', { x: M, y: blockTop - 20, size: 9.5, font: italic, color: MUTED });

  const chartTop = blockTop - 38;
  const chartBottom = blockBottom + 8;
  const chartH = chartTop - chartBottom;
  const labelW = 130;
  const valueW = 70;
  const trackX = M + labelW;
  const trackW = chartW - labelW - valueW;
  const maxAl = Math.max(...segOrd.map(s => s.alunos), 1);
  const liderSigla = lider?.sigla;
  const rowSlot = chartH / segOrd.length;
  const barH = Math.max(14, Math.min(24, rowSlot * 0.55));
  segOrd.forEach((seg, i) => {
    const slotY = chartTop - (i + 1) * rowSlot + (rowSlot - barH) / 2;
    const isLeader = seg.sigla === liderSigla;
    page.drawText(truncate(seg.nome, 26), {
      x: M, y: slotY + barH / 2 - 4, size: 9.5, font: isLeader ? bold : font, color: NAVY,
    });
    page.drawRectangle({ x: trackX, y: slotY, width: trackW, height: barH, color: BORDER_LIGHT });
    const w = Math.max(2, (seg.alunos / maxAl) * trackW);
    page.drawRectangle({ x: trackX, y: slotY, width: w, height: barH, color: isLeader ? TEAL : NAVY });
    if (isLeader) {
      page.drawRectangle({ x: trackX, y: slotY, width: 3, height: barH, color: LIME });
    }
    page.drawText(fmtInt(seg.alunos), {
      x: trackX + trackW + 8, y: slotY + barH / 2 - 4, size: 9.5, font: bold, color: NAVY,
    });
  });

  // ----- Bloco Tabela: Cobertura por Segmento (direita) -----
  page.drawText('Cobertura por segmento', { x: tableX, y: blockTop - 4, size: 12, font: bold, color: NAVY });
  page.drawText('Quantidade de escolas que ofertam cada nível de ensino', { x: tableX, y: blockTop - 20, size: 9.5, font: italic, color: MUTED });

  const tHeadY = blockTop - 50;
  const tHeadH = 18;
  const colSeg = tableX + 10;
  const colEsc = tableX + Math.round(tableW * 0.46);
  const colPct = tableX + Math.round(tableW * 0.72);
  page.drawRectangle({ x: tableX, y: tHeadY, width: tableW, height: tHeadH, color: BEIGE });
  page.drawText('SEGMENTO', { x: colSeg, y: tHeadY + 5, size: 7.5, font: bold, color: MUTED });
  page.drawText('ESCOLAS',  { x: colEsc, y: tHeadY + 5, size: 7.5, font: bold, color: MUTED });
  page.drawText('%',        { x: colPct, y: tHeadY + 5, size: 7.5, font: bold, color: MUTED });

  const tBodyTop = tHeadY;
  const tBodyBottom = blockBottom + 8;
  const tRowH = Math.max(22, Math.min(34, (tBodyTop - tBodyBottom) / cobertOrd.length));
  const empateCob = cobertOrd.length > 1 && cobertOrd[0].escolas === cobertOrd[1].escolas;

  cobertOrd.forEach((seg, i) => {
    const ry = tHeadY - (i + 1) * tRowH;
    const isLeader = i === 0 && !empateCob;
    if (i % 2 === 0) page.drawRectangle({ x: tableX, y: ry, width: tableW, height: tRowH, color: BORDER_LIGHT });
    if (isLeader) page.drawRectangle({ x: tableX, y: ry, width: 3, height: tRowH, color: LIME });
    const ty = ry + tRowH / 2 - 4;
    page.drawText(truncate(seg.nome, 22), { x: colSeg, y: ty, size: 9.5, font: isLeader ? bold : font, color: NAVY });
    page.drawText(`${seg.escolas} de ${totEsc}`, { x: colEsc, y: ty, size: 9.5, font: isLeader ? bold : font, color: TEXT });
    const pCob = totEsc > 0 ? (seg.escolas / totEsc) * 100 : 0;
    page.drawText(fmtPct(pCob, 0), { x: colPct, y: ty, size: 9.5, font: isLeader ? bold : font, color: isLeader ? NAVY : TEXT });
    // mini barra horizontal discreta no fim da linha
    const barTrackX = colPct + 30;
    const barTrackW = (tableX + tableW - 8) - barTrackX;
    if (barTrackW > 20) {
      const mbY = ry + tRowH / 2 - 2;
      page.drawRectangle({ x: barTrackX, y: mbY, width: barTrackW, height: 4, color: BORDER_LIGHT });
      page.drawRectangle({ x: barTrackX, y: mbY, width: Math.max(2, (pCob / 100) * barTrackW), height: 4, color: isLeader ? LIME : TEAL });
    }
  });
}

// ----- 5. Concorrência — slide único (sem mapa)
// Padrão visual alinhado ao "Resumo Executivo" e "Panorama Educacional":
// título compacto + filete teal + subtítulo italic, linha-resumo,
// 4 mini cards de principais concorrentes (com prioridade aos essenciais
// escolhidos pelo consultor) e tabela enxuta com os demais.
function renderPdfConcorrencia(page: PDFPage, font: PDFFont, bold: PDFFont, italic: PDFFont, ctx: ExportContext, data: any, n: number, total: number) {
  const d: DrawCtx = { page, font, bold, italic, ctx, pageNo: n, total };
  drawPDFHeader(d); drawPDFFooter(d);

  const W = PDF_W - 2 * M;
  const e = data.e;
  const concsAll = data.concs as any[];
  const totalConc = concsAll.length;
  const essList = ctx.essenciaisInep ?? [];
  const { top, restantes, isEssencial } = selectTopConcorrentes(concsAll, e, essList, 4);

  // ---------- TOPO · TÍTULO COMPACTO COM FILETE ----------
  page.drawText('Concorrência', {
    x: M, y: PDF_H - CONTENT_TOP - 12, size: 22, font: bold, color: NAVY,
  });
  page.drawRectangle({ x: M, y: PDF_H - CONTENT_TOP - 22, width: 36, height: 3, color: TEAL });
  page.drawText('Concorrentes elegíveis selecionados para comparação com a escola analisada dentro da área de influência.', {
    x: M, y: PDF_H - CONTENT_TOP - 38, size: 10.5, font: italic, color: MUTED,
  });

  // ---------- LINHA-RESUMO ----------
  const linhaY = PDF_H - CONTENT_TOP - 54;
  const linha = `Raio ${fmtKm(ctx.raioKm)} · ${ctx.raioMode === 'personalizado' ? 'personalizado' : 'padrão'} · ${totalConc} concorrente(s) elegíveis`;
  page.drawText(linha, { x: M, y: linhaY, size: 9.5, font, color: MUTED });

  // ---------- MINI CARDS — PRINCIPAIS CONCORRENTES ----------
  const cardsTop = linhaY - 12;
  const cardH = 84;
  const cardY = cardsTop - cardH;
  const gap = 12;
  const cardW = (W - 3 * gap) / 4;

  const drawMiniCard = (cx: number, cy: number, c: any | null) => {
    // fundo + borda
    const ess = c ? isEssencial(c) : false;
    const fill = ess ? TEAL_LIGHT : WHITE;
    page.drawRectangle({ x: cx, y: cy, width: cardW, height: cardH, color: fill, borderColor: BORDER_LIGHT, borderWidth: 0.5 });
    page.drawRectangle({ x: cx, y: cy, width: 3, height: cardH, color: ess ? TEAL : NAVY });
    if (!c) {
      page.drawText('—', { x: cx + 12, y: cy + cardH / 2 - 6, size: 12, font: italic, color: MUTED });
      return;
    }
    // Nome (até 2 linhas)
    const nameMaxW = cardW - 18;
    const nameSize = 9.5;
    const nameLines = wrapTextToLines(c.escola.Escola, bold, nameSize, nameMaxW, 2);
    let yy = cy + cardH - 14;
    nameLines.forEach(line => {
      page.drawText(line, { x: cx + 10, y: yy, size: nameSize, font: bold, color: NAVY });
      yy -= nameSize + 2;
    });
    // Distância
    const dist = distanciaLabel(c);
    page.drawText(dist.text, { x: cx + 10, y: yy - 2, size: 8.5, font, color: dist.muted ? MUTED : TEXT });
    yy -= 13;
    // Segmentos como chips compactos
    const segs = getSegmentos(c.escola);
    // Chip padronizado (mesmo tratamento p/ todos os segmentos):
    // fundo teal-light suave + borda + texto navy escuro.
    const chipFill = rgb(0.871, 0.953, 0.953); // tealLight (DEF3F3)
    const chipBorder = rgb(0.624, 0.812, 0.800); // lavenderDark / tealLight darker
    let chipX = cx + 10;
    const chipY = yy - 11;
    segs.forEach(seg => {
      const cw = bold.widthOfTextAtSize(seg, 7) + 8;
      if (chipX + cw > cx + cardW - 8) return;
      page.drawRectangle({ x: chipX, y: chipY, width: cw, height: 11, color: chipFill, borderColor: chipBorder, borderWidth: 0.4 });
      page.drawText(seg, { x: chipX + 4, y: chipY + 3, size: 7, font: bold, color: NAVY });
      chipX += cw + 3;
    });
    if (segs.length === 0) {
      page.drawText('—', { x: chipX, y: chipY + 2, size: 8.5, font, color: MUTED });
    }
    // Tipo de adoção (linha de base)
    const tipo = tipoAdocaoOf(c.escola);
    const tipoND = tipoAdocaoIsND(c.escola);
    let tipoTxt = `Tipo de adoção: ${tipo}`;
    let tipoSize = 8;
    const tipoMaxW = cardW - 18;
    while (font.widthOfTextAtSize(tipoTxt, tipoSize) > tipoMaxW && tipoSize > 7) tipoSize -= 0.5;
    if (font.widthOfTextAtSize(tipoTxt, tipoSize) > tipoMaxW) {
      while (tipoTxt.length > 4 && font.widthOfTextAtSize(tipoTxt + '…', tipoSize) > tipoMaxW) tipoTxt = tipoTxt.slice(0, -1);
      tipoTxt += '…';
    }
    page.drawText(tipoTxt, { x: cx + 10, y: cy + 6, size: tipoSize, font: tipoND ? italic : font, color: tipoND ? MUTED : TEXT });
    // Selo discreto (canto sup. direito)
    const selo = ess ? 'Selecionado' : 'Automático';
    const seloSize = 6.5;
    const seloW = bold.widthOfTextAtSize(selo, seloSize) + 8;
    page.drawRectangle({ x: cx + cardW - seloW - 6, y: cy + cardH - 12, width: seloW, height: 10, color: ess ? TEAL : BORDER_LIGHT });
    page.drawText(selo, {
      x: cx + cardW - seloW - 2, y: cy + cardH - 10, size: seloSize, font: bold, color: ess ? WHITE : MUTED,
    });
  };

  for (let i = 0; i < 4; i++) {
    drawMiniCard(M + i * (cardW + gap), cardY, top[i] ?? null);
  }

  // ---------- TABELA — DEMAIS CONCORRENTES ----------
  const tableTop = cardY - 18;
  const tableBottom = 56; // espaço para rodapé institucional discreto
  const tableMaxH = tableTop - tableBottom;

  const cols = [
    { k: 'esc',  w: W * 0.40, label: 'Escola' },
    { k: 'dist', w: W * 0.20, label: 'Distância / Proximidade' },
    { k: 'segs', w: W * 0.18, label: 'Segmentos' },
    { k: 'tipo', w: W * 0.22, label: 'Tipo de adoção' },
  ];

  // Cabeçalho navy com texto branco
  const headerH = 22;
  const headerY = tableTop;
  page.drawRectangle({ x: M, y: headerY - headerH, width: W, height: headerH, color: NAVY });
  let cx0 = M;
  cols.forEach(c => {
    page.drawText(c.label, { x: cx0 + 10, y: headerY - 15, size: 9.5, font: bold, color: WHITE });
    cx0 += c.w;
  });

  // Limita por legibilidade
  const TOP_N = 10;
  const restShown = restantes.slice(0, TOP_N);
  const totalRows = restShown.length;
  const rowH = totalRows > 0
    ? Math.min(24, Math.max(18, (tableMaxH - headerH) / Math.max(totalRows, 1)))
    : 22;

  restShown.forEach((c: any, i: number) => {
    const ess = isEssencial(c);
    const rY = headerY - headerH - rowH * (i + 1);
    if (ess) {
      page.drawRectangle({ x: M, y: rY, width: W, height: rowH, color: TEAL_LIGHT });
      page.drawRectangle({ x: M, y: rY, width: 3, height: rowH, color: TEAL });
    } else if (i % 2 === 1) {
      page.drawRectangle({ x: M, y: rY, width: W, height: rowH, color: BEIGE });
    }

    let xc = M;
    // Escola
    {
      const colW = cols[0].w;
      const fnt = bold;
      let size = 9.5;
      let t = c.escola.Escola;
      const maxW = colW - 16;
      while (fnt.widthOfTextAtSize(t, size) > maxW && size > 8) size -= 0.5;
      if (fnt.widthOfTextAtSize(t, size) > maxW) {
        while (t.length > 4 && fnt.widthOfTextAtSize(t + '…', size) > maxW) t = t.slice(0, -1);
        t += '…';
      }
      page.drawText(t, { x: xc + 10, y: rY + rowH / 2 - 4, size, font: fnt, color: NAVY });
    }
    xc += cols[0].w;
    // Distância
    {
      const dist = distanciaLabel(c);
      let t = dist.text;
      let size = 9.5;
      const maxW = cols[1].w - 16;
      while (font.widthOfTextAtSize(t, size) > maxW && size > 8) size -= 0.5;
      page.drawText(t, { x: xc + 10, y: rY + rowH / 2 - 4, size, font, color: dist.muted ? MUTED : TEXT });
    }
    xc += cols[1].w;
    // Segmentos como chips
    {
      const segs = getSegmentos(c.escola);
      // Chip padronizado para todos os segmentos
      const chipFill = rgb(0.871, 0.953, 0.953);
      const chipBorder = rgb(0.624, 0.812, 0.800);
      let chipX = xc + 8;
      const chipY = rY + (rowH - 12) / 2;
      segs.forEach(seg => {
        const cw = bold.widthOfTextAtSize(seg, 7.5) + 10;
        if (chipX + cw > xc + cols[2].w - 6) return;
        page.drawRectangle({ x: chipX, y: chipY, width: cw, height: 12, color: chipFill, borderColor: chipBorder, borderWidth: 0.4 });
        page.drawText(seg, { x: chipX + 5, y: chipY + 3, size: 7.5, font: bold, color: NAVY });
        chipX += cw + 4;
      });
      if (segs.length === 0) {
        page.drawText('—', { x: xc + 10, y: rY + rowH / 2 - 4, size: 9.5, font, color: MUTED });
      }
    }
    xc += cols[2].w;
    // Tipo de adoção
    {
      const tipoND = tipoAdocaoIsND(c.escola);
      let t = tipoAdocaoOf(c.escola);
      let size = 9.5;
      const maxW = cols[3].w - 16;
      while (font.widthOfTextAtSize(t, size) > maxW && size > 8) size -= 0.5;
      if (font.widthOfTextAtSize(t, size) > maxW) {
        while (t.length > 4 && font.widthOfTextAtSize(t + '…', size) > maxW) t = t.slice(0, -1);
        t += '…';
      }
      page.drawText(t, { x: xc + 10, y: rY + rowH / 2 - 4, size, font: tipoND ? italic : font, color: tipoND ? MUTED : TEXT });
    }

    page.drawLine({ start: { x: M, y: rY }, end: { x: M + W, y: rY }, thickness: 0.3, color: BORDER_LIGHT });
  });

  if (totalRows === 0) {
    page.drawText('Demais concorrentes não disponíveis — todos os elegíveis já estão destacados acima.', {
      x: M + 12, y: headerY - headerH - 22, size: 9.5, font: italic, color: MUTED,
    });
  }

  // Borda externa da tabela
  const tableHActual = headerH + rowH * Math.max(totalRows, 1);
  page.drawRectangle({ x: M, y: headerY - tableHActual, width: W, height: tableHActual, borderColor: BORDER, borderWidth: 0.4, color: WHITE, opacity: 0 });

  // (Nota de truncamento removida a pedido — manter slide limpo.)
}

// helper local — quebra texto em até maxLines linhas, com elipse na última
function wrapTextToLines(text: string, font: PDFFont, size: number, maxW: number, maxLines: number): string[] {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const tryLine = cur ? cur + ' ' + w : w;
    if (font.widthOfTextAtSize(tryLine, size) <= maxW) {
      cur = tryLine;
    } else {
      if (cur) lines.push(cur);
      cur = w;
      if (lines.length === maxLines - 1) break;
    }
    if (lines.length === maxLines) break;
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  // Elipse se sobrou
  const remaining = words.slice(lines.join(' ').split(/\s+/).filter(Boolean).length).join(' ');
  if (remaining && lines.length === maxLines) {
    let last = lines[maxLines - 1];
    while (font.widthOfTextAtSize(last + '…', size) > maxW && last.length > 4) last = last.slice(0, -1);
    lines[maxLines - 1] = last + '…';
  } else if (lines.length === maxLines) {
    // ok
  }
  return lines.length ? lines : [''];
}

// ----- 6. Market Share — slide único (unifica geral + por segmento)
function renderPdfMarketShare(page: PDFPage, font: PDFFont, bold: PDFFont, italic: PDFFont, ctx: ExportContext, data: any, n: number, total: number) {
  const d: DrawCtx = { page, font, bold, italic, ctx, pageNo: n, total };
  drawPDFHeader(d); drawPDFFooter(d);

  const W = PDF_W - 2 * M;
  const a = ctx.analysis;
  const ms = a.marketShare;
  const universe = data.totalAlunadoArea;

  // ---------- TÍTULO COMPACTO COM FILETE ----------
  page.drawText('Market Share', {
    x: M, y: PDF_H - CONTENT_TOP - 12, size: 22, font: bold, color: NAVY,
  });
  page.drawRectangle({ x: M, y: PDF_H - CONTENT_TOP - 22, width: 36, height: 3, color: TEAL });
  page.drawText('Participação de mercado da escola analisada na área de influência, com visão geral e por segmento.', {
    x: M, y: PDF_H - CONTENT_TOP - 38, size: 10.5, font: italic, color: MUTED,
  });

  // ---------- LINHA-RESUMO ----------
  const linhaY = PDF_H - CONTENT_TOP - 54;
  const linha = `Raio ${fmtKm(ctx.raioKm)} · ${a.concorrentes.length} concorrentes elegíveis · ${fmtInt(universe)} alunos na área de influência`;
  page.drawText(linha, { x: M, y: linhaY, size: 9.5, font, color: MUTED });

  // ---------- 5 MINI CARDS ----------
  const segShares = [
    { l: 'Educação Infantil', v: ms.ei },
    { l: 'Fund. AI', v: ms.efi },
    { l: 'Fund. AF', v: ms.efii },
    { l: 'Ensino Médio', v: ms.em },
  ];
  const maxSeg = Math.max(ms.ei, ms.efi, ms.efii, ms.em);
  const cardW = (W - 4 * 12) / 5;
  const cardH = 60;
  const cardY = linhaY - 14 - cardH;
  // Geral
  drawKpiCard(page, font, bold, M, cardY, cardW, cardH, 'Geral', fmtPct(ms.geral), TEAL);
  segShares.forEach((seg, i) => {
    const isStrong = maxSeg > 0 && seg.v === maxSeg;
    drawKpiCard(page, font, bold, M + (i + 1) * (cardW + 12), cardY, cardW, cardH, seg.l, fmtPct(seg.v), isStrong ? LIME : NAVY);
  });

  // ---------- HEATMAP ----------
  const heatTop = data.allSchoolsRanked.slice(0, 8);
  const heatTitleY = cardY - 20;
  page.drawText('HEATMAP DE MARKET SHARE POR SEGMENTO', { x: M, y: heatTitleY, size: 9, font: bold, color: NAVY });

  const segKeys = [
    { k: 'qt_mat_educacao_infantil', l: 'EI' },
    { k: 'qt_mat_ensino_fundamental_anos_iniciais', l: 'EFI' },
    { k: 'qt_mat_ensino_fundamental_anos_finais', l: 'EFII' },
    { k: 'qt_mat_ensino_medio', l: 'EM' },
  ];
  const colSegW = 70;
  const rowLabelW = W - colSegW * 4 - 8;
  const headerY = heatTitleY - 16;
  page.drawText('ESCOLA', { x: M + 6, y: headerY, size: 8, font: bold, color: MUTED });
  segKeys.forEach((sk, i) => {
    const tx = M + rowLabelW + i * colSegW + colSegW / 2;
    const tw = bold.widthOfTextAtSize(sk.l, 8.5);
    page.drawText(sk.l, { x: tx - tw / 2, y: headerY, size: 8.5, font: bold, color: MUTED });
  });

  let hy = headerY - 6;
  const cellH = 22;
  heatTop.forEach((row: any) => {
    hy -= cellH;
    // Linha-base: highlight da escola analisada (badge "Em análise")
    if (row.isTarget) {
      page.drawRectangle({ x: M, y: hy, width: rowLabelW - 4, height: cellH, color: TEAL_LIGHT });
      page.drawRectangle({ x: M, y: hy, width: 3, height: cellH, color: TEAL });
    }
    const nameTxt = truncate(row.name, 38);
    page.drawText(nameTxt, { x: M + 8, y: hy + cellH / 2 - 4, size: 9, font: row.isTarget ? bold : font, color: row.isTarget ? NAVY : TEXT });
    if (row.isTarget) {
      const badge = 'Em análise';
      const bw = bold.widthOfTextAtSize(badge, 7) + 8;
      const bx = M + rowLabelW - bw - 8;
      page.drawRectangle({ x: bx, y: hy + cellH / 2 - 6, width: bw, height: 12, color: TEAL });
      page.drawText(badge, { x: bx + 4, y: hy + cellH / 2 - 3, size: 7, font: bold, color: WHITE });
    }
    segKeys.forEach((sk, i) => {
      const val = num(row.data[sk.k]);
      const segTotal = data.allSchoolsRanked.reduce((acc: number, r: any) => acc + num(r.data[sk.k]), 0);
      const pct = segTotal > 0 ? (val / segTotal) * 100 : 0;
      const intensity = Math.min(pct / 30, 1);
      const cx = M + rowLabelW + i * colSegW;
      const fill = rgb(0.93 - intensity * 0.55, 0.93 - intensity * 0.7, 0.95 - intensity * 0.5);
      page.drawRectangle({ x: cx, y: hy + 2, width: colSegW - 4, height: cellH - 4, color: fill, borderColor: BORDER_LIGHT, borderWidth: 0.3 });
      if (row.isTarget) {
        page.drawRectangle({ x: cx, y: hy + 2, width: colSegW - 4, height: cellH - 4, borderColor: TEAL, borderWidth: 1.2, color: fill, opacity: 0 });
      }
      const tt = pct > 0 ? fmtPct(pct, 0) : '—';
      const tw = (row.isTarget ? bold : font).widthOfTextAtSize(tt, 9.5);
      page.drawText(tt, {
        x: cx + (colSegW - 4 - tw) / 2, y: hy + cellH / 2 - 4,
        size: 9.5, font: row.isTarget ? bold : font,
        color: intensity > 0.6 ? WHITE : NAVY,
      });
    });
  });

  // ---------- LEITURA CURTA ----------
  const segLido = segShares.filter(s => s.v > 0).sort((a, b) => b.v - a.v);
  const lider = segLido[0];
  const fraco = segLido[segLido.length - 1];
  const leitura = lider && fraco && lider.l !== fraco.l
    ? `Maior penetração em ${lider.l} (${fmtPct(lider.v)}). Segmento mais vulnerável: ${fraco.l} (${fmtPct(fraco.v)}).`
    : 'Sem dados suficientes para leitura segmentada.';
  page.drawRectangle({ x: M, y: 50, width: W, height: 28, color: TEAL_LIGHT, borderColor: TEAL, borderWidth: 0.5 });
  page.drawText(truncate(leitura, 150), { x: M + 12, y: 60, size: 9.5, font, color: NAVY });
}

// ----- 9. Mensalidade
function renderPdfMensalidade(page: PDFPage, font: PDFFont, bold: PDFFont, italic: PDFFont, ctx: ExportContext, data: any, n: number, total: number) {
  const d: DrawCtx = { page, font, bold, italic, ctx, pageNo: n, total };
  drawPDFHeader(d); drawPDFFooter(d);

  const W = PDF_W - 2 * M;
  const e = ctx.analysis.escola;
  const concs = data.concs as any[];
  const FAIXAS = ['até 399', '400 a 799', '800 a 1.399', '1.400 a 2.399', 'acima de R$ 2.400'];
  const FAIXA_LABEL: Record<string, string> = {
    'até 399': 'Até R$ 399',
    '400 a 799': 'R$ 400 a R$ 799',
    '800 a 1.399': 'R$ 800 a R$ 1.399',
    '1.400 a 2.399': 'R$ 1.400 a R$ 2.399',
    'acima de R$ 2.400': 'Acima de R$ 2.400',
  };
  const escIdx = getMensalidadeFaixa(e.Mensalidade);
  const escFaixaLabel = (e.Mensalidade && e.Mensalidade !== '0' && escIdx > 0)
    ? (FAIXA_LABEL[e.Mensalidade] || e.Mensalidade)
    : 'Dado não disponível';

  // ---------- TÍTULO COMPACTO + FILETE ----------
  page.drawText('Faixa de Mensalidade', {
    x: M, y: PDF_H - CONTENT_TOP - 12, size: 22, font: bold, color: NAVY,
  });
  page.drawRectangle({ x: M, y: PDF_H - CONTENT_TOP - 22, width: 36, height: 3, color: TEAL });
  page.drawText('Posicionamento da escola analisada em relação ao grupo competitivo da área de influência.', {
    x: M, y: PDF_H - CONTENT_TOP - 38, size: 10.5, font: italic, color: MUTED,
  });

  // ---------- LINHA-RESUMO ----------
  const linhaY = PDF_H - CONTENT_TOP - 54;
  const linha = `Faixa da escola: ${escFaixaLabel} · ${concs.length} concorrente(s) exibidos · ${data.mesmaFaixa} na mesma faixa`;
  page.drawText(linha, { x: M, y: linhaY, size: 9.5, font, color: MUTED });

  // ---------- 4 MINI CARDS ----------
  const cardsTop = linhaY - 12;
  const cardH = 60;
  const cardY = cardsTop - cardH;
  const gap = 12;
  const cardW = (W - 3 * gap) / 4;
  drawKpiCard(page, font, bold, M + 0 * (cardW + gap), cardY, cardW, cardH, 'Faixa da escola', escFaixaLabel, TEAL, 18);
  drawKpiCard(page, font, bold, M + 1 * (cardW + gap), cardY, cardW, cardH, 'Concorrentes na mesma faixa', String(data.mesmaFaixa), TEAL, 18);
  drawKpiCard(page, font, bold, M + 2 * (cardW + gap), cardY, cardW, cardH, 'Concorrentes acima da faixa', String(data.acima), NAVY, 18);
  drawKpiCard(page, font, bold, M + 3 * (cardW + gap), cardY, cardW, cardH, 'Concorrentes abaixo da faixa', String(data.abaixo), LIME, 18);

  // ---------- BLOCO A · TABELA · BLOCO B · DISTRIBUIÇÃO ----------
  const contentTop = cardY - 18;
  const contentBottom = 56;
  const contentH = contentTop - contentBottom;
  const tableW = W * 0.62;
  const distW = W - tableW - 16;
  const distX = M + tableW + 16;

  // Cabeçalho da tabela
  const headerH = 22;
  const tCols = [
    { w: tableW * 0.50, label: 'Escola' },
    { w: tableW * 0.26, label: 'Faixa' },
    { w: tableW * 0.24, label: 'Relação' },
  ];
  page.drawRectangle({ x: M, y: contentTop - headerH, width: tableW, height: headerH, color: NAVY });
  let hx = M;
  tCols.forEach(c => {
    page.drawText(c.label, { x: hx + 8, y: contentTop - 15, size: 9.5, font: bold, color: WHITE });
    hx += c.w;
  });

  // Monta linhas: escola analisada primeiro, depois concorrentes
  type Row = { nome: string; faixa: string; faixaIdx: number; isTarget: boolean };
  const allRows: Row[] = [
    { nome: e.Escola, faixa: e.Mensalidade, faixaIdx: escIdx, isTarget: true },
    ...concs.map((c: any) => ({
      nome: c.escola.Escola,
      faixa: c.escola.Mensalidade,
      faixaIdx: getMensalidadeFaixa(c.escola.Mensalidade),
      isTarget: false,
    })),
  ];

  const MAX_ROWS = 11;
  const rowsShown = allRows.slice(0, MAX_ROWS);
  const rowH = Math.min(22, Math.max(16, (contentH - headerH - 12) / Math.max(rowsShown.length, 1)));

  const relLabel = (r: Row): { txt: string; muted: boolean } => {
    if (r.isTarget) return { txt: 'Em análise', muted: false };
    if (r.faixaIdx <= 0) return { txt: 'Dado não disponível', muted: true };
    if (escIdx <= 0) return { txt: '—', muted: true };
    if (r.faixaIdx === escIdx) return { txt: 'Mesma faixa', muted: false };
    if (r.faixaIdx > escIdx) return { txt: 'Acima', muted: false };
    return { txt: 'Abaixo', muted: false };
  };

  rowsShown.forEach((r, i) => {
    const rY = contentTop - headerH - rowH * (i + 1);
    if (r.isTarget) {
      page.drawRectangle({ x: M, y: rY, width: tableW, height: rowH, color: TEAL_LIGHT });
      page.drawRectangle({ x: M, y: rY, width: 3, height: rowH, color: TEAL });
    } else if (i % 2 === 1) {
      page.drawRectangle({ x: M, y: rY, width: tableW, height: rowH, color: BEIGE });
    }
    let xc = M;
    // Escola + badge
    {
      const colW = tCols[0].w;
      let size = 9.5;
      let t = r.nome;
      const reservedBadge = r.isTarget ? 60 : 0;
      const maxW = colW - 16 - reservedBadge;
      while (bold.widthOfTextAtSize(t, size) > maxW && size > 8) size -= 0.5;
      if (bold.widthOfTextAtSize(t, size) > maxW) {
        while (t.length > 4 && bold.widthOfTextAtSize(t + '…', size) > maxW) t = t.slice(0, -1);
        t += '…';
      }
      page.drawText(t, { x: xc + 10, y: rY + rowH / 2 - 4, size, font: bold, color: NAVY });
      if (r.isTarget) {
        const badgeW = 56;
        const bX = xc + colW - badgeW - 6;
        const bY = rY + (rowH - 12) / 2;
        page.drawRectangle({ x: bX, y: bY, width: badgeW, height: 12, color: TEAL });
        page.drawText('Em análise', { x: bX + 5, y: bY + 3, size: 7, font: bold, color: WHITE });
      }
    }
    xc += tCols[0].w;
    // Faixa
    {
      const fLabel = (r.faixa && r.faixa !== '0' && r.faixaIdx > 0) ? (FAIXA_LABEL[r.faixa] || r.faixa) : 'Dado não disponível';
      let size = 9; let t = fLabel;
      const maxW = tCols[1].w - 12;
      while (font.widthOfTextAtSize(t, size) > maxW && size > 7.5) size -= 0.5;
      if (font.widthOfTextAtSize(t, size) > maxW) {
        while (t.length > 4 && font.widthOfTextAtSize(t + '…', size) > maxW) t = t.slice(0, -1);
        t += '…';
      }
      const isND = !(r.faixa && r.faixa !== '0' && r.faixaIdx > 0);
      page.drawText(t, { x: xc + 8, y: rY + rowH / 2 - 4, size, font: isND ? italic : font, color: isND ? MUTED : TEXT });
    }
    xc += tCols[1].w;
    // Relação
    {
      const rel = relLabel(r);
      page.drawText(rel.txt, { x: xc + 8, y: rY + rowH / 2 - 4, size: 9, font: rel.muted ? italic : bold, color: rel.muted ? MUTED : (r.isTarget ? TEAL : NAVY) });
    }
    page.drawLine({ start: { x: M, y: rY }, end: { x: M + tableW, y: rY }, thickness: 0.3, color: BORDER_LIGHT });
  });

  if (allRows.length > MAX_ROWS) {
    page.drawText(`Exibidos ${MAX_ROWS} de ${allRows.length} no total — listagem priorizada por proximidade.`, {
      x: M, y: contentBottom - 4, size: 8.5, font: italic, color: MUTED,
    });
  }

  // ---------- BLOCO B · DISTRIBUIÇÃO ----------
  page.drawText('DISTRIBUIÇÃO POR FAIXA', { x: distX, y: contentTop - 12, size: 9, font: bold, color: NAVY });
  const distItems = FAIXAS.map(f => {
    const tot = (e.Mensalidade === f ? 1 : 0) + concs.filter((c: any) => c.escola.Mensalidade === f).length;
    return { faixa: f, label: FAIXA_LABEL[f], total: tot, hasTarget: e.Mensalidade === f };
  }).filter(x => x.total > 0);
  const maxTot = Math.max(...distItems.map(x => x.total), 1);
  const distAreaTop = contentTop - 24;
  const distAreaBottom = contentBottom + 6;
  const distAreaH = distAreaTop - distAreaBottom;
  const distRowH = distItems.length > 0 ? Math.min(40, distAreaH / distItems.length) : 0;
  distItems.forEach((d2, i) => {
    const rY = distAreaTop - distRowH * (i + 1);
    const labelY = rY + distRowH - 11;
    const barY = rY + 4;
    const barH = 8;
    const barFullW = distW - 4;
    page.drawText((d2.hasTarget ? '★ ' : '') + d2.label, { x: distX, y: labelY, size: 8, font: d2.hasTarget ? bold : font, color: d2.hasTarget ? TEAL : NAVY });
    const totW = font.widthOfTextAtSize(`${d2.total}`, 8);
    page.drawText(`${d2.total}`, { x: distX + distW - totW, y: labelY, size: 8, font: bold, color: NAVY });
    page.drawRectangle({ x: distX, y: barY, width: barFullW, height: barH, color: BORDER_LIGHT });
    const fillW = (d2.total / maxTot) * barFullW;
    if (fillW > 0) {
      page.drawRectangle({ x: distX, y: barY, width: fillW, height: barH, color: d2.hasTarget ? TEAL : NAVY });
    }
  });
}

// ----- 10. Socioeconômico
function renderPdfSocioeconomico(page: PDFPage, font: PDFFont, bold: PDFFont, italic: PDFFont, ctx: ExportContext, data: any, n: number, total: number) {
  const d: DrawCtx = { page, font, bold, italic, ctx, pageNo: n, total };
  drawPDFHeader(d); drawPDFFooter(d);
  drawPDFTitle(d, 'Perfil Socioeconômico e Aderência Econômica', `Leitura demográfica, econômica e de aderência ao ticket da população de ${ctx.analysis.escola.Município}/${ctx.analysis.escola.UF}.`);

  if (!data.d) {
    page.drawText('Dado não disponível na base fornecida.', { x: M, y: PDF_H / 2, size: 12, font: italic, color: MUTED });
    return;
  }

  // ----- 3 KPIs grandes (Renda Média / IDH Renda / IDH Educação) -----
  const cardW3 = (PDF_W - 2 * M - 24) / 3;
  const cardH3 = 72;
  const cardY = PDF_H - CONTENT_TOP - 130;
  drawKpiCard(page, font, bold, M + 0 * (cardW3 + 12), cardY, cardW3, cardH3, 'Renda Média', fmtBRL(data.rendaMedia), TEAL, 26);
  drawKpiCard(page, font, bold, M + 1 * (cardW3 + 12), cardY, cardW3, cardH3, 'IDH Renda', String(data.idhRenda), NAVY, 26);
  drawKpiCard(page, font, bold, M + 2 * (cardW3 + 12), cardY, cardW3, cardH3, 'IDH Educação', String(data.idhEduc), LIME, 26);

  // ----- Bloco esquerdo: distribuição etária / Bloco direito: heatmap -----
  const blockTop = cardY - 16;
  const blockBottom = 70;
  const blockH = blockTop - blockBottom;
  const leftW = (PDF_W - 2 * M - 18) * 0.42;
  const rightW = (PDF_W - 2 * M - 18) - leftW;
  const rightX = M + leftW + 18;

  // ESQUERDA — distribuição etária
  page.drawText('DISTRIBUIÇÃO ETÁRIA · MUNICÍPIO (2025)', { x: M, y: blockTop - 12, size: 9, font: bold, color: NAVY });
  const faixasEt = ['0 a 4', '5 a 9', '10 a 14', '15 a 19'];
  const popData = faixasEt.map(f => ({
    label: `${f} anos`,
    value: parseInt(data.d[`População por Faixa Etária (2025) - ${f} anos`] || '0'),
    color: TEAL,
  }));
  drawVBars(page, font, M + 16, blockBottom + 24, leftW - 24, blockH - 50, popData, undefined, fmtInt);

  // DIREITA — heatmap Renda × Faixa Etária
  page.drawText('RENDA × FAIXA ETÁRIA · MUNICÍPIO', { x: rightX, y: blockTop - 12, size: 9, font: bold, color: NAVY });
  if (data.matrix) {
    const headers = ['Classe', '0–4', '5–14', '15–19', 'Total'];
    const colWeights = [0.20, 0.20, 0.20, 0.20, 0.20];
    const colW = colWeights.map(w => rightW * w);
    const tblHeadY = blockTop - 28;
    let cx = rightX;
    headers.forEach((h, i) => {
      const align = i === 0 ? 0 : colW[i] - 6 - font.widthOfTextAtSize(h, 8);
      page.drawText(h, { x: cx + (i === 0 ? 4 : align), y: tblHeadY, size: 8, font: bold, color: MUTED });
      cx += colW[i];
    });
    const allCells: number[] = [];
    data.matrix.forEach((r: any) => { allCells.push(r.ate4, r.de5a14, r.de15a19); });
    const maxCell = Math.max(...allCells, 1);
    const aderSet = new Set(data.faixasAderentes);
    const rowsCount = data.matrix.length;
    const availH = (tblHeadY - 6) - (blockBottom + 6);
    const rowH = Math.min(18, Math.max(12, availH / rowsCount));
    let ry = tblHeadY - rowH;
    data.matrix.forEach((r: any) => {
      const isAder = aderSet.has(r.faixa);
      if (isAder) {
        page.drawRectangle({ x: rightX, y: ry, width: rightW, height: rowH, color: TEAL_LIGHT });
      }
      cx = rightX;
      page.drawText((isAder ? '● ' : '  ') + r.faixa, { x: cx + 4, y: ry + rowH / 2 - 3, size: 8.5, font: isAder ? bold : font, color: isAder ? TEAL : NAVY });
      cx += colW[0];
      [r.ate4, r.de5a14, r.de15a19].forEach((v, i) => {
        const intensity = v / maxCell;
        const fill = rgb(0.93 - intensity * 0.55, 0.96 - intensity * 0.4, 0.96 - intensity * 0.4);
        page.drawRectangle({ x: cx + 2, y: ry + 1, width: colW[i + 1] - 4, height: rowH - 2, color: fill, borderColor: BORDER_LIGHT, borderWidth: 0.3 });
        const tt = fmtInt(v);
        const tw = font.widthOfTextAtSize(tt, 8);
        page.drawText(tt, { x: cx + colW[i + 1] - 6 - tw, y: ry + rowH / 2 - 3, size: 8, font, color: NAVY });
        cx += colW[i + 1];
      });
      const tot = r.ate4 + r.de5a14 + r.de15a19;
      const tt = fmtInt(tot);
      const tw = bold.widthOfTextAtSize(tt, 8);
      page.drawText(tt, { x: cx + colW[4] - 6 - tw, y: ry + rowH / 2 - 3, size: 8, font: bold, color: NAVY });
      ry -= rowH;
    });
    page.drawText('● Faixas aderentes ao ticket atual da escola.', { x: rightX, y: blockBottom + 2, size: 7.5, font: italic, color: MUTED });
  } else {
    page.drawText('Matriz de renda não disponível para este município.', { x: rightX, y: blockTop - 32, size: 9, font: italic, color: MUTED });
  }

  // ----- Leitura curta -----
  const aderencia = data.aderencia;
  let leitura: string;
  if (aderencia >= 30) leitura = 'Base sólida de famílias com poder de compra alinhado — espaço para reforçar valor agregado e diferenciais pedagógicos.';
  else if (aderencia >= 15) leitura = 'Existe nicho relevante — comunique custo-benefício e proposta de valor para reduzir sensibilidade a preço.';
  else leitura = 'Base aderente limitada — atenção à elasticidade de preço e à necessidade de comunicar retorno do investimento educacional.';
  page.drawRectangle({ x: M, y: 36, width: PDF_W - 2 * M, height: 26, color: TEAL_LIGHT, borderColor: TEAL, borderWidth: 0.5 });
  page.drawText(`LEITURA · ${data.aderenteCls.label.toUpperCase()} (${aderencia.toFixed(0)}%)`, { x: M + 10, y: 50, size: 8.5, font: bold, color: TEAL });
  drawParagraph(page, font, leitura, M + 10, 40, PDF_W - 2 * M - 20, 9, NAVY, 1);
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
  drawPDFTitle(d, 'Insights e Recomendações', 'Síntese estratégica da área de influência e direcionamentos comerciais prioritários.');

  const ms = ctx.analysis.marketShare;
  const segShares = [
    { l: 'Educação Infantil', v: ms.ei },
    { l: 'Fund. AI', v: ms.efi },
    { l: 'Fund. AF', v: ms.efii },
    { l: 'Ensino Médio', v: ms.em },
  ].filter(s => s.v > 0).sort((a, b) => b.v - a.v);
  const bestSeg = segShares[0];
  const weakSeg = segShares[segShares.length - 1];

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

  // ============== FAIXA SUPERIOR — 4 INSIGHTS (grade 4×1) ==============
  page.drawText('INSIGHTS', { x: M, y: PDF_H - CONTENT_TOP - 56, size: 9, font: bold, color: NAVY });
  const insTop4 = insights.slice(0, 4);
  const cw = (PDF_W - 2 * M - 30) / 4;
  const ch = 150;
  const gx = 10;
  const topY = PDF_H - CONTENT_TOP - 70 - ch;
  insTop4.forEach((it, i) => {
    const x = M + i * (cw + gx);
    page.drawRectangle({ x, y: topY, width: cw, height: ch, color: WHITE, borderColor: BORDER, borderWidth: 0.5 });
    page.drawRectangle({ x, y: topY + ch - 4, width: cw, height: 4, color: it.tagColor });
    page.drawText(it.tag, { x: x + cw - 78, y: topY + ch - 18, size: 7, font: bold, color: it.tagColor });
    page.drawText(it.title.toUpperCase(), { x: x + 12, y: topY + ch - 18, size: 8.5, font: bold, color: NAVY });
    let cy = topY + ch - 38;
    cy = drawParagraph(page, bold, it.dado, x + 12, cy, cw - 24, 10, it.tagColor, 2);
    cy -= 4;
    drawParagraph(page, font, it.leitura, x + 12, cy, cw - 24, 8.5, TEXT, 3);
  });

  // ============== FAIXA INFERIOR — 4 RECOMENDAÇÕES ==============
  type Reco = { prio: string; prioColor: RGB; titulo: string; acao: string; objetivo: string };
  const recos: Reco[] = [
    { prio: data.aderencia < 15 ? 'Alta prioridade' : 'Estratégica', prioColor: data.aderencia < 15 ? RED : TEAL,
      titulo: 'Reforçar comunicação de valor',
      acao: `Estruturar mensagens claras${bestSeg ? ` em ${bestSeg.l}` : ''}: proposta pedagógica, resultados e formação.`,
      objetivo: 'Reduzir sensibilidade a preço e proteger ticket.' },
    { prio: 'Alta prioridade', prioColor: TEAL,
      titulo: bestSeg ? `Captação focada em ${bestSeg.l}` : 'Captação focada no segmento líder',
      acao: 'Funil dedicado: cadastros → agendas → visitas → matrículas, com meta numérica e CPA-alvo por canal.',
      objetivo: 'Ampliar volume e converter share em matrículas.' },
    { prio: 'Estratégica', prioColor: NAVY,
      titulo: 'Rematrícula antecipada e retenção',
      acao: `Antecipar campanha${weakSeg ? `, com foco em ${weakSeg.l}` : ''}; mapear sinais de evasão e atuar antes da decisão.`,
      objetivo: 'Sustentar base e reduzir reposição na captação.' },
    { prio: 'Contínua', prioColor: LIME,
      titulo: 'Monitoramento competitivo',
      acao: `Acompanhar trimestralmente os ${data.concs.length} concorrentes diretos: preço, segmentos, comunicação e parcerias.`,
      objetivo: 'Antecipar movimentos e proteger posicionamento.' },
  ];
  const recoTop = topY - 24;
  page.drawText('RECOMENDAÇÕES', { x: M, y: recoTop, size: 9, font: bold, color: NAVY });
  const rcw = (PDF_W - 2 * M - 30) / 4;
  const rch = recoTop - 14 - (CONTENT_BOTTOM + 24);
  const rcy0 = CONTENT_BOTTOM + 24;
  recos.forEach((r, i) => {
    const x = M + i * (rcw + gx);
    page.drawRectangle({ x, y: rcy0, width: rcw, height: rch, color: WHITE, borderColor: BORDER, borderWidth: 0.5 });
    page.drawRectangle({ x, y: rcy0, width: 4, height: rch, color: r.prioColor });
    // prioridade pill
    const pw = bold.widthOfTextAtSize(r.prio.toUpperCase(), 7) + 10;
    page.drawRectangle({ x: x + 12, y: rcy0 + rch - 18, width: pw, height: 12, color: r.prioColor });
    page.drawText(r.prio.toUpperCase(), { x: x + 17, y: rcy0 + rch - 15, size: 7, font: bold, color: WHITE });
    // título
    let cy = rcy0 + rch - 34;
    cy = drawParagraph(page, bold, r.titulo, x + 12, cy, rcw - 24, 10.5, NAVY, 2);
    cy -= 4;
    cy = drawParagraph(page, font, 'Ação: ' + r.acao, x + 12, cy, rcw - 24, 8.5, TEXT, 3);
    cy -= 3;
    drawParagraph(page, italic, 'Objetivo: ' + r.objetivo, x + 12, cy, rcw - 24, 8.5, MUTED, 2);
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

  const renderersAll: Array<{ render: (s: PptxGenJS.Slide, n: number) => void; key?: string }> = [
    { render: (s) => pptCapa(s, ctx) },
    { render: (s, n) => pptAbertura(s, ctx, n, total) },
    { render: (s, n) => pptResumo(s, ctx, data, n, total) },
    { render: (s, n) => pptPanorama(s, ctx, data, n, total) },
    { render: (s, n) => pptConcorrencia(s, ctx, data, n, total) },
    { render: (s, n) => pptMarketShare(s, ctx, data, n, total) },
    { render: (s, n) => pptMensalidade(s, ctx, data, n, total) },
    { render: (s, n) => pptSocio(s, ctx, data, n, total) },
    { render: (s, n) => pptPotencial(s, ctx, data, n, total) },
    { render: (s, n) => pptInsights(s, ctx, data, n, total) },
    { render: (s, n) => pptAcaoComercial(s, ctx, data, n, total) },
    { render: (s) => pptEncerramento(s, ctx) },
  ];
  const renderers = renderersAll.map(r => r.render);

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
  s.addText(title, { x: PPT_M, y: yCursor, w: PPT_W - 2 * PPT_M, h: 0.6, fontSize: 28, bold: true, color: C.navy, fontFace: 'Calibri', shrinkText: true });
  // Barrinha verde abaixo do título (padrão visual do projeto)
  s.addShape('rect', { x: PPT_M, y: yCursor + 0.62, w: 0.7, h: 0.06, fill: { color: C.teal }, line: { color: C.teal } });
  if (subtitle) s.addText(subtitle, { x: PPT_M, y: yCursor + 0.74, w: PPT_W - 2 * PPT_M, h: 0.36, fontSize: 11, italic: true, color: C.muted, fontFace: 'Calibri' });
}

// KPI estilo Santa Mônica: card lavanda discreto, label cinza pequeno, valor grande navy
function pptKpi(s: PptxGenJS.Slide, x: number, y: number, w: number, h: number, label: string, value: string, _accent = C.teal, valueFontSize = 22) {
  s.addShape('roundRect', { x, y, w, h, fill: { color: C.lavender }, line: { color: C.lavender }, rectRadius: 0.08 } as any);
  s.addText(label, { x: x + 0.18, y: y + 0.14, w: w - 0.36, h: 0.28, fontSize: 10, color: C.muted, fontFace: 'Calibri' });
  s.addText(value, { x: x + 0.18, y: y + 0.42, w: w - 0.36, h: h - 0.5, fontSize: valueFontSize, bold: true, color: C.navy, fontFace: 'Calibri', shrinkText: true, valign: 'top' });
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
  // ============================================================
  // CAPA — paper executivo 16:9 · composição central
  // Fundo navy institucional, conteúdo centralizado, hierarquia
  // dominada pelo nome da escola. Sem rodapé/numeração.
  // ============================================================
  const SAFE = 0.4;
  const cx = PPT_W / 2;

  // Fundo navy
  s.background = { color: C.navy };

  // Filetes finos lima nas bordas superior e inferior — moldura editorial
  s.addShape('rect', { x: 0, y: 0, w: PPT_W, h: 0.06, fill: { color: C.lime }, line: { color: C.lime } });
  s.addShape('rect', { x: 0, y: PPT_H - 0.06, w: PPT_W, h: 0.06, fill: { color: C.lime }, line: { color: C.lime } });

  // ---------- TOPO: marca EDB centralizada ----------
  s.addText('EDB', {
    x: 0, y: SAFE + 0.25, w: PPT_W, h: 0.55,
    fontSize: 26, bold: true, color: C.white, align: 'center', fontFace: 'Calibri', charSpacing: 6,
  });
  s.addText('EDITORA DO BRASIL', {
    x: 0, y: SAFE + 0.85, w: PPT_W, h: 0.3,
    fontSize: 10, color: C.tealLight, align: 'center', fontFace: 'Calibri', charSpacing: 4,
  });

  // Filete teal centralizado (separador)
  s.addShape('rect', {
    x: cx - 0.3, y: SAFE + 1.3, w: 0.6, h: 0.04,
    fill: { color: C.teal }, line: { color: C.teal },
  });

  // ---------- BLOCO CENTRAL ----------
  // Subtítulo reforçado: "CIT · Centro de Inteligência Territorial · Prospecção/Renovação"
  s.addText(
    [
      { text: 'CIT · Centro de Inteligência Territorial', options: { color: C.tealLight } },
      { text: '   ·   ', options: { color: C.lime, bold: true } },
      { text: tipoLabel(ctx.presentationType), options: { color: C.white, bold: true } },
    ] as any,
    {
      x: SAFE, y: 2.15, w: PPT_W - 2 * SAFE, h: 0.5,
      fontSize: 16, align: 'center', fontFace: 'Calibri', charSpacing: 2,
    }
  );

  // HEADLINE: nome da escola (dominante)
  s.addText(ctx.analysis.escola.Escola, {
    x: SAFE, y: 2.85, w: PPT_W - 2 * SAFE, h: 1.85,
    fontSize: 52, bold: true, color: C.white, align: 'center', valign: 'middle',
    fontFace: 'Calibri', shrinkText: true,
  });

  // Filete lima curto centralizado abaixo do nome
  s.addShape('rect', {
    x: cx - 0.5, y: 4.85, w: 1.0, h: 0.04,
    fill: { color: C.lime }, line: { color: C.lime },
  });

  // Município/UF + INEP — compacto, uma linha
  s.addText(
    [
      { text: `${ctx.analysis.escola.Município} · ${ctx.analysis.escola.UF}`, options: { bold: true, color: C.white } },
      { text: '     |     ', options: { color: C.navySoft } },
      { text: `Código INEP ${ctx.analysis.escola['Código Inep']}`, options: { color: C.tealLight } },
    ] as any,
    {
      x: SAFE, y: 5.05, w: PPT_W - 2 * SAFE, h: 0.4,
      fontSize: 13, align: 'center', fontFace: 'Calibri',
    }
  );

  // ---------- BLOCO INFERIOR: ficha técnica discreta ----------
  // Linha divisória sutil
  s.addShape('line', {
    x: cx - 2.5, y: PPT_H - 1.45, w: 5.0, h: 0,
    line: { color: C.navySoft, width: 0.5 },
  });

  // Consultor — mais discreto (label pequeno + nome em peso médio)
  if (ctx.session) {
    s.addText('CONSULTOR RESPONSÁVEL', {
      x: SAFE, y: PPT_H - 1.3, w: PPT_W - 2 * SAFE, h: 0.25,
      fontSize: 8, color: C.lime, align: 'center', fontFace: 'Calibri', charSpacing: 3,
    });
    s.addText(`${ctx.session.nome}  ·  Cód. ${ctx.session.codigo}`, {
      x: SAFE, y: PPT_H - 1.05, w: PPT_W - 2 * SAFE, h: 0.32,
      fontSize: 12, color: C.white, align: 'center', fontFace: 'Calibri',
    });
  }

  // Lema institucional no rodapé
  s.addText('Transformando o país pela educação.', {
    x: SAFE, y: PPT_H - 0.6, w: PPT_W - 2 * SAFE, h: 0.3,
    fontSize: 11, italic: true, color: C.tealLight, align: 'center', fontFace: 'Calibri',
  });
}

// ----- 2. Abertura
function pptAbertura(s: PptxGenJS.Slide, ctx: ExportContext, n: number, total: number) {
  // ============================================================
  // ABERTURA COMERCIAL — paper executivo 16:9
  // Hierarquia: chip > headline 32pt > intro curta 13pt >
  // bloco "Inteligência de Dados" (4 pilares em cards) >
  // faixa de fechamento "Nosso Compromisso".
  // ============================================================
  pptFooter(s, ctx, n, total);

  const SAFE = 0.4;
  const W = PPT_W - 2 * SAFE;

  // 1) Chip + headline
  pptChip(s, SAFE, 0.55, 'Abertura Comercial');
  s.addText('Uma análise construída para a sua escola.', {
    x: SAFE, y: 1.0, w: W, h: 0.85,
    fontSize: 32, bold: true, color: C.navy, fontFace: 'Calibri', shrinkText: true,
  });

  // Filete teal sob o título (separador editorial)
  s.addShape('rect', {
    x: SAFE, y: 1.92, w: 0.9, h: 0.05,
    fill: { color: C.teal }, line: { color: C.teal },
  });

  // 2) Subtítulo / intro enxuta (1 frase)
  const intro = ctx.presentationType === 'prospeccao'
    ? `Inteligência territorial aplicada à ${ctx.analysis.escola.Escola} — para mapear oportunidades reais de captação, retenção e marca.`
    : `Cenário competitivo e socioeconômico da ${ctx.analysis.escola.Escola} consolidado para sustentar a conversa de renovação.`;
  s.addText(intro, {
    x: SAFE, y: 2.1, w: W, h: 0.55,
    fontSize: 14, color: C.text, fontFace: 'Calibri', italic: true, valign: 'top',
  });

  // 3) Eyebrow do bloco analítico
  s.addText('INTELIGÊNCIA DE DADOS', {
    x: SAFE, y: 2.85, w: W, h: 0.28,
    fontSize: 10, bold: true, color: C.teal, fontFace: 'Calibri', charSpacing: 3,
  });
  s.addText('Cruzamento de fontes públicas e proprietárias para decisão comercial.', {
    x: SAFE, y: 3.13, w: W, h: 0.28,
    fontSize: 11, color: C.muted, fontFace: 'Calibri',
  });

  // 4) Quatro pilares analíticos em cards visuais
  const pillars = [
    { tag: '01', title: 'Concorrência',     body: 'Mapa territorial e comparativo por raio.' },
    { tag: '02', title: 'Market Share',     body: 'Participação por segmento na área.' },
    { tag: '03', title: 'Mensalidade',      body: 'Faixa de preço e posicionamento.' },
    { tag: '04', title: 'Socioeconômico',   body: 'Renda, faixa etária e potencial.' },
  ];
  const cardY = 3.55;
  const cardH = 1.85;
  const gap = 0.18;
  const cardW = (W - gap * (pillars.length - 1)) / pillars.length;

  pillars.forEach((p, i) => {
    const x = SAFE + i * (cardW + gap);
    // Card branco com borda fina
    s.addShape('roundRect', {
      x, y: cardY, w: cardW, h: cardH,
      fill: { color: C.white }, line: { color: C.border, width: 0.75 }, rectRadius: 0.08,
    } as any);
    // Faixa lateral superior (acento) — alterna teal/navy/lima/teal
    const accent = i === 2 ? C.lime : (i === 1 ? C.navy : C.teal);
    s.addShape('rect', {
      x, y: cardY, w: cardW, h: 0.08,
      fill: { color: accent }, line: { color: accent },
    });
    // Tag numerada
    s.addText(p.tag, {
      x: x + 0.2, y: cardY + 0.18, w: cardW - 0.4, h: 0.3,
      fontSize: 11, bold: true, color: accent, fontFace: 'Calibri', charSpacing: 2,
    });
    // Título
    s.addText(p.title, {
      x: x + 0.2, y: cardY + 0.5, w: cardW - 0.4, h: 0.45,
      fontSize: 16, bold: true, color: C.navy, fontFace: 'Calibri',
    });
    // Filete fino divisor
    s.addShape('line', {
      x: x + 0.2, y: cardY + 1.0, w: 0.4, h: 0,
      line: { color: C.borderLight, width: 0.75 },
    });
    // Descrição curta
    s.addText(p.body, {
      x: x + 0.2, y: cardY + 1.1, w: cardW - 0.4, h: cardH - 1.2,
      fontSize: 11, color: C.muted, fontFace: 'Calibri', valign: 'top',
    });
  });

  // 5) Faixa de fechamento "Nosso Compromisso" — destaque visual forte
  const fY = 5.65;
  const fH = 1.15;
  s.addShape('rect', {
    x: SAFE, y: fY, w: W, h: fH,
    fill: { color: C.navy }, line: { color: C.navy },
  });
  // Filete lima lateral esquerdo
  s.addShape('rect', {
    x: SAFE, y: fY, w: 0.1, h: fH,
    fill: { color: C.lime }, line: { color: C.lime },
  });
  // Eyebrow lima
  s.addText('NOSSO COMPROMISSO', {
    x: SAFE + 0.35, y: fY + 0.18, w: W - 0.7, h: 0.25,
    fontSize: 9.5, bold: true, color: C.lime, fontFace: 'Calibri', charSpacing: 3,
  });
  // Frase de fechamento — curta, impactante
  s.addText('Mais do que dados: caminhos comerciais para escolas que querem crescer com consistência, relevância e valor.', {
    x: SAFE + 0.35, y: fY + 0.45, w: W - 0.7, h: fH - 0.55,
    fontSize: 14, color: C.white, fontFace: 'Calibri', italic: true, valign: 'top',
  });
}

// ----- 3. Resumo
function pptResumo(s: PptxGenJS.Slide, ctx: ExportContext, data: any, n: number, total: number) {
  pptHeader(s, ctx); pptFooter(s, ctx, n, total);
  const e = ctx.analysis.escola;
  const a = ctx.analysis;
  const segs = escolaSegmentos(e);

  // ============================================================
  // RESUMO EXECUTIVO — composição executiva, densa e equilibrada
  // Topo: título 32pt + filete teal + subtítulo 12pt (hierarquia compacta)
  // 1) Leitura executiva — callout robusto com borda navy à esquerda
  // 2) Cenário do Município — chip + 2 cards navy
  // 3) Escola Analisada — chip + 3 cards (MS destaque lime, Raio destaque teal,
  //    Mensalidade neutro mas com mesmo peso visual)
  // Rodapé: metodologia mais legível, separada por filete sutil
  // ============================================================
  const SAFE = 0.4;
  const W = PPT_W - 2 * SAFE;
  const ND = 'Dado não disponível na base fornecida.';

  // ---------- TOPO · TÍTULO COMPACTO COM FILETE ----------
  // Título alinhado à esquerda, filete teal logo abaixo, subtítulo próximo.
  // Substitui o pptTitle padrão para encaixar o slide inteiro com mais densidade.
  s.addText('Resumo Executivo', {
    x: SAFE, y: 0.42, w: W, h: 0.7,
    fontSize: 30, bold: true, color: C.navy, fontFace: 'Calibri', valign: 'top',
  });
  s.addShape('rect', { x: SAFE, y: 1.08, w: 0.5, h: 0.05, fill: { color: C.teal }, line: { color: C.teal } });
  s.addText('Visão geral do cenário escolar na área de influência', {
    x: SAFE, y: 1.18, w: W, h: 0.32,
    fontSize: 11.5, color: C.muted, fontFace: 'Calibri', italic: true, valign: 'top',
  });

  // ---------- BLOCO 1 · LEITURA EXECUTIVA ----------
  // Callout robusto: borda navy grossa à esquerda, padding generoso, 3 linhas de info
  const b1Y = 1.70;
  const b1H = 1.55;
  s.addShape('rect', { x: SAFE, y: b1Y, w: W, h: b1H, fill: { color: C.beige }, line: { color: C.borderLight, width: 0.75 } });
  s.addShape('rect', { x: SAFE, y: b1Y, w: 0.12, h: b1H, fill: { color: C.navy }, line: { color: C.navy } });
  // Eyebrow
  s.addText('LEITURA EXECUTIVA', {
    x: SAFE + 0.34, y: b1Y + 0.16, w: W - 0.5, h: 0.24,
    fontSize: 9, bold: true, color: C.tealDark, charSpacing: 2.5, fontFace: 'Calibri', valign: 'top',
  });
  // Linha 1 — nome da escola (grande, navy) + município (muted)
  const linha1: any[] = [
    { text: e.Escola, options: { bold: true, color: C.navy, fontSize: 17 } },
    { text: `   ·   ${e.Município}/${e.UF}`, options: { color: C.muted, fontSize: 13 } },
  ];
  s.addText(linha1, {
    x: SAFE + 0.34, y: b1Y + 0.42, w: W - 0.5, h: 0.42,
    fontFace: 'Calibri', valign: 'top',
  });
  // Linha 2 — segmentos (separados em label/valor)
  const segTxt = segs.length ? segs.join(' · ') : ND;
  const linha2: any[] = [
    { text: 'Segmentos atendidos:  ', options: { color: C.muted, fontSize: 11 } },
    { text: segTxt, options: { color: C.text, fontSize: 11, bold: segs.length > 0, italic: !segs.length } },
  ];
  s.addText(linha2, {
    x: SAFE + 0.34, y: b1Y + 0.88, w: W - 0.5, h: 0.32,
    fontFace: 'Calibri', valign: 'top',
  });
  // Linha 3 — área de influência + market share (números em destaque)
  const linha3: any[] = [
    { text: 'Área de influência:  ', options: { color: C.muted, fontSize: 11 } },
    { text: `${a.concorrentes.length + 1} escolas`, options: { color: C.navy, fontSize: 11, bold: true } },
    { text: '  e  ', options: { color: C.muted, fontSize: 11 } },
    { text: `${fmtInt(data.totalAlunadoArea)} alunos`, options: { color: C.navy, fontSize: 11, bold: true } },
    { text: '          Market share atual:  ', options: { color: C.muted, fontSize: 11 } },
    { text: fmtPct(a.marketShare.geral), options: { color: C.tealDark, fontSize: 12, bold: true } },
  ];
  s.addText(linha3, {
    x: SAFE + 0.34, y: b1Y + 1.18, w: W - 0.5, h: 0.32,
    fontFace: 'Calibri', valign: 'top',
  });

  // ---------- BLOCO 2 · CENÁRIO DO MUNICÍPIO ----------
  // Chip + sub-rótulo na MESMA linha; cards LOGO ABAIXO para reforçar coesão
  const b2Y = 3.45;
  pptChip(s, SAFE, b2Y, 'Cenário do Município');
  s.addText('Dimensão total do mercado escolar no município de referência', {
    x: SAFE + 2.35, y: b2Y + 0.04, w: W - 2.4, h: 0.3,
    fontSize: 10.5, italic: true, color: C.muted, fontFace: 'Calibri', valign: 'middle',
  });
  const muniRowY = b2Y + 0.42;
  const muniH = 1.05;
  const wM = (W - 0.3) / 2;
  pptResumoCard(s, SAFE,                muniRowY, wM, muniH, 'Total de Escolas', fmtInt(a.escolasMunicipio.length), C.navy, false);
  pptResumoCard(s, SAFE + wM + 0.3,     muniRowY, wM, muniH, 'Total de Alunos',  fmtInt(a.escolasMunicipio.reduce((s2: number, x: any) => s2 + num(x['Alunado Total']), 0)), C.navy, false);

  // ---------- BLOCO 3 · RAIO OPERACIONAL ----------
  const b3Y = muniRowY + muniH + 0.30;
  pptChip(s, SAFE, b3Y, 'Raio Operacional');
  s.addText('Indicadores escolares no raio operacional', {
    x: SAFE + 2.35, y: b3Y + 0.04, w: W - 2.4, h: 0.3,
    fontSize: 10.5, italic: true, color: C.muted, fontFace: 'Calibri', valign: 'middle',
  });
  const escRowY = b3Y + 0.42;
  const escH = 1.20;
  const wE = (W - 0.4) / 3;
  const mensRaw = (!e.Mensalidade || e.Mensalidade === '0') ? '' : e.Mensalidade;
  // Market Share — destaque PRINCIPAL (lime, fundo tealLight, valor 30pt)
  pptResumoCard(s, SAFE,                    escRowY, wE, escH, 'Market Share',          fmtPct(a.marketShare.geral), C.lime, true);
  // Raio Operacional — destaque secundário (teal, fundo tealLight)
  pptResumoCard(s, SAFE + wE + 0.2,         escRowY, wE, escH, 'Raio Operacional',      fmtKm(ctx.raioKm),           C.teal, true);
  // Mensalidade — mesmo peso, fundo branco com acento navy
  pptResumoCard(s, SAFE + 2 * (wE + 0.2),   escRowY, wE, escH, 'Faixa de Mensalidade',  mensRaw || ND,               C.navy, false, !mensRaw);

  // ---------- METODOLOGIA — rodapé com filete separador, mais legível ----------
  s.addText([
    { text: 'Metodologia  ·  ', options: { color: C.tealDark, fontSize: 9, bold: true, charSpacing: 1 } },
    { text: 'Censo Escolar 2024 + critérios de proximidade (CEP), faixa de mensalidade e segmentos comuns. Top 15 concorrentes por relevância competitiva.', options: { color: C.muted, fontSize: 9, italic: true } },
  ] as any, {
    x: SAFE, y: PPT_H - 0.66, w: W, h: 0.28,
    fontFace: 'Calibri', valign: 'middle',
  });
}

// Card local do Resumo — robusto, executivo, com forte hierarquia label/valor
// destaque=true → fundo tealLight + valor maior
// neutro=true   → valor menor + itálico (para "dado não disponível")
function pptResumoCard(
  s: PptxGenJS.Slide,
  x: number, y: number, w: number, h: number,
  label: string, value: string, accent: string,
  destaque = false, neutro = false,
) {
  const fill = destaque ? C.tealLight : C.white;
  // Card com sombra sutil (linha discreta) + borda fina
  s.addShape('rect', { x, y, w, h, fill: { color: fill }, line: { color: C.borderLight, width: 0.75 } });
  // Faixa de acento na lateral esquerda (mais "premium" que faixa superior fina)
  s.addShape('rect', { x, y, w: 0.07, h, fill: { color: accent }, line: { color: accent } });
  // Label — pequeno, MAIÚSCULO, com tracking, em muted
  s.addText(label.toUpperCase(), {
    x: x + 0.28, y: y + 0.18, w: w - 0.46, h: 0.28,
    fontSize: 9.5, bold: true, color: C.muted, charSpacing: 2, fontFace: 'Calibri', valign: 'top',
  });
  // Valor — grande, navy, ocupa o restante do card
  const vSize = neutro ? 13 : (destaque ? 34 : 26);
  s.addText(value, {
    x: x + 0.28, y: y + 0.5, w: w - 0.46, h: h - 0.6,
    fontSize: vSize, bold: !neutro, italic: neutro,
    color: neutro ? C.muted : C.navy,
    fontFace: 'Calibri', shrinkText: true, valign: 'middle',
  });
}

// ----- 4. Panorama
function pptPanorama(s: PptxGenJS.Slide, ctx: ExportContext, data: any, n: number, total: number) {
  pptHeader(s, ctx); pptFooter(s, ctx, n, total);

  const SAFE = 0.4;
  const W = PPT_W - 2 * SAFE;
  const a = ctx.analysis;

  // ---------- TOPO · TÍTULO COMPACTO COM FILETE (mesmo padrão do Resumo Executivo) ----------
  s.addText('Panorama Educacional da Região', {
    x: SAFE, y: 0.42, w: W, h: 0.7,
    fontSize: 30, bold: true, color: C.navy, fontFace: 'Calibri', valign: 'top',
  });
  s.addShape('rect', { x: SAFE, y: 1.08, w: 0.5, h: 0.05, fill: { color: C.teal }, line: { color: C.teal } });
  s.addText(`${a.concorrentes.length + 1} escolas  ·  ${fmtInt(data.totalAlunos)} alunos  ·  raio ${fmtKm(ctx.raioKm)}`, {
    x: SAFE, y: 1.18, w: W, h: 0.32,
    fontSize: 11.5, color: C.muted, fontFace: 'Calibri', italic: true, valign: 'top',
  });

  // ---------- CARDS SUPERIORES (mesmo padrão visual do Resumo Executivo) ----------
  const segOrd = data.segPanorama as Array<{ sigla: string; nome: string; alunos: number }>;
  const lider = segOrd[0];
  const liderPct = data.totalAlunos > 0 ? (lider?.alunos ?? 0) / data.totalAlunos * 100 : 0;
  const nEscolas = a.concorrentes.length + 1;
  const mediaEsc = Math.round(data.totalAlunos / Math.max(1, nEscolas));

  const cardsY = 1.70;
  const cardH = 1.10;
  const cw = (W - 0.6) / 4;
  pptResumoCard(s, SAFE + 0 * (cw + 0.2), cardsY, cw, cardH, 'Escolas',         String(nEscolas),         C.navy, false);
  pptResumoCard(s, SAFE + 1 * (cw + 0.2), cardsY, cw, cardH, 'Total de Alunos', fmtInt(data.totalAlunos), C.navy, false);
  pptResumoCard(s, SAFE + 2 * (cw + 0.2), cardsY, cw, cardH, 'Média/Escola',    fmtInt(mediaEsc),         C.navy, false);
  // Segmento Líder — leve destaque (lime)
  const lx = SAFE + 3 * (cw + 0.2);
  s.addShape('rect', { x: lx, y: cardsY, w: cw, h: cardH, fill: { color: C.tealLight }, line: { color: C.borderLight, width: 0.75 } });
  s.addShape('rect', { x: lx, y: cardsY, w: 0.07, h: cardH, fill: { color: C.lime }, line: { color: C.lime } });
  s.addText('SEGMENTO LÍDER', {
    x: lx + 0.28, y: cardsY + 0.18, w: cw - 0.46, h: 0.28,
    fontSize: 9.5, bold: true, color: C.muted, charSpacing: 2, fontFace: 'Calibri', valign: 'top',
  });
  s.addText(
    [
      { text: lider?.sigla ?? '—', options: { bold: true, color: C.navy, fontSize: 28 } },
      { text: `   ${fmtPct(liderPct, 0)}`, options: { color: C.tealDark, fontSize: 14, bold: true } },
    ] as any,
    { x: lx + 0.28, y: cardsY + 0.5, w: cw - 0.46, h: cardH - 0.6, fontFace: 'Calibri', valign: 'middle', shrinkText: true } as any,
  );

  // ---------- COBERTURA DE OFERTA (cálculo) ----------
  const todas = [a.escola, ...a.concorrentes.map((c: any) => c.escola)];
  const totEsc = todas.length;
  const segKey: Record<string, string> = {
    EI:   'qt_mat_educacao_infantil',
    EFI:  'qt_mat_ensino_fundamental_anos_iniciais',
    EFII: 'qt_mat_ensino_fundamental_anos_finais',
    EM:   'qt_mat_ensino_medio',
  };
  const cobertura = segOrd.map(seg => ({
    sigla: seg.sigla,
    nome: seg.nome,
    escolas: todas.filter(esc => num(esc[segKey[seg.sigla]]) > 0).length,
  }));
  const cobertOrd = [...cobertura].sort((x, y) => y.escolas - x.escolas);
  const empateCob = cobertOrd.length > 1 && cobertOrd[0].escolas === cobertOrd[1].escolas;

  // ===== Composição: gráfico (esq) + tabela cobertura (dir) =====
  const blockY = 3.05;
  const blockH = PPT_H - blockY - 0.6;
  const gapX = 0.3;
  const chartW = (W - gapX) * 0.58;
  const tableX = SAFE + chartW + gapX;
  const tableW = W - chartW - gapX;

  // ----- Gráfico de barras horizontais (esquerda) -----
  const liderSigla = lider?.sigla;
  const chartLabels = segOrd.map(seg => seg.nome);
  const chartValues = segOrd.map(seg => seg.alunos);
  const chartData = [{ name: 'Alunos', labels: chartLabels, values: chartValues }];
  const barColorsArr = segOrd.map(seg => seg.sigla === liderSigla ? C.teal : C.navy);

  s.addText('Volume de alunos por segmento', {
    x: SAFE, y: blockY, w: chartW, h: 0.3,
    fontSize: 12, bold: true, color: C.navy, fontFace: 'Calibri',
  });
  s.addText('Distribuição do total de alunos entre os níveis de ensino', {
    x: SAFE, y: blockY + 0.28, w: chartW, h: 0.26,
    fontSize: 10, italic: true, color: C.muted, fontFace: 'Calibri',
  });
  s.addChart(pptxgenChartType('bar'), chartData, {
    x: SAFE, y: blockY + 0.6, w: chartW, h: blockH - 0.6,
    barDir: 'bar',
    chartColors: barColorsArr,
    chartColorsOpacity: 100,
    showValue: true,
    dataLabelFontSize: 10,
    dataLabelColor: C.navy,
    dataLabelFontFace: 'Calibri',
    dataLabelPosition: 'outEnd',
    catAxisLabelFontFace: 'Calibri',
    catAxisLabelFontSize: 10,
    catAxisLabelColor: C.navy,
    valAxisLabelFontFace: 'Calibri',
    valAxisLabelFontSize: 9,
    valAxisLabelColor: C.muted,
    valGridLine: { style: 'none' } as any,
    catGridLine: { style: 'none' } as any,
    showLegend: false,
    showTitle: false,
    barGapWidthPct: 60,
  } as any);

  // ----- Tabela: Cobertura por segmento (direita) -----
  s.addText('Cobertura por segmento', {
    x: tableX, y: blockY, w: tableW, h: 0.3,
    fontSize: 12, bold: true, color: C.navy, fontFace: 'Calibri',
  });
  s.addText('Quantidade de escolas que ofertam cada nível de ensino', {
    x: tableX, y: blockY + 0.28, w: tableW, h: 0.26,
    fontSize: 10, italic: true, color: C.muted, fontFace: 'Calibri',
  });

  const tHeadY = blockY + 0.6;
  const tHeadH = 0.3;
  const tBodyTop = tHeadY + tHeadH;
  const tBodyBottom = blockY + blockH;
  const tRowH = Math.max(0.34, Math.min(0.5, (tBodyBottom - tBodyTop) / cobertOrd.length));

  // Header
  const colSegW = tableW * 0.40;
  const colEscW = tableW * 0.26;
  const colPctW = tableW * 0.14;
  const colBarW = tableW - colSegW - colEscW - colPctW;
  s.addShape('rect', { x: tableX, y: tHeadY, w: tableW, h: tHeadH, fill: { color: C.beige }, line: { color: C.beige } });
  s.addText('SEGMENTO', { x: tableX + 0.1, y: tHeadY, w: colSegW, h: tHeadH, fontSize: 8.5, bold: true, color: C.muted, fontFace: 'Calibri', valign: 'middle', charSpacing: 1 });
  s.addText('ESCOLAS',  { x: tableX + colSegW, y: tHeadY, w: colEscW, h: tHeadH, fontSize: 8.5, bold: true, color: C.muted, fontFace: 'Calibri', valign: 'middle', align: 'right', charSpacing: 1 });
  s.addText('%',        { x: tableX + colSegW + colEscW, y: tHeadY, w: colPctW - 0.06, h: tHeadH, fontSize: 8.5, bold: true, color: C.muted, fontFace: 'Calibri', valign: 'middle', align: 'right', charSpacing: 1 });

  cobertOrd.forEach((seg, i) => {
    const ry = tBodyTop + i * tRowH;
    const isLeader = i === 0 && !empateCob;
    if (i % 2 === 0) {
      s.addShape('rect', { x: tableX, y: ry, w: tableW, h: tRowH, fill: { color: C.borderLight }, line: { color: C.borderLight } });
    }
    if (isLeader) {
      s.addShape('rect', { x: tableX, y: ry, w: 0.05, h: tRowH, fill: { color: C.lime }, line: { color: C.lime } });
    }
    s.addText(seg.nome, {
      x: tableX + 0.1, y: ry, w: colSegW - 0.1, h: tRowH,
      fontSize: 10.5, bold: isLeader, color: C.navy, fontFace: 'Calibri', valign: 'middle',
    });
    s.addText(`${seg.escolas} de ${totEsc}`, {
      x: tableX + colSegW, y: ry, w: colEscW - 0.06, h: tRowH,
      fontSize: 10.5, bold: isLeader, color: C.text, fontFace: 'Calibri', valign: 'middle', align: 'right',
    });
    const pCob = totEsc > 0 ? (seg.escolas / totEsc) * 100 : 0;
    s.addText(fmtPct(pCob, 0), {
      x: tableX + colSegW + colEscW, y: ry, w: colPctW - 0.06, h: tRowH,
      fontSize: 10.5, bold: isLeader, color: isLeader ? C.navy : C.text, fontFace: 'Calibri', valign: 'middle', align: 'right',
    });
    // mini barra horizontal discreta
    const barX = tableX + colSegW + colEscW + colPctW + 0.04;
    const barW = colBarW - 0.12;
    const barY = ry + tRowH / 2 - 0.04;
    if (barW > 0.3) {
      s.addShape('rect', { x: barX, y: barY, w: barW, h: 0.08, fill: { color: C.borderLight }, line: { color: C.borderLight } });
      s.addShape('rect', { x: barX, y: barY, w: Math.max(0.04, (pCob / 100) * barW), h: 0.08, fill: { color: isLeader ? C.lime : C.teal }, line: { color: isLeader ? C.lime : C.teal } });
    }
  });
}

// helper para chart enum
function pptxgenChartType(t: 'bar' | 'pie'): any {
  // pptxgenjs exporta enum ChartType
  return ((PptxGenJS as any).ChartType ?? { bar: 'bar', pie: 'pie' })[t];
}

// ----- 5. Concorrência — slide único (sem mapa)
// Padrão visual alinhado ao "Resumo Executivo" e "Panorama Educacional":
// título compacto + filete teal + subtítulo italic, linha-resumo,
// 4 mini cards de principais concorrentes (com prioridade aos essenciais
// escolhidos pelo consultor) e tabela enxuta com os demais.
function pptConcorrencia(s: PptxGenJS.Slide, ctx: ExportContext, data: any, n: number, total: number) {
  pptHeader(s, ctx); pptFooter(s, ctx, n, total);

  const SAFE = 0.4;
  const W = PPT_W - 2 * SAFE;
  const e = data.e;
  const concsAll = data.concs as any[];
  const totalConc = concsAll.length;
  const essList = ctx.essenciaisInep ?? [];
  const { top, restantes, isEssencial } = selectTopConcorrentes(concsAll, e, essList, 4);

  // ---------- TOPO · TÍTULO COMPACTO COM FILETE ----------
  s.addText('Concorrência', {
    x: SAFE, y: 0.42, w: W, h: 0.7,
    fontSize: 30, bold: true, color: C.navy, fontFace: 'Calibri', valign: 'top',
  });
  s.addShape('rect', { x: SAFE, y: 1.08, w: 0.5, h: 0.05, fill: { color: C.teal }, line: { color: C.teal } });
  s.addText('Concorrentes elegíveis selecionados para comparação com a escola analisada dentro da área de influência.', {
    x: SAFE, y: 1.18, w: W, h: 0.32,
    fontSize: 11.5, color: C.muted, fontFace: 'Calibri', italic: true, valign: 'top',
  });

  // ---------- LINHA-RESUMO ----------
  s.addText(`Raio ${fmtKm(ctx.raioKm)} · ${ctx.raioMode === 'personalizado' ? 'personalizado' : 'padrão'} · ${totalConc} concorrente(s) elegíveis`, {
    x: SAFE, y: 1.55, w: W, h: 0.26,
    fontSize: 10, color: C.muted, fontFace: 'Calibri', valign: 'top',
  });

  // ---------- MINI CARDS — PRINCIPAIS CONCORRENTES ----------
  const cardsY = 1.85;
  const cardH = 1.30;
  const gap = 0.2;
  const cw = (W - 3 * gap) / 4;

  const segChipText = (seg: string) => {
    // Padronizado: mesmo tratamento p/ EI, EFI, EFII e EM
    return {
      text: ` ${seg} `,
      options: { fontSize: 8, bold: true, color: C.navy, fill: { color: C.tealLight }, fontFace: 'Calibri' },
    };
  };

  const drawMini = (cx: number, c: any | null) => {
    const ess = c ? isEssencial(c) : false;
    const fill = ess ? C.tealLight : C.white;
    s.addShape('rect', { x: cx, y: cardsY, w: cw, h: cardH, fill: { color: fill }, line: { color: C.borderLight, width: 0.75 } });
    s.addShape('rect', { x: cx, y: cardsY, w: 0.06, h: cardH, fill: { color: ess ? C.teal : C.navy }, line: { color: ess ? C.teal : C.navy } });
    if (!c) {
      s.addText('—', { x: cx + 0.18, y: cardsY + 0.4, w: cw - 0.3, h: 0.4, fontSize: 14, italic: true, color: C.muted, fontFace: 'Calibri', valign: 'middle' });
      return;
    }
    // Selo (canto sup. direito)
    const seloTxt = ess ? 'Selecionado' : 'Automático';
    s.addText(seloTxt, {
      x: cx + cw - 0.95, y: cardsY + 0.08, w: 0.88, h: 0.22,
      fontSize: 7.5, bold: true, color: ess ? C.white : C.muted, align: 'center',
      fill: { color: ess ? C.teal : C.borderLight }, fontFace: 'Calibri', valign: 'middle',
    });
    // Nome (até 2 linhas)
    s.addText(c.escola.Escola, {
      x: cx + 0.18, y: cardsY + 0.10, w: cw - 1.05, h: 0.50,
      fontSize: 10.5, bold: true, color: C.navy, fontFace: 'Calibri', valign: 'top', shrinkText: true,
    });
    // Distância
    const dist = distanciaLabel(c);
    s.addText(dist.text, {
      x: cx + 0.18, y: cardsY + 0.62, w: cw - 0.3, h: 0.22,
      fontSize: 9, color: dist.muted ? C.muted : C.text, italic: dist.muted, fontFace: 'Calibri', valign: 'middle',
    });
    // Segmentos como chips
    const segs = getSegmentos(c.escola);
    const chips: any[] = [];
    if (segs.length === 0) {
      chips.push({ text: '—', options: { fontSize: 9, color: C.muted, fontFace: 'Calibri' } });
    } else {
      segs.forEach((seg, i) => {
        if (i > 0) chips.push({ text: ' ', options: { fontSize: 8, fontFace: 'Calibri' } });
        const ch = segChipText(seg);
        chips.push({ text: ch.text, options: ch.options });
      });
    }
    s.addText(chips, {
      x: cx + 0.18, y: cardsY + 0.84, w: cw - 0.3, h: 0.22,
      valign: 'middle', fontFace: 'Calibri',
    } as any);
    // Tipo de adoção
    const tipo = tipoAdocaoOf(c.escola);
    const tipoND = tipoAdocaoIsND(c.escola);
    s.addText(
      [
        { text: 'Tipo de adoção: ', options: { fontSize: 8.5, color: C.muted, fontFace: 'Calibri' } },
        { text: tipo, options: { fontSize: 8.5, bold: !tipoND, color: tipoND ? C.muted : C.navy, italic: tipoND, fontFace: 'Calibri' } },
      ] as any,
      {
        x: cx + 0.18, y: cardsY + cardH - 0.30, w: cw - 0.3, h: 0.22,
        fontFace: 'Calibri', valign: 'middle', shrinkText: true,
      } as any,
    );
  };

  for (let i = 0; i < 4; i++) {
    drawMini(SAFE + i * (cw + gap), top[i] ?? null);
  }

  // ---------- TABELA — DEMAIS CONCORRENTES ----------
  const TOP_N = 10;
  const restShown = restantes.slice(0, TOP_N);
  const tableY = cardsY + cardH + 0.25;

  const headers = ['Escola', 'Distância / Proximidade', 'Segmentos', 'Tipo de adoção'];
  const headerRow = headers.map(h => ({
    text: h,
    options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 10, fontFace: 'Calibri', valign: 'middle' },
  }));
  const rows: any[] = [headerRow];

  restShown.forEach((c: any, idx: number) => {
    const ess = isEssencial(c);
    const fill = ess ? C.tealLight : (idx % 2 === 0 ? C.white : C.beige);
    const segs = getSegmentos(c.escola);
    const dist = distanciaLabel(c);
    const tipo = tipoAdocaoOf(c.escola);
    const tipoND = tipoAdocaoIsND(c.escola);
    const segCells: any[] = [];
    if (segs.length === 0) {
      segCells.push({ text: '—', options: { fontSize: 9.5, color: C.muted, fill: { color: fill }, fontFace: 'Calibri' } });
    } else {
      segs.forEach((seg, i) => {
        if (i > 0) segCells.push({ text: ' ', options: { fontSize: 8.5, fill: { color: fill }, fontFace: 'Calibri' } });
        const ch = segChipText(seg);
        segCells.push({ text: ch.text, options: { ...ch.options } });
      });
    }
    rows.push([
      { text: c.escola.Escola, options: { fontSize: 9.5, bold: true, color: C.navy, valign: 'middle', fill: { color: fill }, fontFace: 'Calibri' } },
      { text: dist.text, options: { fontSize: 9.5, color: dist.muted ? C.muted : C.text, valign: 'middle', fill: { color: fill }, fontFace: 'Calibri', italic: dist.muted } },
      { text: segCells, options: { fill: { color: fill }, valign: 'middle' } },
      { text: tipo, options: { fontSize: 9.5, color: tipoND ? C.muted : C.text, valign: 'middle', fill: { color: fill }, fontFace: 'Calibri', italic: tipoND } },
    ]);
  });

  if (restShown.length === 0) {
    rows.push([
      { text: 'Demais concorrentes não disponíveis — todos os elegíveis já estão destacados acima.',
        options: { fontSize: 9.5, italic: true, color: C.muted, valign: 'middle', fontFace: 'Calibri', colspan: 4 } },
    ] as any);
  }

  s.addTable(rows, {
    x: SAFE, y: tableY, w: W,
    colW: [W * 0.40, W * 0.20, W * 0.18, W * 0.22],
    rowH: 0.32, fontFace: 'Calibri',
    border: { type: 'solid', color: C.borderLight, pt: 0.4 },
  });

  // (Nota de truncamento removida a pedido — manter slide limpo.)
}

// ----- 6. Market Share — slide único (unifica geral + por segmento)
// Padrão visual alinhado a "Resumo Executivo" e "Panorama Educacional":
// título compacto + filete teal + subtítulo italic, linha-resumo,
// 5 mini cards (Geral + 4 segmentos) e heatmap como conteúdo principal.
function pptMarketShare(s: PptxGenJS.Slide, ctx: ExportContext, data: any, n: number, total: number) {
  pptHeader(s, ctx); pptFooter(s, ctx, n, total);

  const SAFE = 0.4;
  const W = PPT_W - 2 * SAFE;
  const a = ctx.analysis;
  const ms = a.marketShare;
  const universe = data.totalAlunadoArea;

  // ---------- TÍTULO COMPACTO COM FILETE ----------
  s.addText('Market Share', {
    x: SAFE, y: 0.42, w: W, h: 0.7,
    fontSize: 30, bold: true, color: C.navy, fontFace: 'Calibri', valign: 'top',
  });
  s.addShape('rect', { x: SAFE, y: 1.08, w: 0.5, h: 0.05, fill: { color: C.teal }, line: { color: C.teal } });
  s.addText('Participação de mercado da escola analisada na área de influência, com visão geral e por segmento.', {
    x: SAFE, y: 1.18, w: W, h: 0.32,
    fontSize: 11.5, color: C.muted, fontFace: 'Calibri', italic: true, valign: 'top',
  });

  // ---------- LINHA-RESUMO ----------
  s.addText(
    `Raio ${fmtKm(ctx.raioKm)} · ${a.concorrentes.length} concorrentes elegíveis · ${fmtInt(universe)} alunos na área de influência`,
    { x: SAFE, y: 1.55, w: W, h: 0.26, fontSize: 10, color: C.muted, fontFace: 'Calibri', valign: 'top' }
  );

  // ---------- 5 MINI CARDS ----------
  const cardsY = 1.85;
  const cardH = 1.05;
  const gap = 0.18;
  const cw = (W - 4 * gap) / 5;
  const segShares = [
    { l: 'Educação Infantil', v: ms.ei },
    { l: 'Fund. AI',          v: ms.efi },
    { l: 'Fund. AF',          v: ms.efii },
    { l: 'Ensino Médio',      v: ms.em },
  ];
  const maxSeg = Math.max(ms.ei, ms.efi, ms.efii, ms.em);
  const drawCard = (cx: number, label: string, value: string, accent: string, highlight = false) => {
    s.addShape('rect', {
      x: cx, y: cardsY, w: cw, h: cardH,
      fill: { color: highlight ? C.tealLight : C.white },
      line: { color: C.borderLight, width: 0.75 },
    });
    s.addShape('rect', { x: cx, y: cardsY, w: 0.06, h: cardH, fill: { color: accent }, line: { color: accent } });
    s.addText(label.toUpperCase(), {
      x: cx + 0.22, y: cardsY + 0.14, w: cw - 0.36, h: 0.26,
      fontSize: 9, bold: true, color: C.muted, charSpacing: 1.5, fontFace: 'Calibri', valign: 'top',
    });
    s.addText(value, {
      x: cx + 0.22, y: cardsY + 0.42, w: cw - 0.36, h: cardH - 0.5,
      fontSize: 24, bold: true, color: highlight ? C.tealDark : C.navy, fontFace: 'Calibri', valign: 'top', shrinkText: true,
    });
  };
  drawCard(SAFE, 'Geral', fmtPct(ms.geral), C.teal, true);
  segShares.forEach((seg, i) => {
    const isStrong = maxSeg > 0 && seg.v === maxSeg;
    drawCard(SAFE + (i + 1) * (cw + gap), seg.l, fmtPct(seg.v), isStrong ? C.lime : C.navy, isStrong);
  });

  // ---------- HEATMAP — TOP 8 ESCOLAS × 4 SEGMENTOS ----------
  const heatTitleY = cardsY + cardH + 0.22;
  s.addText('HEATMAP DE MARKET SHARE POR SEGMENTO', {
    x: SAFE, y: heatTitleY, w: W, h: 0.28,
    fontSize: 10, bold: true, color: C.navy, charSpacing: 1.5, fontFace: 'Calibri',
  });

  // Ordena: escola analisada na 1ª linha, depois ranking geral
  const ranked = [...data.allSchoolsRanked];
  const targetIdx = ranked.findIndex((r: any) => r.isTarget);
  if (targetIdx > 0) {
    const [t] = ranked.splice(targetIdx, 1);
    ranked.unshift(t);
  }
  const heatTop = ranked.slice(0, 8);

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
    const labelText: any[] = row.isTarget
      ? [
          { text: truncate(row.name, 34) + '  ', options: { fontSize: 9.5, bold: true, color: C.navy, fontFace: 'Calibri' } },
          { text: ' Em análise ', options: { fontSize: 8, bold: true, color: C.white, fill: { color: C.teal }, fontFace: 'Calibri' } },
        ]
      : [{ text: truncate(row.name, 38), options: { fontSize: 9.5, color: C.text, fontFace: 'Calibri' } }];
    const cells: any[] = [{
      text: labelText,
      options: { valign: 'middle', fill: { color: row.isTarget ? C.tealLight : C.white } },
    }];
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
        options: { fontSize: 10, color: intensity > 0.6 ? C.white : C.navy, align: 'center', fill: { color: fill }, fontFace: 'Calibri', bold: row.isTarget, valign: 'middle' },
      });
    });
    heatRows.push(cells);
  });
  s.addTable(heatRows, {
    x: SAFE, y: heatTitleY + 0.3, w: W,
    colW: [W * 0.46, W * 0.135, W * 0.135, W * 0.135, W * 0.135],
    rowH: 0.34, fontFace: 'Calibri',
    border: { type: 'solid', color: C.borderLight, pt: 0.4 },
  });

  // ---------- LEITURA CURTA ----------
  const segLido = segShares.filter(x => x.v > 0).sort((a, b) => b.v - a.v);
  const lider = segLido[0];
  const fraco = segLido[segLido.length - 1];
  const txt = lider && fraco && lider.l !== fraco.l
    ? `Maior penetração em ${lider.l} (${fmtPct(lider.v)}). Segmento mais vulnerável: ${fraco.l} (${fmtPct(fraco.v)}).`
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

  const SAFE = 0.4;
  const W = PPT_W - 2 * SAFE;
  const e = ctx.analysis.escola;
  const concs = data.concs as any[];
  const FAIXA_LABEL: Record<string, string> = {
    'até 399': 'Até R$ 399',
    '400 a 799': 'R$ 400 a R$ 799',
    '800 a 1.399': 'R$ 800 a R$ 1.399',
    '1.400 a 2.399': 'R$ 1.400 a R$ 2.399',
    'acima de R$ 2.400': 'Acima de R$ 2.400',
  };
  const FAIXAS = ['até 399', '400 a 799', '800 a 1.399', '1.400 a 2.399', 'acima de R$ 2.400'];
  const escIdx = getMensalidadeFaixa(e.Mensalidade);
  const escFaixaLabel = (e.Mensalidade && e.Mensalidade !== '0' && escIdx > 0)
    ? (FAIXA_LABEL[e.Mensalidade] || e.Mensalidade)
    : 'Dado não disponível';

  // ---------- TÍTULO COMPACTO + FILETE ----------
  s.addText('Faixa de Mensalidade', {
    x: SAFE, y: 0.42, w: W, h: 0.7,
    fontSize: 30, bold: true, color: C.navy, fontFace: 'Calibri', valign: 'top',
  });
  s.addShape('rect', { x: SAFE, y: 1.08, w: 0.5, h: 0.05, fill: { color: C.teal }, line: { color: C.teal } });
  s.addText('Posicionamento da escola analisada em relação ao grupo competitivo da área de influência.', {
    x: SAFE, y: 1.18, w: W, h: 0.32,
    fontSize: 11.5, color: C.muted, fontFace: 'Calibri', italic: true, valign: 'top',
  });

  // ---------- LINHA-RESUMO ----------
  s.addText(
    `Faixa da escola: ${escFaixaLabel} · ${concs.length} concorrente(s) exibidos · ${data.mesmaFaixa} na mesma faixa`,
    { x: SAFE, y: 1.55, w: W, h: 0.26, fontSize: 10, color: C.muted, fontFace: 'Calibri', valign: 'top' },
  );

  // ---------- 4 MINI CARDS ----------
  const cardsY = 1.85;
  const cardH = 0.85;
  const gap = 0.2;
  const cw = (W - 3 * gap) / 4;
  pptKpi(s, SAFE + 0 * (cw + gap), cardsY, cw, cardH, 'Faixa da escola', escFaixaLabel, C.teal, 18);
  pptKpi(s, SAFE + 1 * (cw + gap), cardsY, cw, cardH, 'Concorrentes na mesma faixa', String(data.mesmaFaixa), C.teal, 18);
  pptKpi(s, SAFE + 2 * (cw + gap), cardsY, cw, cardH, 'Concorrentes acima da faixa', String(data.acima), C.navy, 18);
  pptKpi(s, SAFE + 3 * (cw + gap), cardsY, cw, cardH, 'Concorrentes abaixo da faixa', String(data.abaixo), C.lime, 18);

  // ---------- BLOCO A · TABELA + BLOCO B · DISTRIBUIÇÃO ----------
  const contentY = cardsY + cardH + 0.2;
  const tableW = W * 0.62;
  const distX = SAFE + tableW + 0.2;
  const distW = W - tableW - 0.2;

  // Tabela
  type Row = { nome: string; faixa: string; faixaIdx: number; isTarget: boolean };
  const allRows: Row[] = [
    { nome: e.Escola, faixa: e.Mensalidade, faixaIdx: escIdx, isTarget: true },
    ...concs.map((c: any) => ({
      nome: c.escola.Escola,
      faixa: c.escola.Mensalidade,
      faixaIdx: getMensalidadeFaixa(c.escola.Mensalidade),
      isTarget: false,
    })),
  ];
  const MAX_ROWS = 11;
  const rowsShown = allRows.slice(0, MAX_ROWS);

  const relOf = (r: Row): { txt: string; muted: boolean; teal?: boolean } => {
    if (r.isTarget) return { txt: 'Em análise', muted: false, teal: true };
    if (r.faixaIdx <= 0) return { txt: 'Dado não disponível', muted: true };
    if (escIdx <= 0) return { txt: '—', muted: true };
    if (r.faixaIdx === escIdx) return { txt: 'Mesma faixa', muted: false };
    if (r.faixaIdx > escIdx) return { txt: 'Acima', muted: false };
    return { txt: 'Abaixo', muted: false };
  };

  const headerRow = ['Escola', 'Faixa', 'Relação'].map(h => ({
    text: h,
    options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 10, fontFace: 'Calibri', valign: 'middle' },
  }));
  const tRows: any[] = [headerRow];
  rowsShown.forEach((r, idx) => {
    const fill = r.isTarget ? C.tealLight : (idx % 2 === 0 ? C.white : C.beige);
    const fLabel = (r.faixa && r.faixa !== '0' && r.faixaIdx > 0) ? (FAIXA_LABEL[r.faixa] || r.faixa) : 'Dado não disponível';
    const isFND = !(r.faixa && r.faixa !== '0' && r.faixaIdx > 0);
    const rel = relOf(r);
    const nameCell: any = r.isTarget
      ? {
          text: [
            { text: r.nome, options: { bold: true, color: C.navy, fontSize: 9.5, fontFace: 'Calibri' } },
            { text: '  ' },
            { text: ' Em análise ', options: { bold: true, fontSize: 7.5, color: C.white, fill: { color: C.teal }, fontFace: 'Calibri' } },
          ],
          options: { fill: { color: fill }, valign: 'middle' },
        }
      : { text: r.nome, options: { fontSize: 9.5, bold: true, color: C.navy, valign: 'middle', fill: { color: fill }, fontFace: 'Calibri' } };
    tRows.push([
      nameCell,
      { text: fLabel, options: { fontSize: 9, color: isFND ? C.muted : C.text, italic: isFND, valign: 'middle', fill: { color: fill }, fontFace: 'Calibri' } },
      { text: rel.txt, options: { fontSize: 9, bold: !rel.muted, italic: rel.muted, color: rel.muted ? C.muted : (rel.teal ? C.teal : C.navy), valign: 'middle', fill: { color: fill }, fontFace: 'Calibri' } },
    ]);
  });
  s.addTable(tRows, {
    x: SAFE, y: contentY, w: tableW,
    colW: [tableW * 0.50, tableW * 0.26, tableW * 0.24],
    rowH: 0.30, fontFace: 'Calibri',
    border: { type: 'solid', color: C.borderLight, pt: 0.4 },
  });

  // Distribuição (lado direito) — quadro compacto com barras
  s.addText('DISTRIBUIÇÃO POR FAIXA', {
    x: distX, y: contentY, w: distW, h: 0.28,
    fontSize: 9, bold: true, color: C.navy, fontFace: 'Calibri', charSpacing: 1,
  });
  const distItems = FAIXAS.map(f => {
    const tot = (e.Mensalidade === f ? 1 : 0) + concs.filter((c: any) => c.escola.Mensalidade === f).length;
    return { label: FAIXA_LABEL[f] || f, total: tot, hasTarget: e.Mensalidade === f };
  }).filter(x => x.total > 0);
  const maxTot = Math.max(...distItems.map(x => x.total), 1);
  const distAreaY = contentY + 0.32;
  const availH = (PPT_H - 1.0) - distAreaY;
  const distRowH = distItems.length > 0 ? Math.min(0.6, Math.max(0.42, availH / distItems.length)) : 0.42;
  distItems.forEach((d2, i) => {
    const rY = distAreaY + i * distRowH;
    s.addText(
      [
        { text: (d2.hasTarget ? '★ ' : '') + d2.label, options: { bold: d2.hasTarget, color: d2.hasTarget ? C.teal : C.navy, fontSize: 9, fontFace: 'Calibri' } },
      ] as any,
      { x: distX, y: rY, w: distW - 0.5, h: 0.2, valign: 'middle' },
    );
    s.addText(String(d2.total), {
      x: distX + distW - 0.45, y: rY, w: 0.45, h: 0.2,
      fontSize: 9, bold: true, color: C.navy, fontFace: 'Calibri', align: 'right', valign: 'middle',
    });
    // Barra
    const barY = rY + 0.22;
    const barH = 0.12;
    s.addShape('rect', { x: distX, y: barY, w: distW, h: barH, fill: { color: C.borderLight }, line: { color: C.borderLight } });
    const fillW = (d2.total / maxTot) * distW;
    if (fillW > 0.02) {
      s.addShape('rect', { x: distX, y: barY, w: fillW, h: barH, fill: { color: d2.hasTarget ? C.teal : C.navy }, line: { color: d2.hasTarget ? C.teal : C.navy } });
    }
  });

  // Nota se houver mais
  if (allRows.length > MAX_ROWS) {
    s.addText(`Exibidos ${MAX_ROWS} de ${allRows.length} no total — listagem priorizada por proximidade.`, {
      x: SAFE, y: PPT_H - 0.78, w: W, h: 0.24,
      fontSize: 9, italic: true, color: C.muted, fontFace: 'Calibri',
    });
  }
}

// ----- 10. Socioeconômico
function pptSocio(s: PptxGenJS.Slide, ctx: ExportContext, data: any, n: number, total: number) {
  pptHeader(s, ctx); pptFooter(s, ctx, n, total);
  pptTitle(s, 'Perfil Socioeconômico e Aderência Econômica', `Leitura demográfica, econômica e de aderência ao ticket da população de ${ctx.analysis.escola.Município}/${ctx.analysis.escola.UF}.`);
  if (!data.d) {
    s.addText('Dado não disponível na base fornecida.', { x: PPT_M, y: 3, w: PPT_W - 2 * PPT_M, h: 0.5, fontSize: 14, italic: true, color: C.muted, align: 'center', fontFace: 'Calibri' });
    return;
  }

  // 3 KPIs principais — destacados
  const cw = (PPT_W - 2 * PPT_M - 0.4) / 3;
  const cardsY = 1.85;
  const cardsH = 1.05;
  pptKpi(s, PPT_M + 0 * (cw + 0.2), cardsY, cw, cardsH, 'Renda Média', fmtBRL(data.rendaMedia), C.teal, 26);
  pptKpi(s, PPT_M + 1 * (cw + 0.2), cardsY, cw, cardsH, 'IDH Renda', String(data.idhRenda), C.navy, 26);
  pptKpi(s, PPT_M + 2 * (cw + 0.2), cardsY, cw, cardsH, 'IDH Educação', String(data.idhEduc), C.lime, 26);

  // Bloco esquerdo — distribuição etária / Bloco direito — heatmap
  const blockY = cardsY + cardsH + 0.3;
  const blockH = PPT_H - blockY - 1.0;
  const leftW = (PPT_W - 2 * PPT_M - 0.3) * 0.42;
  const rightW = (PPT_W - 2 * PPT_M - 0.3) - leftW;
  const rightX = PPT_M + leftW + 0.3;

  // Esquerda: gráfico
  s.addText('DISTRIBUIÇÃO ETÁRIA · MUNICÍPIO (2025)', {
    x: PPT_M, y: blockY, w: leftW, h: 0.28,
    fontSize: 9, bold: true, color: C.navy, fontFace: 'Calibri', charSpacing: 1,
  });
  const faixasEt = ['0 a 4', '5 a 9', '10 a 14', '15 a 19'];
  const valsEt = faixasEt.map(f => parseInt(data.d[`População por Faixa Etária (2025) - ${f} anos`] || '0'));
  const faixasLabels = faixasEt.map(f => `${f} anos`);
  s.addChart(pptxgenChartType('bar'), [{ name: 'População', labels: faixasLabels, values: valsEt }], {
    x: PPT_M, y: blockY + 0.32, w: leftW, h: blockH - 0.4,
    barDir: 'col', chartColors: [C.teal],
    showValue: true, dataLabelFontSize: 9, dataLabelColor: C.navy,
    catAxisLabelFontFace: 'Calibri', catAxisLabelFontSize: 10, valAxisLabelFontSize: 9,
    catGridLine: { style: 'none' }, valGridLine: { style: 'none' },
    showValAxisTitle: false, valAxisHidden: true,
    showLegend: false, showTitle: false,
  });

  // Direita: heatmap
  s.addText('RENDA × FAIXA ETÁRIA · MUNICÍPIO', {
    x: rightX, y: blockY, w: rightW, h: 0.28,
    fontSize: 9, bold: true, color: C.navy, fontFace: 'Calibri', charSpacing: 1,
  });
  if (data.matrix) {
    const aderSet = new Set(data.faixasAderentes);
    const allCells: number[] = [];
    data.matrix.forEach((r: any) => allCells.push(r.ate4, r.de5a14, r.de15a19));
    const maxCell = Math.max(...allCells, 1);
    const headerRow: any[] = [
      { text: 'Classe', options: { bold: true, color: C.muted, fontSize: 8.5, fill: { color: C.beige }, fontFace: 'Calibri' } },
      { text: '0–4', options: { bold: true, color: C.muted, fontSize: 8.5, fill: { color: C.beige }, align: 'right', fontFace: 'Calibri' } },
      { text: '5–14', options: { bold: true, color: C.muted, fontSize: 8.5, fill: { color: C.beige }, align: 'right', fontFace: 'Calibri' } },
      { text: '15–19', options: { bold: true, color: C.muted, fontSize: 8.5, fill: { color: C.beige }, align: 'right', fontFace: 'Calibri' } },
      { text: 'Total', options: { bold: true, color: C.muted, fontSize: 8.5, fill: { color: C.beige }, align: 'right', fontFace: 'Calibri' } },
    ];
    const rows: any[] = [headerRow];
    data.matrix.forEach((r: any) => {
      const isAder = aderSet.has(r.faixa);
      const tot = r.ate4 + r.de5a14 + r.de15a19;
      const cells = [r.ate4, r.de5a14, r.de15a19].map(v => {
        const intensity = v / maxCell;
        const fill = interpolateColor('FFFFFF', '129A96', intensity * 0.7);
        return { text: fmtInt(v), options: { fontSize: 8.5, color: intensity > 0.55 ? C.white : C.navy, align: 'right', fill: { color: fill }, fontFace: 'Calibri' } };
      });
      const rowFill = isAder ? C.tealLight : C.white;
      rows.push([
        { text: (isAder ? '● ' : '') + r.faixa, options: { fontSize: 8.5, bold: isAder, color: isAder ? C.teal : C.navy, fill: { color: rowFill }, fontFace: 'Calibri' } },
        ...cells,
        { text: fmtInt(tot), options: { fontSize: 8.5, bold: true, color: C.navy, align: 'right', fill: { color: rowFill }, fontFace: 'Calibri' } },
      ]);
    });
    const colTotal = rightW;
    const colWArr = [colTotal * 0.20, colTotal * 0.20, colTotal * 0.20, colTotal * 0.20, colTotal * 0.20];
    s.addTable(rows, {
      x: rightX, y: blockY + 0.32, w: rightW,
      colW: colWArr,
      rowH: 0.24, fontFace: 'Calibri',
      border: { type: 'solid', color: C.borderLight, pt: 0.4 },
    });
    s.addText('● Faixas aderentes ao ticket atual da escola.', {
      x: rightX, y: blockY + blockH - 0.32, w: rightW, h: 0.22,
      fontSize: 8.5, italic: true, color: C.muted, fontFace: 'Calibri',
    });
  } else {
    s.addText('Matriz de renda não disponível para este município.', {
      x: rightX, y: blockY + 0.4, w: rightW, h: 0.4, fontSize: 10, italic: true, color: C.muted, fontFace: 'Calibri',
    });
  }

  const aderencia = data.aderencia;
  let leitura: string;
  if (aderencia >= 30) leitura = 'Base sólida com poder de compra alinhado — espaço para reforçar valor agregado e diferenciais pedagógicos.';
  else if (aderencia >= 15) leitura = 'Existe nicho relevante — comunique custo-benefício e proposta de valor.';
  else leitura = 'Base aderente limitada — atenção à elasticidade de preço e necessidade de comunicar retorno do investimento.';
  pptLeitura(s, `${data.aderenteCls.label.toUpperCase()} (${aderencia.toFixed(0)}%) · ${leitura}`, PPT_H - 0.85, 0.45, 'LEITURA');
}

// ----- 11. Potencial
function pptPotencial(s: PptxGenJS.Slide, ctx: ExportContext, data: any, n: number, total: number) {
  pptHeader(s, ctx); pptFooter(s, ctx, n, total);
  pptTitle(s, 'Potencial de Consumo Educacional e Comercial', `Município de ${ctx.analysis.escola.Município}/${ctx.analysis.escola.UF}`);
  if (!data.potencial) {
    // Fallback: painel proxy
    s.addShape('rect', { x: PPT_M, y: 1.7, w: PPT_W - 2 * PPT_M, h: 0.7, fill: { color: C.beige }, line: { color: C.border, width: 0.5 } });
    s.addText('Pyxis Potencial de Consumo não publicado para este município.', { x: PPT_M + 0.2, y: 1.93, w: PPT_W - 2 * PPT_M - 0.4, h: 0.3, fontSize: 12, italic: true, color: C.navy, fontFace: 'Calibri' });
    s.addText('Apresentamos proxies socioeconômicos do município para sustentar a leitura comercial.', { x: PPT_M + 0.2, y: 2.20, w: PPT_W - 2 * PPT_M - 0.4, h: 0.3, fontSize: 10, color: C.muted, fontFace: 'Calibri' });
    if (data.d) {
      const cw0 = (PPT_W - 2 * PPT_M - 0.45) / 4;
      pptKpi(s, PPT_M + 0 * (cw0 + 0.15), 2.80, cw0, 0.85, 'Renda Média', fmtBRL(data.rendaMedia), C.teal);
      pptKpi(s, PPT_M + 1 * (cw0 + 0.15), 2.80, cw0, 0.85, 'IDH Renda', String(data.idhRenda), C.navy);
      pptKpi(s, PPT_M + 2 * (cw0 + 0.15), 2.80, cw0, 0.85, 'IDH Educação', String(data.idhEduc), C.lime);
      pptKpi(s, PPT_M + 3 * (cw0 + 0.15), 2.80, cw0, 0.85, 'Pop. 0–19', fmtInt(data.pop0_19), C.teal);
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
  pptKpi(s, PPT_M + 0 * (cw + 0.15), 1.85, cw, 0.85, 'Matrículas/Mensalidades', fmtBRL(matriculas, true), C.teal);
  pptKpi(s, PPT_M + 1 * (cw + 0.15), 1.85, cw, 0.85, 'Livros e Material Escolar', fmtBRL(livros, true), C.navy);
  pptKpi(s, PPT_M + 2 * (cw + 0.15), 1.85, cw, 0.85, 'Livros Didáticos', fmtBRL(didaticos, true), C.lime);
  pptKpi(s, PPT_M + 3 * (cw + 0.15), 1.85, cw, 0.85, 'Total Educacional', fmtBRL(totEd, true), C.teal);

  const totalRenda = FAIXAS_RENDA.reduce((sum, c) => sum + (p.renda_classe[c] || 0), 0);
  const classData = FAIXAS_RENDA.map(c => {
    const peso = totalRenda > 0 ? (p.renda_classe[c] || 0) / totalRenda : 0;
    return { classe: c, dom: p.domicilios_classe[c] || 0, pot: totEd * peso, pct: peso * 100 };
  });
  const chartData = [{ name: 'Potencial', labels: classData.map(c => c.classe), values: classData.map(c => Math.round(c.pot)) }];
  s.addChart(pptxgenChartType('bar'), chartData, {
    x: PPT_M, y: 3.00, w: 7.8, h: 2.6,
    showTitle: true, title: 'Distribuição do Consumo Educacional por Classe', titleFontFace: 'Calibri', titleFontSize: 11, titleColor: C.navy,
    barDir: 'col', chartColors: [C.teal],
    showValue: false, catAxisLabelFontFace: 'Calibri', catAxisLabelFontSize: 10, valAxisLabelFontSize: 9,
    catGridLine: { style: 'none' }, valGridLine: { style: 'none' },
    showValAxisTitle: false, valAxisHidden: true,
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
  s.addTable(tblRows, { x: 8.55, y: 3.00, w: 4.4, colW: [1.0, 1.9, 1.5], rowH: 0.27, fontFace: 'Calibri', border: { type: 'solid', color: C.borderLight, pt: 0.4 } });

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
  pptTitle(s, 'Insights e Recomendações', 'Síntese estratégica da área de influência e direcionamentos comerciais prioritários.');
  const ms = ctx.analysis.marketShare;
  const segShares = [
    { l: 'Educação Infantil', v: ms.ei },
    { l: 'Fund. AI', v: ms.efi },
    { l: 'Fund. AF', v: ms.efii },
    { l: 'Ensino Médio', v: ms.em },
  ].filter(x => x.v > 0).sort((a, b) => b.v - a.v);
  const bestSeg = segShares[0];
  const weakSeg = segShares[segShares.length - 1];

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

  // ============== FAIXA SUPERIOR — 4 INSIGHTS (grade 4×1) ==============
  s.addText('INSIGHTS', { x: PPT_M, y: 1.65, w: 4, h: 0.25, fontSize: 10, bold: true, color: C.navy, fontFace: 'Calibri', charSpacing: 1 });
  const cw = (PPT_W - 2 * PPT_M - 0.3) / 4;
  const ch = 1.95;
  insights.slice(0, 4).forEach((it, i) => {
    const x = PPT_M + i * (cw + 0.1);
    const y = 1.95;
    s.addShape('roundRect', { x, y, w: cw, h: ch, fill: { color: C.white }, line: { color: C.border, width: 0.5 }, rectRadius: 0.05 } as any);
    s.addShape('rect', { x, y, w: 0.06, h: ch, fill: { color: C.navy }, line: { color: C.navy } });
    pptChip(s, x + 0.18, y + 0.14, it.tag);
    s.addText(it.title, { x: x + 0.18, y: y + 0.55, w: cw - 0.3, h: 0.45, fontSize: 11.5, bold: true, color: C.navy, fontFace: 'Calibri' });
    s.addText([
      { text: it.dado, options: { bold: true, fontSize: 9.5, color: C.teal } },
    ] as any, { x: x + 0.18, y: y + 1.0, w: cw - 0.3, h: 0.4, fontFace: 'Calibri', valign: 'top' });
    s.addText(it.leitura, { x: x + 0.18, y: y + 1.4, w: cw - 0.3, h: ch - 1.45, fontSize: 9, color: C.text, fontFace: 'Calibri', valign: 'top' });
  });

  // ============== FAIXA INFERIOR — 4 RECOMENDAÇÕES ==============
  type Reco = { prio: string; prioColor: string; titulo: string; acao: string; objetivo: string };
  const recos: Reco[] = [
    { prio: data.aderencia < 15 ? 'Alta prioridade' : 'Estratégica', prioColor: data.aderencia < 15 ? C.red : C.teal,
      titulo: 'Reforçar comunicação de valor',
      acao: `Mensagens claras${bestSeg ? ` em ${bestSeg.l}` : ''}: pedagogia, resultados e formação.`,
      objetivo: 'Reduzir sensibilidade a preço e proteger ticket.' },
    { prio: 'Alta prioridade', prioColor: C.teal,
      titulo: bestSeg ? `Captação focada em ${bestSeg.l}` : 'Captação no segmento líder',
      acao: 'Funil dedicado com meta numérica e CPA-alvo por canal.',
      objetivo: 'Ampliar volume e converter share em matrículas.' },
    { prio: 'Estratégica', prioColor: C.navy,
      titulo: 'Rematrícula antecipada',
      acao: `Antecipar campanha${weakSeg ? `, foco em ${weakSeg.l}` : ''}; mapear sinais de evasão.`,
      objetivo: 'Sustentar base e reduzir reposição na captação.' },
    { prio: 'Contínua', prioColor: C.lime,
      titulo: 'Monitoramento competitivo',
      acao: `Trimestralmente: preço, segmentos e comunicação dos ${data.concs.length} concorrentes.`,
      objetivo: 'Antecipar movimentos e proteger posicionamento.' },
  ];
  s.addText('RECOMENDAÇÕES', { x: PPT_M, y: 4.05, w: 4, h: 0.25, fontSize: 10, bold: true, color: C.navy, fontFace: 'Calibri', charSpacing: 1 });
  const rcw = (PPT_W - 2 * PPT_M - 0.3) / 4;
  const rch = 2.55;
  const ry = 4.35;
  recos.forEach((r, i) => {
    const x = PPT_M + i * (rcw + 0.1);
    s.addShape('roundRect', { x, y: ry, w: rcw, h: rch, fill: { color: C.white }, line: { color: C.border, width: 0.5 }, rectRadius: 0.05 } as any);
    s.addShape('rect', { x, y: ry, w: 0.06, h: rch, fill: { color: r.prioColor }, line: { color: r.prioColor } });
    s.addText(r.prio.toUpperCase(), { x: x + 0.18, y: ry + 0.14, w: rcw - 0.3, h: 0.22, fontSize: 8, bold: true, color: C.white, fill: { color: r.prioColor }, align: 'left', fontFace: 'Calibri' });
    s.addText(r.titulo, { x: x + 0.18, y: ry + 0.45, w: rcw - 0.3, h: 0.5, fontSize: 11.5, bold: true, color: C.navy, fontFace: 'Calibri', valign: 'top' });
    s.addText([
      { text: 'Ação: ', options: { bold: true, fontSize: 9.5, color: C.navy } },
      { text: r.acao, options: { fontSize: 9.5, color: C.text } },
    ] as any, { x: x + 0.18, y: ry + 0.95, w: rcw - 0.3, h: 0.85, fontFace: 'Calibri', valign: 'top' });
    s.addText([
      { text: 'Objetivo: ', options: { bold: true, fontSize: 9.5, color: C.muted, italic: true } },
      { text: r.objetivo, options: { fontSize: 9.5, color: C.muted, italic: true } },
    ] as any, { x: x + 0.18, y: ry + rch - 0.7, w: rcw - 0.3, h: 0.65, fontFace: 'Calibri', valign: 'top' });
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
