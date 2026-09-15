import type { Json } from '@/integrations/supabase/types';
export type InputRow = Record<string, Json>;
export function parseSource(filename: string, source: string): InputRow[] {
 const text = source.replace(/^\uFEFF/, '');
 if (/\.json$/i.test(filename)) {
   const rows: unknown = JSON.parse(text);
   if (!Array.isArray(rows) || rows.some(row => !row || typeof row !== 'object' || Array.isArray(row))) throw new Error('Use um array JSON de objetos.');
   if (!rows.length || rows.length > 100000) throw new Error('Limite: 1 a 100.000 linhas.');
   return rows as InputRow[];
 }
 if (!/\.(csv|tsv)$/i.test(filename)) throw new Error('Use CSV/TSV UTF-8 ou JSON. XLSX deve ser convertido antes.');
 let quoted = false; const counts: Record<string, number> = { ',': 0, ';': 0, '\t': 0 };
 for (const char of text) { if (char === '"') quoted = !quoted; else if (!quoted) { if ('\r\n'.includes(char)) break; if (char in counts) counts[char]++; } }
 const delimiter = counts['\t'] > counts[','] && counts['\t'] > counts[';'] ? '\t' : counts[';'] > counts[','] ? ';' : ',';
 const rows: InputRow[] = []; let headers: string[] | undefined; let fields: string[] = []; let cell = ''; let closed = false;
 quoted = false; const data = text + '\n';
 for (let i = 0; i < data.length; i++) {
  const ch = data[i];
  if (quoted) { if (ch === '"') { if (data[i+1] === '"') { cell += '"'; i++; } else { quoted = false; closed = true; } } else cell += ch; }
  else if (ch === '"') { if (cell || closed) throw new Error('Aspas CSV invalidas.'); quoted = true; }
  else if (ch === delimiter || ch === '\r' || ch === '\n') {
   fields.push(cell); cell = ''; closed = false;
   if (ch !== delimiter) {
    if (ch === '\r' && data[i+1] === '\n') i++;
    if (!(fields.length === 1 && fields[0] === '')) {
     if (!headers) { headers = fields.map(s => s.trim()); if (headers.some(h => !h) || new Set(headers).size !== headers.length) throw new Error('Cabecalho duplicado ou vazio.'); }
     else { if (headers.length !== fields.length) throw new Error('Quantidade de colunas inconsistente.'); const row = Object.fromEntries(headers.map((h,j) => [h, fields[j]])); rows.push(row); }
    }
    fields = [];
   }
  } else { if (closed) throw new Error('Caractere invalido apos aspas.'); cell += ch; }
 }
 if (quoted) throw new Error('Aspas nao fechadas.');
 if (!rows.length || rows.length > 100000) throw new Error('Limite: 1 a 100.000 linhas.');
 return rows;
}
export async function prepareFile(file: File) {
 if (file.size < 1 || file.size > 8 * 1024 * 1024) throw new Error('Arquivo deve ter entre 1 byte e 8 MiB.');
 const bytes = new Uint8Array(await file.arrayBuffer());
 const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
 const rows = parseSource(file.name, text);
 const hash = await crypto.subtle.digest('SHA-256', bytes);
 let binary = ''; for (let i=0; i<bytes.length; i+=8192) binary += String.fromCharCode(...bytes.subarray(i,i+8192));
 return { rows, source_base64: btoa(binary), source_sha256: Array.from(new Uint8Array(hash), b=>b.toString(16).padStart(2,'0')).join('') };
}
