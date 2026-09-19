import { revalidatePath } from "next/cache";
import {
import { ActionModal } from "@/components/ActionModal";
  CalendarDays,
  CheckCircle2,
  Eye,
  FileText,
  MoreVertical,
  Trash2,
  Pencil,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  EmptyRow,
  InitialAvatar,
  KpiCard,
  PageHeader,
} from "@/components/ModuleUI";
import { ResumeActions } from "@/components/ResumeActions";
export default async function Page() {
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
async function editar(f: FormData) {"use server"; const s=await createClient(); await s.from("candidatos").update({nome:String(f.get("nome")),email:String(f.get("email")||"")||null,telefone:String(f.get("telefone")||"")||null,cargo:String(f.get("cargo")||"")||null,situacao:String(f.get("situacao")||"disponivel")}).eq("id",String(f.get("id"))); revalidatePath("/candidatos");}
  async function excluir(f: FormData) {"use server"; const s=await createClient(); await s.from("candidatos").delete().eq("id",String(f.get("id"))); revalidatePath("/candidatos");}
  const s = await createClient();
  const [{ data: rows }, { data: apps }, { data: interviews }] =
    await Promise.all([
      s
        .from("candidatos")
        .select("*")
        .order("created_at", { ascending: false }),
      s.from("candidaturas").select("candidato_id,status,vagas(cargo)"),
      s.from("entrevistas").select("candidato_id,status"),
    ]);
  const list: any[] = (rows || []) as any[],
    applications: any[] = (apps || []) as any[],
    hired = applications.filter((x: any) => x.status === "contratado").length;
  return (
    <section className="module-page">
      <PageHeader
        title="Candidatos"
        description="Cadastre, gerencie e acompanhe os candidatos em todos os processos seletivos."
      />
      <div className="module-kpis four">
        <KpiCard
          Icon={Users}
          value={list.length}
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
        <div className="filterbar">
          <label className="searchbox">
            <Search size={15} />
            <input placeholder="Buscar por nome, cargo, telefone ou e-mail..." />
          </label>
          <select>
            <option>Todos os processos</option>
          </select>
          <select>
            <option>Todas as etapas</option>
          </select>
          <select>
            <option>Todos os status</option>
          </select>
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
        </div>
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
              {list.slice(0, 10).map((r: any, i: number) => {
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
                        <ActionModal kind="view" title={r.nome}><div><h3>{r.nome}</h3><p><strong>E-mail:</strong> {r.email||"—"}</p><p><strong>Telefone:</strong> {r.telefone||"—"}</p><p><strong>Cargo:</strong> {r.cargo||"—"}</p><p><strong>Cidade/UF:</strong> {[r.cidade,r.estado].filter(Boolean).join("/")||"—"}</p><p><strong>Situação:</strong> {r.situacao==="empregado"?"Empregado":"Disponível"}</p><p><strong>Observações:</strong> {r.observacoes||"—"}</p><ResumeActions candidateId={r.id} path={r.curriculo_path}/></div></ActionModal>
                        <ActionModal kind="edit" title={r.nome}><form action={editar}><input type="hidden" name="id" value={r.id}/><label>Nome<input name="nome" defaultValue={r.nome} required/></label><label>E-mail<input name="email" defaultValue={r.email||""}/></label><label>Telefone<input name="telefone" defaultValue={r.telefone||""}/></label><label>Cargo<input name="cargo" defaultValue={r.cargo||""}/></label><label>Situação<select name="situacao" defaultValue={r.situacao||"disponivel"}><option value="disponivel">Disponível</option><option value="empregado">Empregado</option></select></label><button className="primary-button">Salvar</button></form></ActionModal>
                        <ResumeActions candidateId={r.id} path={r.curriculo_path}/><form action={excluir}><input type="hidden" name="id" value={r.id}/><button title="Excluir"><Trash2 size={14}/></button></form>
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
        <div className="pagination">
          <span>
            Mostrando {Math.min(10, list.length)} de {list.length} candidatos
          </span>
          <b>1</b>
        </div>
      </div>
    </section>
  );
}
