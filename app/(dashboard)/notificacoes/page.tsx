import {createClient} from '@/lib/supabase/server';
import {revalidatePath} from 'next/cache';
import {Bell,CheckCheck} from 'lucide-react';
import {PageHeader} from '@/components/ModuleUI';

export default async function Notificacoes(){
  async function marcarLida(f:FormData){'use server';const s=await createClient();const {error}=await s.from('notificacoes').update({lida:true}).eq('id',String(f.get('id')));if(error)throw new Error(error.message);revalidatePath('/notificacoes')}
  async function marcarTodas(){'use server';const s=await createClient();const{data:{user}}=await s.auth.getUser();if(user){const {error}=await s.from('notificacoes').update({lida:true}).eq('usuario_id',user.id).eq('lida',false);if(error)throw new Error(error.message)}revalidatePath('/notificacoes')}
  const s=await createClient();const{data:{user}}=await s.auth.getUser();
  const{data:rows,error}=await s.from('notificacoes').select('*').eq('usuario_id',user!.id).order('created_at',{ascending:false}).limit(100);
  const unread=(rows||[]).filter((x:any)=>!x.lida).length;
  return <section className="module-page notifications-page"><PageHeader title="Notificações" description="Acompanhe eventos importantes da operação." action={unread?<form action={marcarTodas}><button className="outline-button"><CheckCheck size={15}/> Marcar todas como lidas</button></form>:undefined}/>
    {error&&<div className="error-state">Não foi possível carregar as notificações: {error.message}</div>}
    <div className="module-panel notification-list">{(rows||[]).map((r:any)=><article key={r.id} className={r.lida?'read':''}><span><Bell size={17}/></span><div><b>{r.titulo}</b><p>{r.mensagem}</p><small>{new Date(r.created_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}</small></div>{!r.lida&&<form action={marcarLida}><input type="hidden" name="id" value={r.id}/><button className="text-button">Marcar como lida</button></form>}</article>)}{!rows?.length&&<div className="module-empty">Nenhuma notificação por enquanto.</div>}</div>
  </section>
}
