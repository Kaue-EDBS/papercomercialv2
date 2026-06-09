#!/usr/bin/env node
/**
 * (#1) Quebra o censo escolar (26MB) em chunks por UF e gera o índice INEP→UF.
 * Rode este script sempre que `public/data/censo_escolar.json` for atualizado:
 *   node scripts/split-censo.js
 *
 * Saídas:
 *   public/data/censo_inep_index.json  — { [inep]: "UF" }  (~675KB)
 *   public/data/censo_by_uf/{UF}.json  — array de escolas daquela UF
 */
const fs = require('fs');
const path = require('path');

const SRC = 'public/data/censo_escolar.json';
const OUT_DIR = 'public/data/censo_by_uf';
const OUT_INDEX = 'public/data/censo_inep_index.json';

if (!fs.existsSync(SRC)) {
  console.error(`Arquivo não encontrado: ${SRC}`);
  process.exit(1);
}

const censo = JSON.parse(fs.readFileSync(SRC, 'utf8'));
console.log(`Lendo ${censo.length} escolas de ${SRC}`);

const byUf = {};
const inepIndex = {};
for (const e of censo) {
  const uf = String(e.UF || 'XX').toUpperCase();
  (byUf[uf] ||= []).push(e);
  const inep = String(e['Código Inep'] || '').trim();
  if (inep) inepIndex[inep] = uf;
}

fs.mkdirSync(OUT_DIR, { recursive: true });
for (const [uf, arr] of Object.entries(byUf)) {
  const out = path.join(OUT_DIR, `${uf}.json`);
  fs.writeFileSync(out, JSON.stringify(arr));
  const kb = (fs.statSync(out).size / 1024).toFixed(0);
  console.log(`  ${uf}: ${arr.length} escolas (${kb} KB)`);
}
fs.writeFileSync(OUT_INDEX, JSON.stringify(inepIndex));
const idxKb = (fs.statSync(OUT_INDEX).size / 1024).toFixed(0);
console.log(`Index INEP→UF: ${Object.keys(inepIndex).length} entradas (${idxKb} KB)`);