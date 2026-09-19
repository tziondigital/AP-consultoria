import {createClient} from '@/lib/supabase/server';
import {revalidatePath} from 'next/cache';
import {EditModal,DeleteButton} from '@/components/RecordActions';
import {label} from '@/lib/format';

const comps=['Comunicação','Organização','Proatividade','Trabalho em equipe','Conhecimento técnico','Liderança'];

export default async function Page(){
  async function salvar(f:FormData){'use server';const s=await createClient();const{data:{user}}=await s.auth.getUser();const decisao=String(f.get('decisao')||'pendente');await s.from('avaliacoes').insert({candidatura_id:String(f.get('candidatura_id')),operador_id:user?.id||null,nota_tecnica:Number(f.get('nota_tecnica')),competencias:f.getAll('competencias').map(String),parecer:String(f.get('parecer')||'')||null,decisao});if(decisao!=='pendente')await s.from('candidaturas').update({status:decisao==='aprovar'?'aprovado':'reprovado'}).eq('id',String(f.get('candidatura_id')));revalidatePath('/avaliacoes')}
  async function editar(f:FormData){'use server';const s=await createClient();const decisao=String(f.get('decisao')||'pendente');await s.from('avaliacoes').update({nota_tecnica:Number(f.get('nota_tecnica')),competencias:f.getAll('competencias').map(String),parecer:String(f.get('parecer')||'')||null,decisao}).eq('id',String(f.get('id')));if(decisao!=='pendente')await s.from('candidaturas').update({status:decisao==='aprovar'?'aprovado':'reprovado'}).eq('id',String(f.get('candidatura_id')));revalidatePath('/avaliacoes')}
  async function excluir(f:FormData){'use server';const s=await createClient();await s.from('avaliacoes').delete().eq('id',String(f.get('id')));revalidatePath('/avaliacoes')}
  const s=await createClient();
  const[{data:candidaturas},{data:rows}]=await Promise.all([
    s.from('candidaturas').select('id,status,candidatos(nome),vagas(cargo,empresas(nome))').not('status','in','("contratado","desistiu")'),
    s.from('avaliacoes').select('*,candidaturas(candidatos(nome),vagas(cargo)),usuarios(nome)').order('created_at',{ascending:false})
  ]);
  return <section><h1 className="page-title">Avaliação de Candidatos</h1><p className="muted">Registre critérios técnicos, competências e parecer por processo.</p>
    <details className="card form-card vacancy-details"><summary>+ Nova avaliação</summary><form action={salvar} className="evaluation-form">
      <div className="field-group"><label>Candidato / vaga</label><select name="candidatura_id" required defaultValue=""><option value="" disabled>Selecione</option>{(candidaturas||[]).map((x:any)=><option key={x.id} value={x.id}>{x.candidatos?.nome} — {x.vagas?.cargo}</option>)}</select></div>
      <div className="field-group"><label>Nota técnica</label><select name="nota_tecnica" required defaultValue="5">{[5,4,3,2,1].map(n=><option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}</select></div>
      <div className="competencias"><b>Competências</b><div className="check-grid">{comps.map(x=><label key={x}><input type="checkbox" name="competencias" value={x}/> {x}</label>)}</div></div>
      <div className="field-group full"><label>Parecer final</label><textarea name="parecer" rows={4}/></div>
      <div className="decision-row"><button className="button" name="decisao" value="aprovar">Aprovar</button><button className="danger-button" name="decisao" value="reprovar">Reprovar</button><button className="small-button" name="decisao" value="pendente">Salvar parecer</button></div>
    </form></details>
    <div className="card table-card"><div className="table-head"><h2 className="section-title" style={{margin:0}}>Histórico</h2><span className="muted">{rows?.length||0} avaliação(ões)</span></div><div className="table-wrap"><table><thead><tr><th>Candidato</th><th>Vaga</th><th>Nota</th><th>Operador</th><th>Decisão</th><th>Ações</th></tr></thead><tbody>{(rows||[]).map((r:any)=><tr key={r.id}><td>{r.candidaturas?.candidatos?.nome||'—'}</td><td>{r.candidaturas?.vagas?.cargo||'—'}</td><td>{'★'.repeat(r.nota_tecnica)}</td><td>{r.usuarios?.nome||'—'}</td><td><span className={'badge '+(r.decisao==='aprovar'?'green':r.decisao==='reprovar'?'red':'blue')}>{r.decisao==='aprovar'?'Aprovado':r.decisao==='reprovar'?'Reprovado':label(r.decisao)}</span></td><td><div className="actions-cell">
      <EditModal title={'Editar avaliação — '+(r.candidaturas?.candidatos?.nome||'Candidato')} action={editar}>
        <input type="hidden" name="id" value={r.id}/><input type="hidden" name="candidatura_id" value={r.candidatura_id}/>
        <div className="field-group"><label>Nota técnica</label><select name="nota_tecnica" defaultValue={String(r.nota_tecnica)}>{[5,4,3,2,1].map(n=><option value={n} key={n}>{'★'.repeat(n)} ({n})</option>)}</select></div>
        <div className="field-group"><label>Decisão</label><select name="decisao" defaultValue={r.decisao||'pendente'}><option value="pendente">Pendente</option><option value="aprovar">Aprovar</option><option value="reprovar">Reprovar</option></select></div>
        <div className="competencias wide"><b>Competências</b><div className="check-grid">{comps.map(x=><label key={x}><input type="checkbox" name="competencias" value={x} defaultChecked={(r.competencias||[]).includes(x)}/> {x}</label>)}</div></div>
        <div className="field-group wide"><label>Parecer final</label><textarea name="parecer" defaultValue={r.parecer||''}/></div>
      </EditModal>
      <DeleteButton id={r.id} action={excluir} label="avaliação"/>
    </div></td></tr>)}</tbody></table>{!rows?.length&&<div className="empty">Nenhuma avaliação cadastrada.</div>}</div></div>
  </section>
}
