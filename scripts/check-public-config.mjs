import fs from 'node:fs';
const allowed = new Set(['VITE_SUPABASE_URL','VITE_SUPABASE_PROJECT_ID','VITE_SUPABASE_PUBLISHABLE_KEY']);
const values = {};
function validate(config) {
 const url = new URL(config.VITE_SUPABASE_URL);
 const key = config.VITE_SUPABASE_PUBLISHABLE_KEY || '';
 if (url.protocol !== 'https:' || url.hostname !== `${config.VITE_SUPABASE_PROJECT_ID}.supabase.co`) throw new Error('Project and URL mismatch');
 if (key.startsWith('sb_secret_')) throw new Error('Privileged key detected');
 if (!key.startsWith('sb_publishable_')) {
  const claims = JSON.parse(Buffer.from(key.split('.')[1] || '', 'base64url').toString('utf8'));
  if (claims.role !== 'anon' || claims.ref !== config.VITE_SUPABASE_PROJECT_ID) throw new Error('Nonpublic or mismatched JWT');
 }
}
const files = ['.env', ...fs.readdirSync('.').filter(n => n.startsWith('.env.') && n !== '.env.example').sort()];
for (const file of files) {
 const current = {};
 for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
  if (!line.trim() || line.trim().startsWith('#')) continue;
  const match = line.match(/^([A-Z0-9_]+)=["']?(.*?)["']?$/);
  if (!match || !allowed.has(match[1]) || Object.hasOwn(current, match[1])) throw new Error('Unexpected or duplicate key in browser configuration');
  current[match[1]] = match[2];
 }
 if (file === '.env') Object.assign(values,current);
 validate({...values,...current});
}
for (const [key,value] of Object.entries(process.env)) {
 if (!key.startsWith('VITE_')) continue;
 if (!allowed.has(key)) throw new Error('Unexpected browser environment key');
 values[key]=value;
}
validate(values);
console.log('PASS: browser configuration contains only public settings; no values logged.');
