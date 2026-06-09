#!/usr/bin/env node
/**
 * (#3) Validação de schema dos JSONs antes do deploy.
 * Falha com exit != 0 quando algo está fora do esperado.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'public/data');
const errors = [];
const warnings = [];

function fail(msg) { errors.push(msg); }
function warn(msg) { warnings.push(msg); }

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { fail(`Falha ao ler ${p}: ${e.message}`); return null; }
}

const indexPath = path.join(ROOT, 'censo_inep_index.json');
const index = readJson(indexPath);
if (index) {
  const total = Object.keys(index).length;
  if (total < 10000) fail(`censo_inep_index.json com apenas ${total} entradas`);
  const ufs = new Set(Object.values(index));
  if (ufs.size < 20) fail(`Índice contém apenas ${ufs.size} UFs distintas`);
  console.log(`✓ censo_inep_index.json: ${total} escolas, ${ufs.size} UFs`);
}

const chunkDir = path.join(ROOT, 'censo_by_uf');
if (!fs.existsSync(chunkDir)) fail('Diretório censo_by_uf/ ausente');
else {
  const files = fs.readdirSync(chunkDir).filter(f => f.endsWith('.json'));
  if (files.length < 20) fail(`censo_by_uf/ só tem ${files.length} arquivos (esperado 27)`);
  let totalEscolas = 0;
  for (const f of files) {
    const data = readJson(path.join(chunkDir, f));
    if (!Array.isArray(data)) { fail(`${f} não é array`); continue; }
    totalEscolas += data.length;
    const sample = data[0];
    if (sample) {
      for (const k of ['Código Inep', 'UF', 'Município', 'Escola']) {
        if (!(k in sample)) fail(`${f}: campo "${k}" ausente`);
      }
    }
  }
  console.log(`✓ censo_by_uf/: ${files.length} chunks, ${totalEscolas} escolas`);
}

const setor = readJson(path.join(ROOT, 'setorizacao_2026.json'));
if (setor) {
  if (!Array.isArray(setor)) fail('setorizacao_2026.json não é array');
  else {
    if (setor.length < 1000) warn(`Setorização com apenas ${setor.length} linhas`);
    const sample = setor[0] || {};
    for (const k of ['CONSULTOR', 'COD_PROTHEUS']) if (!(k in sample)) fail(`setorizacao_2026.json: campo "${k}" ausente`);
    console.log(`✓ setorizacao_2026.json: ${setor.length} linhas`);
  }
}

const carteirasDir = path.join(ROOT, 'carteiras');
const manifest = readJson(path.join(carteirasDir, 'manifest.json'));
if (manifest && Array.isArray(manifest)) {
  let missing = 0;
  for (const c of manifest) {
    const p = path.join(carteirasDir, c.arquivo);
    if (!fs.existsSync(p)) { fail(`Carteira ausente: ${c.arquivo}`); missing++; }
  }
  console.log(`✓ carteiras/: ${manifest.length} consultores, ${missing} ausentes`);
}

const demo = readJson(path.join(ROOT, 'base_demografica.json'));
if (demo) {
  if (!Array.isArray(demo)) fail('base_demografica.json não é array');
  else {
    const sample = demo[0] || {};
    for (const k of ['Código IBGE', 'Municípios', 'Estado']) {
      if (!(k in sample)) fail(`base_demografica.json: campo "${k}" ausente`);
    }
    console.log(`✓ base_demografica.json: ${demo.length} municípios`);
  }
}

if (warnings.length) {
  console.warn('\n⚠️  Avisos:');
  warnings.forEach(w => console.warn('  · ' + w));
}
if (errors.length) {
  console.error('\n❌ Erros de validação:');
  errors.forEach(e => console.error('  · ' + e));
  process.exit(1);
}
console.log('\n✅ Todos os JSONs estão consistentes.');