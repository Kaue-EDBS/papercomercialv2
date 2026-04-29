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
// CONCORRÊNCIA — helpers compartilhados PDF/PPT
// ============================================================

function tipoAdocaoOf(esc: any): string {
  const t = String(esc?.['Tipo de Adoção'] || '').trim();
  return t || 'Dado não disponível';
}
function tipoAdocaoIsND(esc: any): boolean {
  return !String(esc?.['Tipo de Adoção'] || '').trim();
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
    { render: (p, n) => renderPdfMarketShareGeral(p, font, bold, italic, ctx, data, n, total) },
    { render: (p, n) => renderPdfMarketShareSegmentos(p, font, bold, italic, ctx, data, n, total) },
    { render: (p, n) => renderPdfMensalidade(p, font, bold, italic, ctx, data, n, total) },
    { render: (p, n) => renderPdfSocioeconomico(p, font, bold, italic, ctx, data, n, total) },
    { render: (p, n) => renderPdfPotencial(p, font, bold, italic, ctx, data, n, total) },
    { render: (p, n) => renderPdfInsights(p, font, bold, italic, ctx, data, n, total) },
    { render: (p, n) => renderPdfPlanoAcao(p, font, bold, italic, ctx, data, n, total) },
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
  // Subtítulo: "Diagnóstico Territorial · [Tipo]"
  const subL = 'Diagnóstico Territorial';
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
    const colorMap: Record<string, { bg: string; fg: string }> = {
      EI:   { bg: C.segEI,   fg: C.white },
      EFI:  { bg: C.segEFI,  fg: C.white },
      EFII: { bg: C.segEFII, fg: C.navy  },
      EM:   { bg: C.segEM,   fg: C.white },
    };
    const c = colorMap[seg] ?? { bg: C.navy, fg: C.white };
    return { text: ` ${seg} `, options: { fontSize: 8, bold: true, color: c.fg, fill: { color: c.bg }, fontFace: 'Calibri' } };
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
    s.addText(tipo, {
      x: cx + 0.18, y: cardsY + cardH - 0.30, w: cw - 0.3, h: 0.22,
      fontSize: 8.5, color: tipoND ? C.muted : C.text, italic: tipoND,
      fontFace: 'Calibri', valign: 'middle', shrinkText: true,
    });
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

  // Nota se houver mais concorrentes além dos exibidos
  const restantesNaoExibidos = Math.max(0, restantes.length - restShown.length);
  if (restantesNaoExibidos > 0) {
    s.addText(`A análise completa considera ${totalConc} concorrentes elegíveis · ${4 + restShown.length} exibidos por legibilidade.`, {
      x: SAFE, y: PPT_H - 1.32, w: W, h: 0.24,
      fontSize: 9, italic: true, color: C.muted, fontFace: 'Calibri',
    });
  }

  // ---------- BLOCO DE APOIO METODOLÓGICO ----------
  pptLeitura(
    s,
    'Concorrentes selecionados com base em proximidade geográfica, segmentos em comum, tipo de adoção, faixa de mensalidade e critérios operacionais definidos na análise.',
    PPT_H - 0.95, 0.42, 'METODOLOGIA',
  );
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
