import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';
import PptxGenJS from 'pptxgenjs';
import { AnalysisResult, PresentationType, ConsultorSession } from './types';

/**
 * Exportação NATIVA da Etapa 3 (sem screenshot).
 * 9 páginas: Abertura · Resumo · Panorama · Concorrência · Market Share ·
 * Mensalidade · Socioeconômico · Insights · Encerramento.
 *
 * - PDF: paisagem A4 (842×595pt), 1 página da apresentação = 1 página do PDF.
 * - PPTX: widescreen 16:9 (13.333" × 7.5"), 1 página = 1 slide.
 */

// Paleta semântica espelhando a UI (HSL aprox em RGB 0-1 para pdf-lib).
const NAVY = rgb(0.078, 0.149, 0.294); // ~#142648
const TEAL = rgb(0.118, 0.604, 0.604); // ~#1E9A9A
const TEAL_LIGHT = rgb(0.871, 0.953, 0.953);
const BEIGE = rgb(0.976, 0.961, 0.929);
const TEXT = rgb(0.13, 0.13, 0.16);
const MUTED = rgb(0.4, 0.4, 0.45);
const BORDER = rgb(0.85, 0.85, 0.88);
const WHITE = rgb(1, 1, 1);

// Versão hex p/ pptxgenjs
const C = {
  navy: '142648',
  teal: '1E9A9A',
  tealLight: 'DEF3F3',
  beige: 'F9F5ED',
  text: '21212A',
  muted: '666674',
  border: 'D9D9E0',
  white: 'FFFFFF',
};

export interface ExportContext {
  analysis: AnalysisResult;
  presentationType: PresentationType;
  session: ConsultorSession | null;
  raioKm: number;
  raioMode: 'padrao' | 'personalizado';
}

// ----- Helpers de dados -----

function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('pt-BR');
}
function fmtPct(n: number, digits = 1): string {
  return `${n.toFixed(digits).replace('.', ',')}%`;
}
function fmtKm(n: number | null): string {
  if (n === null || n === undefined) return '—';
  return `${n.toFixed(1).replace('.', ',')} km`;
}
function tipoLabel(t: PresentationType): string {
  return t === 'prospeccao' ? 'Prospecção' : 'Renovação';
}

function buildPages(ctx: ExportContext) {
  const { analysis, presentationType, raioKm } = ctx;
  const e = analysis.escola;
  const ms = analysis.marketShare;
  const concs = analysis.concorrentes.slice(0, 15);
  const totalAlunado = parseInt(e['Alunado Total'] || '0', 10) || 0;

  const segmentos = [
    parseInt(e.qt_mat_educacao_infantil || '0', 10) > 0 && 'Educação Infantil',
    parseInt(e.qt_mat_ensino_fundamental_anos_iniciais || '0', 10) > 0 && 'Fund. Anos Iniciais',
    parseInt(e.qt_mat_ensino_fundamental_anos_finais || '0', 10) > 0 && 'Fund. Anos Finais',
    parseInt(e.qt_mat_ensino_medio || '0', 10) > 0 && 'Ensino Médio',
  ].filter(Boolean) as string[];

  return [
    {
      key: 'abertura',
      title: tipoLabel(presentationType),
      subtitle: 'Análise Estratégica · Editora do Brasil',
      kind: 'cover' as const,
      lines: [e.Escola, `${e.Município} · ${e.UF}`, `Código Inep ${e['Código Inep']}`],
    },
    {
      key: 'resumo',
      title: 'Resumo Executivo',
      kind: 'kpis' as const,
      kpis: [
        { label: 'Alunado Total', value: fmtInt(totalAlunado) },
        { label: 'Mensalidade', value: e.Mensalidade || '—' },
        { label: 'Perfil Socioec.', value: e['Perfil Socioeconômico'] || '—' },
        { label: 'Tipo de Adoção', value: e['Tipo de Adoção'] || '—' },
        { label: 'Concorrentes', value: String(concs.length) },
        { label: 'Raio operacional', value: fmtKm(raioKm) },
      ],
      paragraph: `${e.Escola} atende ${segmentos.length} segmento(s): ${segmentos.join(', ') || '—'}. Localizada em ${e.Município}/${e.UF}, opera em um raio de ${fmtKm(raioKm)} com ${concs.length} concorrente(s) elegíveis.`,
    },
    {
      key: 'panorama',
      title: 'Panorama da Escola',
      kind: 'list' as const,
      items: [
        ['Endereço', `${e.Endereço || ''} ${e.Número || ''} · ${e.Bairro || ''}`.trim()],
        ['CEP', e.CEP || '—'],
        ['Município', `${e.Município} / ${e.UF}`],
        ['Educação Infantil', fmtInt(parseInt(e.qt_mat_educacao_infantil || '0', 10))],
        ['Fund. Anos Iniciais', fmtInt(parseInt(e.qt_mat_ensino_fundamental_anos_iniciais || '0', 10))],
        ['Fund. Anos Finais', fmtInt(parseInt(e.qt_mat_ensino_fundamental_anos_finais || '0', 10))],
        ['Ensino Médio', fmtInt(parseInt(e.qt_mat_ensino_medio || '0', 10))],
        ['Alunado Total', fmtInt(totalAlunado)],
      ],
    },
    {
      key: 'concorrencia',
      title: 'Concorrência',
      subtitle: `Raio ${fmtKm(raioKm)} · ${ctx.raioMode === 'personalizado' ? 'Personalizado' : 'Padrão'} · ${concs.length} concorrentes`,
      kind: 'table' as const,
      headers: ['Escola', 'Matrículas', 'Distância', 'Segmentos'],
      rows: concs.map((c) => {
        const total = parseInt(c.escola['Alunado Total'] || '0', 10) || 0;
        const dist = c.distancia !== null ? fmtKm(c.distancia) : (c.proximidadeCEP ? 'Estimado por CEP' : 'Sem coordenadas');
        return [
          truncate(c.escola.Escola, 50),
          fmtInt(total),
          dist,
          c.segmentosComum.join(', ') || '—',
        ];
      }),
    },
    {
      key: 'marketshare',
      title: 'Market Share',
      subtitle: `Participação em ${e.Município}/${e.UF}`,
      kind: 'kpis' as const,
      kpis: [
        { label: 'Geral', value: fmtPct(ms.geral) },
        { label: 'Educação Infantil', value: fmtPct(ms.ei) },
        { label: 'Fund. Iniciais', value: fmtPct(ms.efi) },
        { label: 'Fund. Finais', value: fmtPct(ms.efii) },
        { label: 'Ensino Médio', value: fmtPct(ms.em) },
        { label: 'Escolas no município', value: fmtInt(analysis.escolasMunicipio.length) },
      ],
    },
    {
      key: 'mensalidade',
      title: 'Mensalidade · Posicionamento Competitivo',
      kind: 'list' as const,
      items: [
        ['Faixa da escola', e.Mensalidade || '—'],
        ['Concorrentes na mesma faixa', String(concs.filter((c) => c.escola.Mensalidade === e.Mensalidade).length)],
        ['Concorrentes acima', String(concs.filter((c) => faixaIdx(c.escola.Mensalidade) > faixaIdx(e.Mensalidade)).length)],
        ['Concorrentes abaixo', String(concs.filter((c) => faixaIdx(c.escola.Mensalidade) < faixaIdx(e.Mensalidade) && faixaIdx(c.escola.Mensalidade) >= 0).length)],
      ],
    },
    {
      key: 'socioeconomico',
      title: 'Socioeconômico',
      kind: 'list' as const,
      items: socioItems(analysis),
    },
    {
      key: 'insights',
      title: 'Insights & Recomendações',
      kind: 'bullets' as const,
      bullets: buildInsights(analysis, presentationType),
    },
    {
      key: 'encerramento',
      title: 'Obrigado pelo seu tempo',
      subtitle: 'Conte com a Editora do Brasil para crescer junto.',
      footer: 'Transformando o país pela educação.',
      kind: 'closing' as const,
    },
  ];
}

const FAIXAS = ['0', 'até 399', '400 a 799', '800 a 1.399', '1.400 a 2.399', 'acima de R$ 2.400'];
function faixaIdx(m: string): number {
  return FAIXAS.indexOf(m);
}

function socioItems(a: AnalysisResult): [string, string][] {
  const d = a.demografica;
  if (!d) return [['Sem dados demográficos', '—']];
  return [
    ['População', d['População'] || '—'],
    ['Renda Média', d['Renda Média'] || '—'],
    ['IDH', d['IDH - Índice de Desenv. Humano'] || '—'],
    ['PIB per capita', d['PIB per Capita Total'] || '—'],
    ['Densidade demográfica', d['Densidade Demográfica'] || '—'],
    ['IDH Educação', d['IDH - Dimensão Educação Classificação'] || '—'],
  ];
}

function buildInsights(a: AnalysisResult, t: PresentationType): string[] {
  const out: string[] = [];
  const concs = a.concorrentes;
  const sameFaixa = concs.filter((c) => c.escola.Mensalidade === a.escola.Mensalidade).length;
  out.push(`Mercado com ${concs.length} concorrentes elegíveis no raio de ${fmtKm(a.raioOperacional)}.`);
  if (sameFaixa > 0) out.push(`${sameFaixa} concorrente(s) atuam na mesma faixa de mensalidade — disputa direta.`);
  if (a.marketShare.geral > 0) out.push(`Market share atual de ${fmtPct(a.marketShare.geral)} no município.`);
  if (t === 'prospeccao') {
    out.push('Foco recomendado: diferenciação pedagógica e materiais que reforcem identidade da escola.');
  } else {
    out.push('Foco recomendado: renovação fortalecida com novos serviços, plataformas e formação de professores.');
  }
  out.push('A Editora do Brasil oferece soluções alinhadas a cada segmento atendido pela escola.');
  return out;
}

function truncate(s: string, max: number): string {
  if (!s) return '';
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

// ============================================================
// PDF (pdf-lib)
// ============================================================

export async function exportPDF(ctx: ExportContext): Promise<Blob> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontIt = await pdf.embedFont(StandardFonts.HelveticaOblique);

  const pages = buildPages(ctx);
  // A4 landscape pt
  const W = 842, H = 595;

  for (const p of pages) {
    const page = pdf.addPage([W, H]);
    drawHeader(page, font, fontBold, ctx);
    drawFooter(page, font, ctx, pages.indexOf(p) + 1, pages.length);

    if (p.kind === 'cover') {
      drawCover(page, font, fontBold, fontIt, p);
    } else if (p.kind === 'closing') {
      drawClosing(page, font, fontBold, fontIt, p);
    } else {
      drawTitle(page, fontBold, font, p.title, (p as any).subtitle);
      if (p.kind === 'kpis') drawKpis(page, font, fontBold, p.kpis, (p as any).paragraph);
      else if (p.kind === 'list') drawList(page, font, fontBold, p.items);
      else if (p.kind === 'table') drawTable(page, font, fontBold, p.headers, p.rows);
      else if (p.kind === 'bullets') drawBullets(page, font, fontBold, p.bullets);
    }
  }

  const bytes = await pdf.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

function drawHeader(page: PDFPage, font: PDFFont, fontBold: PDFFont, ctx: ExportContext) {
  const { width } = page.getSize();
  page.drawRectangle({ x: 0, y: page.getHeight() - 28, width, height: 28, color: BEIGE });
  page.drawText('Editora do Brasil · Análise Estratégica', {
    x: 24, y: page.getHeight() - 18, size: 9, font: fontBold, color: NAVY,
  });
  const right = `${ctx.session?.nome ?? '—'} · ${ctx.analysis.escola.Município}/${ctx.analysis.escola.UF}`;
  const w = font.widthOfTextAtSize(right, 9);
  page.drawText(right, { x: page.getWidth() - 24 - w, y: page.getHeight() - 18, size: 9, font, color: MUTED });
}

function drawFooter(page: PDFPage, font: PDFFont, ctx: ExportContext, n: number, total: number) {
  page.drawLine({ start: { x: 24, y: 30 }, end: { x: page.getWidth() - 24, y: 30 }, thickness: 0.5, color: BORDER });
  page.drawText(`Raio ${fmtKm(ctx.raioKm)} · ${ctx.raioMode === 'personalizado' ? 'Personalizado' : 'Padrão'}`, {
    x: 24, y: 16, size: 8, font, color: MUTED,
  });
  const pg = `${n} / ${total}`;
  const w = font.widthOfTextAtSize(pg, 8);
  page.drawText(pg, { x: page.getWidth() - 24 - w, y: 16, size: 8, font, color: MUTED });
}

function drawTitle(page: PDFPage, bold: PDFFont, font: PDFFont, title: string, subtitle?: string) {
  page.drawText(title, { x: 36, y: page.getHeight() - 70, size: 22, font: bold, color: NAVY });
  page.drawRectangle({ x: 36, y: page.getHeight() - 80, width: 40, height: 3, color: TEAL });
  if (subtitle) {
    page.drawText(subtitle, { x: 36, y: page.getHeight() - 100, size: 11, font, color: MUTED });
  }
}

function drawCover(page: PDFPage, font: PDFFont, bold: PDFFont, italic: PDFFont, p: any) {
  const W = page.getWidth(), H = page.getHeight();
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: NAVY });
  // Reescreve cabeçalho em tom claro
  page.drawRectangle({ x: 0, y: H - 28, width: W, height: 28, color: NAVY });

  page.drawText('EDITORA DO BRASIL', { x: 48, y: H - 110, size: 12, font: bold, color: TEAL });
  page.drawRectangle({ x: 48, y: H - 130, width: 60, height: 3, color: TEAL });

  page.drawText(p.title, { x: 48, y: H - 200, size: 42, font: bold, color: WHITE });
  page.drawText(p.subtitle, { x: 48, y: H - 230, size: 14, font: italic, color: TEAL_LIGHT });

  let y = H - 320;
  for (const line of p.lines) {
    page.drawText(line, { x: 48, y, size: 14, font, color: WHITE });
    y -= 22;
  }
}

function drawClosing(page: PDFPage, font: PDFFont, bold: PDFFont, italic: PDFFont, p: any) {
  const W = page.getWidth(), H = page.getHeight();
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: BEIGE });
  const tw = bold.widthOfTextAtSize(p.title, 32);
  page.drawText(p.title, { x: (W - tw) / 2, y: H / 2 + 40, size: 32, font: bold, color: NAVY });
  page.drawRectangle({ x: W / 2 - 20, y: H / 2 + 25, width: 40, height: 3, color: TEAL });
  const sw = italic.widthOfTextAtSize(p.subtitle, 16);
  page.drawText(p.subtitle, { x: (W - sw) / 2, y: H / 2 - 10, size: 16, font: italic, color: TEAL });
  const fw = bold.widthOfTextAtSize(p.footer, 14);
  page.drawText(p.footer, { x: (W - fw) / 2, y: H / 2 - 50, size: 14, font: bold, color: NAVY });
}

function drawKpis(page: PDFPage, font: PDFFont, bold: PDFFont, kpis: { label: string; value: string }[], paragraph?: string) {
  const startX = 36, startY = page.getHeight() - 140;
  const cardW = 245, cardH = 80, gapX = 15, gapY = 15;
  kpis.forEach((k, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = startX + col * (cardW + gapX);
    const y = startY - row * (cardH + gapY) - cardH;
    page.drawRectangle({ x, y, width: cardW, height: cardH, color: WHITE, borderColor: BORDER, borderWidth: 0.5 });
    page.drawRectangle({ x, y: y + cardH - 3, width: cardW, height: 3, color: TEAL });
    page.drawText(k.label, { x: x + 14, y: y + cardH - 22, size: 9, font, color: MUTED });
    page.drawText(truncate(k.value, 28), { x: x + 14, y: y + 18, size: 18, font: bold, color: NAVY });
  });
  if (paragraph) {
    const wrapped = wrapText(paragraph, font, 10, page.getWidth() - 72);
    let py = 130;
    for (const ln of wrapped.slice(0, 4)) {
      page.drawText(ln, { x: 36, y: py, size: 10, font, color: TEXT });
      py -= 14;
    }
  }
}

function drawList(page: PDFPage, font: PDFFont, bold: PDFFont, items: [string, string][]) {
  let y = page.getHeight() - 140;
  for (const [label, value] of items) {
    page.drawRectangle({ x: 36, y: y - 6, width: page.getWidth() - 72, height: 1, color: BORDER });
    page.drawText(label, { x: 48, y: y + 4, size: 11, font, color: MUTED });
    const v = truncate(value, 60);
    const w = bold.widthOfTextAtSize(v, 12);
    page.drawText(v, { x: page.getWidth() - 48 - w, y: y + 3, size: 12, font: bold, color: NAVY });
    y -= 32;
    if (y < 60) break;
  }
}

function drawTable(page: PDFPage, font: PDFFont, bold: PDFFont, headers: string[], rows: string[][]) {
  const x0 = 36, y0 = page.getHeight() - 140;
  const W = page.getWidth() - 72;
  const colW = [W * 0.42, W * 0.16, W * 0.20, W * 0.22];
  // header
  page.drawRectangle({ x: x0, y: y0 - 22, width: W, height: 22, color: NAVY });
  let cx = x0;
  headers.forEach((h, i) => {
    page.drawText(h, { x: cx + 8, y: y0 - 16, size: 10, font: bold, color: WHITE });
    cx += colW[i];
  });
  // rows
  let y = y0 - 22;
  rows.forEach((r, idx) => {
    const rh = 20;
    if (y - rh < 50) return;
    if (idx % 2 === 0) {
      page.drawRectangle({ x: x0, y: y - rh, width: W, height: rh, color: BEIGE });
    }
    cx = x0;
    r.forEach((cell, i) => {
      const max = Math.floor(colW[i] / 5.2);
      page.drawText(truncate(cell, max), { x: cx + 8, y: y - 14, size: 9, font, color: TEXT });
      cx += colW[i];
    });
    y -= rh;
  });
  page.drawRectangle({ x: x0, y, width: W, height: y0 - 22 - y, borderColor: BORDER, borderWidth: 0.5, color: undefined as any, opacity: 0 });
}

function drawBullets(page: PDFPage, font: PDFFont, bold: PDFFont, items: string[]) {
  let y = page.getHeight() - 150;
  for (const it of items) {
    page.drawCircle({ x: 46, y: y + 5, size: 3, color: TEAL });
    const wrapped = wrapText(it, font, 11, page.getWidth() - 100);
    for (const ln of wrapped) {
      page.drawText(ln, { x: 60, y, size: 11, font, color: TEXT });
      y -= 16;
    }
    y -= 8;
    if (y < 60) break;
  }
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const out: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth) {
      if (line) out.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) out.push(line);
  return out;
}

// ============================================================
// PPTX (pptxgenjs)
// ============================================================

export async function exportPPTX(ctx: ExportContext): Promise<Blob> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.333" x 7.5"
  pptx.title = `Editora do Brasil - ${ctx.analysis.escola.Escola}`;
  pptx.company = 'Editora do Brasil';

  const pages = buildPages(ctx);

  pages.forEach((p, idx) => {
    const slide = pptx.addSlide();
    if (p.kind === 'cover') {
      slide.background = { color: C.navy };
      slide.addText('EDITORA DO BRASIL', { x: 0.6, y: 0.7, w: 6, h: 0.4, fontSize: 14, bold: true, color: C.teal, fontFace: 'Calibri' });
      slide.addShape('rect', { x: 0.6, y: 1.15, w: 0.8, h: 0.05, fill: { color: C.teal }, line: { color: C.teal } });
      slide.addText(p.title, { x: 0.6, y: 1.6, w: 12, h: 1.2, fontSize: 48, bold: true, color: C.white, fontFace: 'Calibri' });
      slide.addText(p.subtitle ?? '', { x: 0.6, y: 2.9, w: 12, h: 0.5, fontSize: 18, italic: true, color: C.tealLight, fontFace: 'Calibri' });
      let y = 4.0;
      for (const ln of (p as any).lines as string[]) {
        slide.addText(ln, { x: 0.6, y, w: 12, h: 0.4, fontSize: 16, color: C.white, fontFace: 'Calibri' });
        y += 0.45;
      }
      return;
    }
    if (p.kind === 'closing') {
      slide.background = { color: C.beige };
      slide.addText(p.title, { x: 0, y: 2.8, w: 13.333, h: 0.9, fontSize: 36, bold: true, color: C.navy, align: 'center', fontFace: 'Calibri' });
      slide.addShape('rect', { x: 6.4, y: 3.85, w: 0.6, h: 0.05, fill: { color: C.teal }, line: { color: C.teal } });
      slide.addText(p.subtitle ?? '', { x: 0, y: 4.1, w: 13.333, h: 0.6, fontSize: 18, italic: true, color: C.teal, align: 'center', fontFace: 'Calibri' });
      slide.addText((p as any).footer ?? '', { x: 0, y: 5.0, w: 13.333, h: 0.5, fontSize: 16, bold: true, color: C.navy, align: 'center', fontFace: 'Calibri' });
      return;
    }

    addSlideHeader(slide, ctx, idx + 1, pages.length);
    slide.addText(p.title, { x: 0.5, y: 0.7, w: 12.3, h: 0.6, fontSize: 28, bold: true, color: C.navy, fontFace: 'Calibri' });
    slide.addShape('rect', { x: 0.5, y: 1.3, w: 0.6, h: 0.05, fill: { color: C.teal }, line: { color: C.teal } });
    if ((p as any).subtitle) {
      slide.addText((p as any).subtitle, { x: 0.5, y: 1.4, w: 12.3, h: 0.4, fontSize: 14, color: C.muted, fontFace: 'Calibri' });
    }

    if (p.kind === 'kpis') {
      const cardW = 3.9, cardH = 1.3, gapX = 0.2, gapY = 0.2;
      p.kpis.forEach((k, i) => {
        const col = i % 3, row = Math.floor(i / 3);
        const x = 0.5 + col * (cardW + gapX);
        const y = 2.0 + row * (cardH + gapY);
        slide.addShape('rect', { x, y, w: cardW, h: cardH, fill: { color: C.white }, line: { color: C.border, width: 0.5 } });
        slide.addShape('rect', { x, y, w: cardW, h: 0.08, fill: { color: C.teal }, line: { color: C.teal } });
        slide.addText(k.label, { x: x + 0.2, y: y + 0.15, w: cardW - 0.4, h: 0.3, fontSize: 11, color: C.muted, fontFace: 'Calibri' });
        slide.addText(truncate(k.value, 28), { x: x + 0.2, y: y + 0.55, w: cardW - 0.4, h: 0.6, fontSize: 22, bold: true, color: C.navy, fontFace: 'Calibri' });
      });
      if ((p as any).paragraph) {
        slide.addText((p as any).paragraph, { x: 0.5, y: 5.6, w: 12.3, h: 1.2, fontSize: 12, color: C.text, fontFace: 'Calibri' });
      }
    } else if (p.kind === 'list') {
      let y = 2.0;
      for (const [label, value] of p.items) {
        slide.addText(label, { x: 0.6, y, w: 6, h: 0.35, fontSize: 13, color: C.muted, fontFace: 'Calibri' });
        slide.addText(truncate(value, 60), { x: 6.6, y, w: 6.2, h: 0.35, fontSize: 14, bold: true, color: C.navy, align: 'right', fontFace: 'Calibri' });
        slide.addShape('line', { x: 0.6, y: y + 0.4, w: 12.2, h: 0, line: { color: C.border, width: 0.5 } });
        y += 0.5;
        if (y > 6.8) break;
      }
    } else if (p.kind === 'table') {
      const headerRow = p.headers.map((h) => ({
        text: h,
        options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 11, fontFace: 'Calibri' },
      }));
      const bodyRows = p.rows.map((r, idx2) =>
        r.map((cell) => ({
          text: cell,
          options: { fontSize: 10, color: C.text, fill: { color: idx2 % 2 === 0 ? C.beige : C.white }, fontFace: 'Calibri' },
        }))
      );
      slide.addTable([headerRow as any, ...bodyRows as any], {
        x: 0.5, y: 2.0, w: 12.3,
        colW: [5.2, 1.8, 2.5, 2.8],
        border: { type: 'solid', color: C.border, pt: 0.5 },
        rowH: 0.32,
      });
    } else if (p.kind === 'bullets') {
      slide.addText(
        p.bullets.map((b) => ({ text: b, options: { bullet: { code: '25CF' }, color: C.text, fontSize: 14, fontFace: 'Calibri', paraSpaceAfter: 8 } })),
        { x: 0.7, y: 2.0, w: 12, h: 5 }
      );
    }

    addSlideFooter(slide, ctx, idx + 1, pages.length);
  });

  const data = await pptx.write({ outputType: 'blob' });
  return data as Blob;
}

function addSlideHeader(slide: PptxGenJS.Slide, ctx: ExportContext, n: number, total: number) {
  slide.addShape('rect', { x: 0, y: 0, w: 13.333, h: 0.4, fill: { color: C.beige }, line: { color: C.beige } });
  slide.addText('Editora do Brasil · Análise Estratégica', { x: 0.3, y: 0.05, w: 6, h: 0.3, fontSize: 10, bold: true, color: C.navy, fontFace: 'Calibri' });
  const right = `${ctx.session?.nome ?? '—'} · ${ctx.analysis.escola.Município}/${ctx.analysis.escola.UF}`;
  slide.addText(right, { x: 7, y: 0.05, w: 6.05, h: 0.3, fontSize: 10, color: C.muted, align: 'right', fontFace: 'Calibri' });
}

function addSlideFooter(slide: PptxGenJS.Slide, ctx: ExportContext, n: number, total: number) {
  slide.addShape('line', { x: 0.5, y: 7.1, w: 12.3, h: 0, line: { color: C.border, width: 0.5 } });
  slide.addText(`Raio ${fmtKm(ctx.raioKm)} · ${ctx.raioMode === 'personalizado' ? 'Personalizado' : 'Padrão'}`, {
    x: 0.5, y: 7.15, w: 6, h: 0.25, fontSize: 9, color: C.muted, fontFace: 'Calibri',
  });
  slide.addText(`${n} / ${total}`, { x: 7, y: 7.15, w: 5.8, h: 0.25, fontSize: 9, color: C.muted, align: 'right', fontFace: 'Calibri' });
}

// ============================================================
// Trigger download
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