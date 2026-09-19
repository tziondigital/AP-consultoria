'use client';
import {useState} from 'react';
import {FileText,RefreshCw,Trash2} from 'lucide-react';
import {createClient} from '@/lib/supabase/client';

export function FinanceAttachmentActions({id,path,kind}:{id:string;path?:string|null;kind:'nota'|'comprovante'}){
 const [busy,setBusy]=useState(false);
 const s=createClient();
 const field=kind==='nota'?'nota_fiscal_path':'comprovante_path';
 async function open(){if(!path)return;const{data,error}=await s.storage.from('financeiro').createSignedUrl(path,300);if(error){alert(error.message);return}window.open(data.signedUrl,'_blank','noopener,noreferrer')}
 async function replace(file?:File){
  if(!file)return;setBusy(true);
  const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_'),target=`${id}/${kind}-${Date.now()}-${safe}`;
  const upload=await s.storage.from('financeiro').upload(target,file,{contentType:file.type||'application/octet-stream'});
  if(upload.error){setBusy(false);alert(upload.error.message);return}
  const update=await s.from('financeiro').update({[field]:target}).eq('id',id);
  if(update.error){await s.storage.from('financeiro').remove([target]);setBusy(false);alert(update.error.message);return}
  if(path)await s.storage.from('financeiro').remove([path]);
  location.reload();
 }
 async function remove(){
  if(!path||!confirm('Remover este anexo?'))return;setBusy(true);
  const update=await s.from('financeiro').update({[field]:null}).eq('id',id);
  if(update.error){setBusy(false);alert(update.error.message);return}
  const removal=await s.storage.from('financeiro').remove([path]);
  setBusy(false);
  if(removal.error){alert('O vínculo foi removido, mas o arquivo antigo não pôde ser apagado do armazenamento: '+removal.error.message)}
  location.reload();
 }
 return <span className="resume-actions">{path&&<button type="button" onClick={open} title="Visualizar anexo"><FileText size={14}/></button>}<label title={path?'Substituir anexo':'Enviar anexo'}><RefreshCw size={14}/><input type="file" accept=".pdf,.png,.jpg,.jpeg" disabled={busy} onChange={e=>replace(e.target.files?.[0])}/></label>{path&&<button type="button" onClick={remove} disabled={busy} title="Remover anexo"><Trash2 size={14}/></button>}</span>
}