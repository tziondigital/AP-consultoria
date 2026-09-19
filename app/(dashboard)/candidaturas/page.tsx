import {createClient} from '@/lib/supabase/server';
import {revalidatePath} from 'next/cache';
import {EditModal,DeleteButton} from '@/components/RecordActions';
import {label,badgeClass} from '@/lib/format';

const statuses=['novo','triagem','entrevista','aprovado','reprovado','desistiu','contratado'];
const groups=[
  {title:'Recebidos / Triagem',values:['novo','triagem']},
  {title:'Em entrevista',values:['entrevista']},
  {title:'Finalistas / Contratados',values:['aprovado','contratado']},
  {title:'Encerrados',values:['reprovado','desistiu']}
];

export default async function Page(){
  async function vincular(f:FormData){'use server';const s=await createClient();await s.from('candidaturas').insert({candidato_id:String(f.get('candidato_id')),vaga_id:String(f.get('vaga_id')),origem:String(f.get('origem')||'')||null});revalidatePath('/candidaturas')}
  async function editar(f:FormData){'use server';const s=await createClient();await s.from('candidaturas').update({status:String(f.get('status')),origem:String(f.get('origem')||'')||null,parecer:String(f.get('parecer')||'')||null,resultado:String(f.get('resultado')||'')||null}).eq('id',String(f.get('id')));revalidatePath('/candidaturas')}
  async function excluir(f:FormData){'use server';const s=await createClient();await s.from('candidaturas').delete().eq('id',String(f.get('id')));revalidatePath('/candidaturas')}
  const s=await createClient();
  const[{data:rows},{data:candidatos},{data:vagas}]=await Promise.all([
    s.from('candidaturas').select('*,candidatos(nome),vagas(cargo,empresas(nome))').order('inscrito_em',{ascending:false}),
    s.from('candidatos').select('id,nome').order('nome'),
    s.from('vagas').select('id,cargo,empresas(nome)').in('status',['rascunho','em_andamento']).order('cargo')
  ]);
  const data=rows||[];
  return <section>
    <div className="page-heading"><div><h1 className="page-title">Processos Seletivos</h1><p className="muted">Acompanhe o funil completo e alimente cada candidatura em uma única tela.</p></div></div>

    <div className="process-summary">
      <div className="card process-stat"><strong>{data.length}</strong><span>Total de processos</span></div>
      <div className="card process-stat"><strong>{data.filter((x:any)=>['novo','triagem'].includes(x.status)).length}</strong><span>Em triagem</span></div>
      <div className="card process-stat"><strong>{data.filter((x:any)=>x.status==='entrevista').length}</strong><span>Em entrevista</span></div>
      <div className="card process-stat"><strong>{data.filter((x:any)=>x.status==='contratado').length}</strong><span>Contratados</span></div>
    </div>

    <details className="card form-card vacancy-details"><summary>+ Adicionar candidato ao processo</summary>
      <form action={vincular} className="quick-form">
        <div className="field-group"><label>Candidato</label><select name="candidato_id" required defaultValue=""><option value="" disabled>Selecione</option>{(candidatos||[]).map((x:any)=><option key={x.id} value={x.id}>{x.nome}</option>)}</select></div>
        <div className="field-group"><label>Vaga</label><select name="vaga_id" required defaultValue=""><option value="" disabled>Selecione</option>{(vagas||[]).map((x:any)=><option key={x.id} value={x.id}>{x.cargo} — {x.empresas?.nome||''}</option>)}</select></div>
        <div className="field-group"><label>Origem</label><input name="origem" placeholder="LinkedIn, indicação..."/></div>
        <button className="button">Vincular</button>
      </form>
    </details>

    <div className="process-board">
      {groups.map(g=>{const list=data.filter((x:any)=>g.values.includes(x.status));return <div className="process-column" key={g.title}>
        <div className="process-column-head"><b>{g.title}</b><span>{list.length}</span></div>
        {list.map((r:any)=><div className="process-item" key={r.id}>
          <b>{r.candidatos?.nome||'—'}</b><small>{r.vagas?.cargo||'—'} · {r.vagas?.empresas?.nome||'—'}</small>
          <div className="process-item-foot"><span className={'badge '+badgeClass(r.status)}>{label(r.status)}</span>
            <div className="actions-cell">
              <EditModal title={'Alimentar processo — '+(r.candidatos?.nome||'Candidato')} action={editar}>
                <input type="hidden" name="id" value={r.id}/>
                <div className="field-group"><label>Status</label><select name="status" defaultValue={r.status}>{statuses.map(x=><option value={x} key={x}>{label(x)}</option>)}</select></div>
                <div className="field-group"><label>Origem</label><input name="origem" defaultValue={r.origem||''}/></div>
                <div className="field-group wide"><label>Parecer</label><textarea name="parecer" defaultValue={r.parecer||''}/></div>
                <div className="field-group wide"><label>Resultado / observação final</label><textarea name="resultado" defaultValue={r.resultado||''}/></div>
              </EditModal>
              <DeleteButton id={r.id} action={excluir} label="processo"/>
            </div>
          </div>
        </div>)}
        {!list.length&&<div className="empty">Nenhum processo nesta etapa.</div>}
      </div>})}
    </div>

    <div className="card table-card"><div className="table-head"><h2 className="section-title" style={{margin:0}}>Todos os processos</h2><span className="muted">{data.length} registro(s)</span></div>
      <div className="table-wrap"><table><thead><tr><th>Candidato</th><th>Vaga</th><th>Empresa</th><th>Origem</th><th>Status</th><th>Ações</th></tr></thead>
      <tbody>{data.map((r:any)=><tr key={r.id}><td><b>{r.candidatos?.nome||'—'}</b></td><td>{r.vagas?.cargo||'—'}</td><td>{r.vagas?.empresas?.nome||'—'}</td><td>{r.origem||'—'}</td><td><span className={'badge '+badgeClass(r.status)}>{label(r.status)}</span></td><td><div className="actions-cell"><EditModal title={'Editar processo — '+(r.candidatos?.nome||'Candidato')} action={editar}><input type="hidden" name="id" value={r.id}/><div className="field-group"><label>Status</label><select name="status" defaultValue={r.status}>{statuses.map(x=><option value={x} key={x}>{label(x)}</option>)}</select></div><div className="field-group"><label>Origem</label><input name="origem" defaultValue={r.origem||''}/></div><div className="field-group wide"><label>Parecer</label><textarea name="parecer" defaultValue={r.parecer||''}/></div><div className="field-group wide"><label>Resultado</label><textarea name="resultado" defaultValue={r.resultado||''}/></div></EditModal><DeleteButton id={r.id} action={excluir} label="processo"/></div></td></tr>)}</tbody></table></div>
    </div>
  </section>
}
