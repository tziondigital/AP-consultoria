import { revalidatePath } from "next/cache";
import {
  CalendarDays,
  CheckCircle2,
  FileText,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { ActionModal } from "@/components/ActionModal";
import {ConfirmSubmitButton} from "@/components/ConfirmSubmitButton";
import { createClient } from "@/lib/supabase/server";
import {
  EmptyRow,
  InitialAvatar,
  KpiCard,
  PageHeader,
} from "@/components/ModuleUI";
import { ResumeActions } from "@/components/ResumeActions";
type Params={q?:string;situacao?:string;pagina?:string};
export default async function Page({searchParams}:{searchParams:Promise<Params>}) {
  const params=await searchParams;
  async function criar(f: FormData) {
    "use server";
    const s = await createClient();
    await s
      .from("candidatos")
      .insert({
        nome: String(f.get("nome")),
        email: String(f.get("email") || "") || null,
        telefone: String(f.get("telefone") || "") || null,
        cidade: String(f.get("cidade") || "") || null,
        estado: String(f.get("estado") || "") || null,
        cargo: String(f.get("cargo") || "") || null,
        situacao: String(f.get("situacao") || "disponivel"),
      });
    revalidatePath("/candidatos");
  }
async function editar(f: FormData) {"use server"; const s=await createClient(); await s.from("candidatos").update({nome:String(f.get("nome")),email:String(f.get("email")||"")||null,telefone:String(f.get("telefone")||"")||null,cargo:String(f.get("cargo")||"")||null,cidade:String(f.get("cidade")||"")||null,estado:String(f.get("estado")||"")||null,linkedin_url:String(f.get("linkedin_url")||"")||null,observacoes:String(f.get("observacoes")||"")||null,situacao:String(f.get("situacao")||"disponivel")}).eq("id",String(f.get("id"))); revalidatePath("/candidatos");}
  async function excluir(f: FormData) {"use server"; const s=await createClient(); await s.from("candidatos").delete().eq("id",String(f.get("id"))); revalidatePath("/candidatos");}
  const s = await createClient();
  const [{ data: rows }, { data: apps }, { data: interviews }] =
    await Promise.all([
      s
        .from("candidatos")
        .select("*")
        .order("created_at", { ascending: false }),
      s.from("candidaturas").select("id,candidato_id,status,origem,inscrito_em,vagas(cargo,empresas(nome)),avaliacoes(nota_tecnica,parecer,decisao,created_at)"),
      s.from("entrevistas").select("candidato_id,status"),
    ]);
  const all: any[] = (rows || []) as any[],
    applications: any[] = (apps || []) as any[],
    hired = applications.filter((x: any) => x.status === "contratado").length,
    query=(params.q||"").trim().toLocaleLowerCase("pt-BR"),
    filtered=all.filter((r:any)=>(!query||[r.nome,r.cargo,r.telefone,r.email].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR").includes(query))&&(!params.situacao||r.situacao===params.situacao)),
    size=10,pages=Math.max(1,Math.ceil(filtered.length/size)),page=Math.min(pages,Math.max(1,Number(params.pagina)||1)),list=filtered.slice((page-1)*size,page*size);
  return (
    <section className="module-page">
      <PageHeader
        title="Candidatos"
        description="Cadastre, gerencie e acompanhe os candidatos em todos os processos seletivos."
      />
      <div className="module-kpis four">
        <KpiCard
          Icon={Users}
          value={all.length}
          label="Total de candidatos"
          note="↑ base de talentos"
        />
        <KpiCard
          Icon={FileText}
          value={new Set(applications.map((x: any) => x.candidato_id)).size}
          label="Em processos"
          note="↑ processos ativos"
        />
        <KpiCard
          Icon={CalendarDays}
          value={
            (interviews || []).filter((x: any) =>
              ["agendada", "confirmada"].includes(x.status),
            ).length
          }
          label="Entrevistas agendadas"
          note="↑ agenda atualizada"
        />
        <KpiCard
          Icon={CheckCircle2}
          value={hired}
          label="Contratados"
          note="↑ resultado acumulado"
          tone="green"
        />
      </div>
      <div className="module-panel">
        <form className="filterbar" method="get">
          <label className="searchbox">
            <Search size={15} />
            <input name="q" defaultValue={params.q||""} placeholder="Buscar por nome, cargo, telefone ou e-mail..." />
          </label>
          <select name="situacao" defaultValue={params.situacao||""}><option value="">Todos os status</option><option value="disponivel">Disponível</option><option value="empregado">Empregado</option></select><button className="outline-button">Filtrar</button>
          <details className="action-popover">
            <summary>
              <Plus size={15} /> Novo candidato
            </summary>
            <form action={criar} className="popover-form">
              <input name="nome" placeholder="Nome" required />
              <input name="email" type="email" placeholder="E-mail" />
              <input name="telefone" placeholder="Telefone" />
              <input name="cargo" placeholder="Cargo pretendido" />
              <input name="cidade" placeholder="Cidade" />
              <input name="estado" maxLength={2} placeholder="UF" />
              <select name="situacao">
                <option value="disponivel">Disponível</option>
                <option value="empregado">Empregado</option>
              </select>
              <button className="primary-button">Cadastrar candidato</button>
            </form>
          </details>
        </form>
        <div className="table-wrap">
          <table className="module-table">
            <thead>
              <tr>
                <th>Nome ↕</th>
                <th>Cargo pretendido ↕</th>
                <th>Telefone ↕</th>
                <th>E-mail ↕</th>
                <th>Etapa ↕</th>
                <th>Status ↕</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r: any, i: number) => {
                const app = applications.find(
                  (x: any) => x.candidato_id === r.id,
                );
                return (
                  <tr key={r.id}>
                    <td>
                      <div className="entity-cell">
                        <InitialAvatar name={r.nome} index={i} />
                        <div>
                          <b>{r.nome}</b>
                          <small>ID: {String(i + 1).padStart(4, "0")}</small>
                        </div>
                      </div>
                    </td>
                    <td>{r.cargo || app?.vagas?.cargo || "—"}</td>
                    <td>{r.telefone || "—"}</td>
                    <td>{r.email || "—"}</td>
                    <td>
                      <span className="vacancy-stage stage-blue">
                        {app?.status === "entrevista"
                          ? "Entrevistas"
                          : app?.status === "aprovado"
                            ? "Finalistas"
                            : app?.status === "triagem"
                              ? "Triagem"
                              : "Em análise"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-chip ${r.situacao === "empregado" ? "neutral" : "success"}`}
                      >
                        {r.situacao === "empregado"
                          ? "Indisponível"
                          : "Confirmado"}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <ActionModal kind="view" title={r.nome}><div><h3>{r.nome}</h3><p><strong>E-mail:</strong> {r.email||"—"}</p><p><strong>Telefone:</strong> {r.telefone||"—"}</p><p><strong>Cargo:</strong> {r.cargo||"—"}</p><p><strong>Cidade/UF:</strong> {[r.cidade,r.estado].filter(Boolean).join("/")||"—"}</p><p><strong>Situação:</strong> {r.situacao==="empregado"?"Empregado":"Disponível"}</p><p><strong>LinkedIn:</strong> {r.linkedin_url||"—"}</p><p><strong>Processo atual:</strong> {app?.vagas?.cargo||"—"} · {app?.vagas?.empresas?.nome||"—"}</p><p><strong>Etapa:</strong> {app?.status||"—"}</p><p><strong>Avaliação:</strong> {app?.avaliacoes?.[0]?.nota_tecnica?String(app.avaliacoes[0].nota_tecnica)+"/5":"—"}</p><p><strong>Parecer:</strong> {app?.avaliacoes?.[0]?.parecer||"—"}</p><p><strong>Observações:</strong> {r.observacoes||"—"}</p><ResumeActions candidateId={r.id} path={r.curriculo_path}/></div></ActionModal>
                        <ActionModal kind="edit" title={r.nome}><form action={editar}><input type="hidden" name="id" value={r.id}/><label>Nome<input name="nome" defaultValue={r.nome} required/></label><label>E-mail<input name="email" defaultValue={r.email||""}/></label><label>Telefone<input name="telefone" defaultValue={r.telefone||""}/></label><label>Cargo<input name="cargo" defaultValue={r.cargo||""}/></label><label>Cidade<input name="cidade" defaultValue={r.cidade||""}/></label><label>UF<input name="estado" maxLength={2} defaultValue={r.estado||""}/></label><label>LinkedIn<input name="linkedin_url" type="url" defaultValue={r.linkedin_url||""}/></label><label className="wide">Observações<textarea name="observacoes" rows={4} defaultValue={r.observacoes||""}/></label><label>Situação<select name="situacao" defaultValue={r.situacao||"disponivel"}><option value="disponivel">Disponível</option><option value="empregado">Empregado</option></select></label><button className="primary-button">Salvar</button></form></ActionModal>
                        <ResumeActions candidateId={r.id} path={r.curriculo_path}/><form action={excluir}><input type="hidden" name="id" value={r.id}/><ConfirmSubmitButton/></form>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!list.length && (
                <EmptyRow colSpan={7} label="Nenhum candidato cadastrado." />
              )}
            </tbody>
          </table>
        </div>
        <div className="pagination"><span>Mostrando {filtered.length?(page-1)*size+1:0} a {Math.min(page*size,filtered.length)} de {filtered.length} candidatos</span><div className="pagination-pages">{Array.from({length:pages},(_,idx)=>idx+1).map(n=><a key={n} className={n===page?"active":""} href={`/candidatos?q=${encodeURIComponent(params.q||"")}&situacao=${encodeURIComponent(params.situacao||"")}&pagina=${n}`}>{n}</a>)}</div></div>
      </div>
    </section>
  );
}
