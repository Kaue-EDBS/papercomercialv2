// Preview broker retained; tokens are posted only to validated editor origins.
export function brokeredPreviewStorage() {
 if (typeof window === 'undefined') return undefined;
 const host=location.hostname;
 const zones=['lovableproject.com','lovableproject-dev.com','lovable.app','gpt-eng.com','gptengineer.run'];
 const onPreview=zones.some(z=>host===z||host.endsWith('.'+z));
 const UUID='[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
 const projectId=onPreview?(host.match(new RegExp('^(?:id-preview(?:-[a-z0-9]+)?|project)--('+UUID+')(?:-dev)?(?=\\.|$)','i'))?.[1]??host.match(new RegExp('^('+UUID+')(?=[.-])','i'))?.[1]):undefined;
 if (!projectId || window.parent===window) return localStorage;
 const dev=host.endsWith('.lovableproject-dev.com')||host.endsWith('.gpt-eng.com');
 const editor=dev?/^https:\/\/([a-z0-9-]+\.)*(lovable\.dev|gptengineer\.app)$|^http:\/\/localhost:3000$/:/^https:\/\/([a-z0-9-]+\.)*(lovable\.dev|gptengineer\.app)$/;
 let ancestor='';
 try {ancestor=(location.ancestorOrigins&&location.ancestorOrigins[0])||(document.referrer?new URL(document.referrer).origin:'');} catch {ancestor='';}
 const origins=ancestor&&editor.test(ancestor)?[ancestor]:(dev?['https://lovable.dev','http://localhost:3000']:['https://lovable.dev']);
 const request=(type:string,key:string,value?:string):Promise<{ok:boolean;value?:string|null}|null>=>new Promise(resolve=>{
  const requestId=crypto.randomUUID();let done=false;
  const finish=(result:{ok:boolean;value?:string|null}|null)=>{if(done)return;done=true;clearTimeout(timer);window.removeEventListener('message',onMessage);resolve(result);};
  const onMessage=(e:MessageEvent)=>{if(e.source!==window.parent||!origins.includes(e.origin))return;const d=e.data;if(d&&d.type==='lovable-preview-auth:result'&&d.requestId===requestId)finish(d);};
  const timer=setTimeout(()=>finish(null),2000);
  window.addEventListener('message',onMessage);
  const msg:Record<string,unknown>={type,requestId,projectId,key};if(value!==undefined)msg.value=value;
  for(const origin of origins)window.parent.postMessage(msg,origin);
 });
 let firstGet=true;
 return {
  getItem:async(key:string)=>{
   let result=await request('lovable-preview-auth:get',key);
   if(!result&&firstGet){await new Promise(r=>setTimeout(r,250));result=await request('lovable-preview-auth:get',key);}
   firstGet=false;
   if(result&&result.ok&&typeof result.value==='string'){if(result.value===''){localStorage.removeItem(key);return null;}return result.value;}
   return localStorage.getItem(key);
  },
  setItem:(key:string,value:string)=>{localStorage.setItem(key,value);return request('lovable-preview-auth:set',key,value).then(()=>undefined);},
  removeItem:(key:string)=>{localStorage.removeItem(key);return request('lovable-preview-auth:remove',key).then(()=>undefined);}
 };
}
