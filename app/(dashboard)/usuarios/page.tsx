import {createClient} from '@/lib/supabase/server';
import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';
import {Users,UserRoundCheck,ShieldCheck,UserRoundX,Search,Pencil} from 'lucide-react';
import {EmptyRow,InitialAvatar,KpiCard,PageHeader} from '@/components/ModuleUI';
import {UserInviteForm} from '@/components/UserInviteForm';
import { ActionModal } from "@/components/ActionModal";

const roleLabel:Record<string,string>={admin:'Administrador',operador:'Recrutador',cliente:'Gestor',financeiro:'Financeiro'};
type SearchParams={q?:string;perfil?:string;status?:string;salvo?:string;erro?:string};

export default async function Usuarios({searchParams}:{searchParams:Promise<SearchParams>}){
  const params=await searchParams;
  async function alterar(f:FormData){
    'use server';
    const s=await createClient();
    const {error}=await s.rpc('admin_update_user_profile',{
      p_id:String(f.get('id')),p_nome:String(f.get('nome')||''),p_email:String(f.get('email')||''),
      p_cargo:String(f.get('cargo')||''),p_telefone:String(f.get('telefone')||''),
      p_perfil:String(f.get('perfil')),p_ativo:f.get('ativo')==='true',
      p_empresa_ids:f.getAll('empresa_ids').map(String),
    });
    if(error)redirect(`/usuarios?erro=${encodeURIComponent(error.message)}`);
    revalidatePath('/usuarios');redirect('/usuarios?salvo=1');
  }
  const s=await createClient();
  const [{data:rows,error},{data:empresas}]=await Promise.all([
    s.from('usuarios').select('*,usuario_empresas(empresa_id)').order('nome'),
    s.from('empresas').select('id,nome').eq('ativo',true).order('nome'),
  ]);
  const users=rows||[];const query=(params.q||'').trim().toLocaleLowerCase('pt-BR');
  const filtered=users.filter((x:any)=>{
    const text=[x.nome,x.email,x.cargo,x.telefone].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR');
    return(!query||text.includes(query))&&(!params.perfil||x.perfil===params.perfil)&&(!params.status||String(x.ativo)===params.status);
  });
  const active=users.filter((x:any)=>x.ativo).length;const inactive=users.length-active;
  const profiles=new Set(users.map((x:any)=>x.perfil)).size;
  return <section className="module-page">
    <PageHeader title="Usuários" description="Gerencie dados, permissões e vínculos de empresa." action={<UserInviteForm/>}/>
    <div className="module-kpis four"><KpiCard label="Usuários ativos" value={active} note="Com acesso ao sistema" Icon={UserRoundCheck} tone="green"/><KpiCard label="Usuários cadastrados" value={users.length} note="Perfis no Auth" Icon={Users}/><KpiCard label="Perfis de acesso" value={profiles} note="Perfis em uso" Icon={ShieldCheck}/><KpiCard label="Usuários inativos" value={inactive} note="Sem acesso atual" Icon={UserRoundX} tone="red"/></div>
    {params.salvo&&<div className="success-state">Usuário atualizado com sucesso.</div>}
    {params.erro&&<div className="error-state">Não foi possível atualizar: {params.erro}</div>}
    <div className="module-panel">
      <form className="filterbar" method="get"><label className="searchbox"><Search size={15}/><input name="q" defaultValue={params.q} placeholder="Buscar por nome, e-mail, cargo ou telefone..."/></label><select name="perfil" defaultValue={params.perfil||''}><option value="">Todos os perfis</option>{Object.entries(roleLabel).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><select name="status" defaultValue={params.status||''}><option value="">Todos os status</option><option value="true">Ativos</option><option value="false">Inativos</option></select><button className="outline-button">Aplicar filtros</button></form>
      {error&&<div className="error-state">Não foi possível carregar os usuários: {error.message}</div>}
      <div className="table-wrap"><table className="module-table"><thead><tr><th>Usuário</th><th>E-mail</th><th>Cargo</th><th>Perfil</th><th>Status</th><th>Último acesso</th><th>Ações</th></tr></thead><tbody>
        {filtered.map((r:any,i:number)=>{const linked=new Set((r.usuario_empresas||[]).map((x:any)=>x.empresa_id));return <tr key={r.id}><td><div className="entity-cell"><InitialAvatar name={r.nome||r.email||'Usuário'} index={i}/><b>{r.nome||'Sem nome'}</b></div></td><td>{r.email||'—'}</td><td>{r.cargo||'Não informado'}</td><td><span className="role-chip">{roleLabel[r.perfil]||r.perfil}</span></td><td><span className={`status-chip ${r.ativo?'success':'danger'}`}>{r.ativo?'Ativo':'Inativo'}</span></td><td>{r.ultimo_acesso?new Date(r.ultimo_acesso).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}):'—'}</td><td><ActionModal kind="edit" title={r.nome||r.email||"Usuário"}><form action={alterar}>
          <input type="hidden" name="id" value={r.id}/><label>Nome<input name="nome" defaultValue={r.nome||''}/></label><label>E-mail do perfil<input name="email" type="email" defaultValue={r.email||''} required/></label><small>O e-mail usado para login continua protegido no Supabase Auth.</small><label>Cargo<input name="cargo" defaultValue={r.cargo||''}/></label><label>Telefone<input name="telefone" defaultValue={r.telefone||''}/></label><label>Perfil<select name="perfil" defaultValue={r.perfil}>{Object.entries(roleLabel).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label>Status<select name="ativo" defaultValue={String(r.ativo)}><option value="true">Ativo</option><option value="false">Inativo</option></select></label><fieldset><legend>Empresas vinculadas</legend>{(empresas||[]).map((e:any)=><label className="company-check" key={e.id}><input type="checkbox" name="empresa_ids" value={e.id} defaultChecked={linked.has(e.id)}/>{e.nome}</label>)}</fieldset><button className="primary-button">Salvar alterações</button>
        </form></details></td></tr>})}
        {!filtered.length&&<EmptyRow colSpan={7} label="Nenhum usuário encontrado."/>}
      </tbody></table></div><div className="pagination"><span>Mostrando {filtered.length} de {users.length} usuário(s)</span><b>1</b></div>
    </div>
  </section>;
}
