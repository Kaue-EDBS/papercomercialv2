import { useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { prepareFile } from './parser';

type Batch = { batch_id:string; dataset:string; filename:string; status:string; version:number; expected_rows:number };
type Candidate = {cod_municipal:string;municipio:string;cod_uf:string;score?:number};
type Row = {row_index:number; raw:Json; normalized:Json; status:string; resolution:{reason?:string;candidates?:Candidate[];cod_uf?:string}};
type Detail = Batch & {rows:Row[]; pending:number; received_rows:number; next_offset:number|null};
async function rpc<T>(action:string,payload:Record<string,Json>={}):Promise<T> {
 const {data,error}=await supabase.rpc('cit_ingest',{action,payload});
 if(error) throw new Error(error.message); return data as T;
}
const field = 'rounded border bg-background px-3 py-2 text-sm';
export default function IngestionConsole() {
 const [session,setSession]=useState<Session|null>(null),[role,setRole]=useState<string|null>(null),[ready,setReady]=useState(false);
 const identity=useRef<string|null>(null);
 const [error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [batches,setBatches]=useState<Batch[]>([]),[detail,setDetail]=useState<Detail|null>(null),[offset,setOffset]=useState(0);
 const [dataset,setDataset]=useState(''),[source,setSource]=useState(''),[file,setFile]=useState<File|null>(null),[requireCep,setRequireCep]=useState(false);
 const [review,setReview]=useState<Row|null>(null),[candidates,setCandidates]=useState<Candidate[]>([]),[query,setQuery]=useState(''),[selected,setSelected]=useState(''),[cep,setCep]=useState(''),[reason,setReason]=useState(''),[memorize,setMemorize]=useState(false),[changeUf,setChangeUf]=useState(false);
 useEffect(()=>{
  let live=true;
  function update(s:Session|null){if(!live)return;identity.current=s?.user.id||null;setSession(s);setRole(null);setReady(false);setBatches([]);setDetail(null);setReview(null);setCandidates([]);setError('');}
  void supabase.auth.getSession().then(({data})=>update(data.session));
  const {data}=supabase.auth.onAuthStateChange((_event,s)=>update(s));
  return()=>{live=false;data.subscription.unsubscribe();};
 },[]);
 useEffect(()=>{let live=true;if(!session){setReady(true);return;} rpc<{role:string|null}>('session').then(x=>{if(live)setRole(x.role);}).catch(e=>{if(live)setError(String(e));}).finally(()=>{if(live)setReady(true);});return()=>{live=false;};},[session]);
 useEffect(()=>{let live=true;if(role==='admin')void rpc<Batch[]>('list').then(x=>{if(live)setBatches(x);}).catch(e=>{if(live)setError(String(e));});return()=>{live=false;};},[role,session]);
 async function run(fn:()=>Promise<void>){if(busy)return;setBusy(true);setError('');const who=identity.current;try{await fn();}catch(e){if(who===identity.current)setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}}
 async function load(id:string,start=0){const who=identity.current;const next=await rpc<Detail>('inspect',{batch_id:id,offset:start});if(who!==identity.current)return;setDetail(next);setOffset(start);}
 async function list(){const who=identity.current;const data=await rpc<Batch[]>('list');if(who===identity.current)setBatches(data);}
 async function refresh(){await list();if(detail)await load(detail.batch_id,offset);}
 async function upload(){if(!file)throw new Error('Selecione um arquivo.');if(!/^[a-z][a-z0-9_]{1,63}$/.test(dataset)||!source.trim())throw new Error('Informe dataset e fonte validos.');const who=identity.current;const input=await prepareFile(file);const {batch_id}=await rpc<{batch_id:string}>('start',{dataset,source_system:source.trim(),filename:file.name,source_base64:input.source_base64,source_sha256:input.source_sha256,expected_rows:input.rows.length,require_cep5:requireCep});for(let i=0;i<input.rows.length;i+=500){if(who!==identity.current)throw new Error('Sessao alterada; reenvie o arquivo para retomar.');await rpc('append',{batch_id,offset:i,rows:input.rows.slice(i,i+500)});}await load(batch_id);await list();}
 function openReview(row:Row){setReview(row);setCandidates(row.resolution.candidates||[]);setQuery('');setSelected('');setCep('');setReason('');setMemorize(false);setChangeUf(false);}
 async function download(){if(!detail)return;const who=identity.current;const rows:Json[]=[];let n=0;while(true){const part=await rpc<Detail>('inspect',{batch_id:detail.batch_id,offset:n});if(who!==identity.current)throw new Error('Sessao alterada.');rows.push(...part.rows.map(r=>r.normalized));if(part.next_offset===null)break;n=part.next_offset;}const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(rows,null,2)],{type:'application/json'}));a.download=`${detail.dataset}-validado.json`;a.click();URL.revokeObjectURL(a.href);}
 // Login happens in AuthGate (Microsoft only); the console never authenticates by itself.
 if(!session)return <p>Sessao encerrada. Entre novamente pela conta Microsoft.</p>;
 return <section className="space-y-5" aria-label="Console de ingestao">
 <h2 className="text-xl font-semibold">Console de ingestao geografica</h2>
 {error&&<p role="alert" className="rounded border border-destructive p-3">{error}</p>}
 {!ready?<p>Verificando permissao...</p>:role!=='admin'?<p>A ingestao e exclusiva do perfil tecnico (admin).</p>:<>
 <p className="text-sm">Perfil: <strong>{role}</strong>. O gate valida e preserva o lote; nao altera as dimensoes nem publica tabelas tematicas.</p>
 <form className="flex flex-wrap gap-3" onSubmit={e=>{e.preventDefault();void run(upload);}}>
 <input className={field} required aria-label="Dataset" placeholder="dataset_exemplo" value={dataset} onChange={e=>setDataset(e.target.value)}/><input className={field} required aria-label="Fonte" placeholder="Fonte do arquivo" value={source} onChange={e=>setSource(e.target.value)}/><input type="file" accept=".csv,.tsv,.json" aria-label="Arquivo UTF-8" onChange={e=>setFile(e.target.files?.[0]||null)}/><label><input type="checkbox" checked={requireCep} onChange={e=>setRequireCep(e.target.checked)}/> Exigir CEP5 em todas as linhas</label><button className={field} disabled={busy}>Enviar e validar</button>
 </form>
 <p className="text-sm text-muted-foreground">CSV/TSV UTF-8 ou array JSON; ate 8 MiB e 100.000 linhas. Reenvio do mesmo arquivo retoma os blocos com idempotencia.</p>
 <button className={field} disabled={busy} onClick={()=>void run(refresh)}>Atualizar</button>
 <div className="space-y-2">{batches.map(b=><button className={field+' block w-full text-left'} key={b.batch_id} disabled={busy} onClick={()=>void run(()=>load(b.batch_id))}>{b.dataset} / {b.filename} / {b.status}</button>)}</div>
 {detail&&<article className="space-y-3"><h3 className="font-semibold">{detail.filename}: {detail.status}</h3><p>{detail.received_rows}/{detail.expected_rows} linhas; {detail.pending} pendencias.</p><div className="overflow-auto"><table className="w-full text-left text-sm"><thead><tr><th>Linha</th><th>Status</th><th>Motivo</th><th>Acao</th></tr></thead><tbody>{detail.rows.map(row=><tr className="border-t" key={row.row_index}><td className="p-2">{row.row_index}</td><td>{row.status}</td><td>{row.resolution.reason||'Relacionamento valido'}</td><td>{row.status==='AGUARDANDO_REVISAO'&&<button className={field} disabled={busy} onClick={()=>openReview(row)}>Revisar</button>}</td></tr>)}</tbody></table></div>
 <div className="flex gap-2"><button className={field} disabled={busy||offset===0} onClick={()=>void run(()=>load(detail.batch_id,Math.max(0,offset-100)))}>Anterior</button><button className={field} disabled={busy||detail.next_offset===null} onClick={()=>void run(()=>load(detail.batch_id,detail.next_offset!))}>Proxima pagina</button>{detail.status==='READY'&&<button className={field} disabled={busy} onClick={()=>void run(async()=>{await rpc('finalize',{batch_id:detail.batch_id});await refresh();})}>Selar lote validado</button>}{detail.status==='VALIDATED'&&<button className={field} disabled={busy} onClick={()=>void run(download)}>Exportar JSON validado</button>}</div>
 </article>}
 </>}
 <Dialog open={!!review&&!!role} onOpenChange={open=>{if(!open&&!busy)setReview(null);}}><DialogContent className="max-h-[90vh] overflow-auto"><DialogHeader><DialogTitle>Revisao manual da linha {review?.row_index}</DialogTitle><DialogDescription>O dado original permanece inalterado. A decisao sera auditada.</DialogDescription></DialogHeader><pre className="overflow-auto text-xs">{JSON.stringify(review?.raw,null,2)}</pre><form onSubmit={e=>{e.preventDefault();void run(async()=>{const who=identity.current;const found=await rpc<Candidate[]>('lookup',{query,cod_uf:changeUf?'':review?.resolution.cod_uf||''});if(who===identity.current)setCandidates(found);});}}><input className={field} aria-label="Buscar municipio" value={query} onChange={e=>setQuery(e.target.value)}/><button className={field} disabled={busy}>Buscar</button></form><fieldset><legend>Municipio canonico</legend>{candidates.map(c=><label className="block" key={c.cod_municipal}><input type="radio" name="municipio" checked={selected===c.cod_municipal} onChange={()=>setSelected(c.cod_municipal)}/> {c.municipio} / UF {c.cod_uf} / {c.cod_municipal}{typeof c.score==='number'?` / similaridade ${Math.round(c.score*100)}%`:''}</label>)}</fieldset><label>CEP5 canonico quando aplicavel<input className={field+' block'} maxLength={5} value={cep} onChange={e=>setCep(e.target.value)}/></label><label>Justificativa<textarea className={field+' block w-full'} value={reason} onChange={e=>setReason(e.target.value)}/></label><label><input type="checkbox" checked={changeUf} onChange={e=>setChangeUf(e.target.checked)}/> Confirmo eventual correcao de UF</label><label><input type="checkbox" checked={memorize} onChange={e=>setMemorize(e.target.checked)}/> Memorizar alias municipal somente para esta fonte</label><button className={field} disabled={busy||!selected||reason.trim().length<8} onClick={()=>void run(async()=>{if(!review||!detail)return;await rpc('review',{batch_id:detail.batch_id,row_index:review.row_index,version:detail.version,cod_municipal:selected,cep5:cep,reason:reason.trim(),memorize,confirm_uf_change:changeUf});setReview(null);await refresh();})}>Confirmar correcao</button></DialogContent></Dialog>
 </section>;
}
