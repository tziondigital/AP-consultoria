import { revalidatePath } from "next/cache";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Plus,
  Video,
  Pencil,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { KpiCard, PageHeader } from "@/components/ModuleUI";
const br = (v: string) =>
  new Date(v).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });
const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
export default async function Page() {
  async function excluir(f: FormData) {"use server";const s=await createClient();await s.from("entrevistas").delete().eq("id",String(f.get("id")));revalidatePath("/entrevistas");}
  async function atualizar(f: FormData) {"use server";const s=await createClient();await s.from("entrevistas").update({status:String(f.get("status")),link:String(f.get("link")||"")||null}).eq("id",String(f.get("id")));revalidatePath("/entrevistas");}
  async function criar(f: FormData) {
    "use server";
    const s = await createClient(),
      id = String(f.get("candidatura_id"));
    const { data: c } = await s
      .from("candidaturas")
      .select("candidato_id,vaga_id,candidatos(email)")
      .eq("id", id)
      .single();
    if (c) {
      const { data: e } = await s
        .from("entrevistas")
        .insert({
          candidatura_id: id,
          candidato_id: c.candidato_id,
          vaga_id: c.vaga_id,
          data: new Date(`${String(f.get("data"))}:00-03:00`).toISOString(),
          duracao_minutos: Number(f.get("duracao_minutos") || 45),
          link: String(f.get("link") || "") || null,
        })
        .select("id")
        .single();
      const person = Array.isArray(c.candidatos)
        ? c.candidatos[0]
        : c.candidatos;
      if (e && person?.email)
        await s.functions.invoke("send-interview-email", {
          body: { entrevista_id: e.id },
        });
    }
    revalidatePath("/entrevistas");
  }
  const s = await createClient();
  const [{ data: rows }, { data: cands }] = await Promise.all([
    s
      .from("entrevistas")
      .select("*,candidatos(nome,email),vagas(cargo,empresas(nome))")
      .order("data"),
    s
      .from("candidaturas")
      .select("id,candidatos(nome),vagas(cargo)")
      .in("status", ["novo", "triagem", "entrevista", "aprovado"]),
  ]);
  const list = rows || [],
    today = new Date().toLocaleDateString("pt-BR"),
    todayRows = list.filter(
      (r: any) =>
        new Date(r.data).toLocaleDateString("pt-BR", {
          timeZone: "America/Sao_Paulo",
        }) === today,
    ),
    confirmed = list.filter((r: any) => r.status === "confirmada").length,
    pending = list.filter((r: any) => r.status === "agendada").length,
    done = list.filter((r: any) => r.status === "realizada").length;
  return (
    <section className="module-page">
      <PageHeader
        title="Entrevistas"
        description="Organize, agende e acompanhe as entrevistas dos candidatos."
        action={
          <details className="action-popover">
            <summary>
              <Plus size={16} /> Agendar entrevista
            </summary>
            <form action={criar} className="popover-form">
              <select name="candidatura_id" required defaultValue="">
                <option value="" disabled>
                  Selecione o candidato
                </option>
                {(cands || []).map((x: any) => (
                  <option key={x.id} value={x.id}>
                    {x.candidatos?.nome} — {x.vagas?.cargo}
                  </option>
                ))}
              </select>
              <input name="data" type="datetime-local" required />
              <input name="duracao_minutos" type="number" defaultValue="45" />
              <input name="link" type="url" placeholder="Link Meet / Teams" />
              <button className="primary-button">Agendar</button>
            </form>
          </details>
        }
      />
      <div className="module-kpis four">
        <KpiCard
          Icon={CalendarDays}
          value={todayRows.length}
          label="Entrevistas hoje"
          note="↑ agenda do dia"
        />
        <KpiCard
          Icon={CheckCircle2}
          value={confirmed}
          label="Confirmadas"
          note="↑ presença confirmada"
          tone="green"
        />
        <KpiCard
          Icon={Clock3}
          value={pending}
          label="Pendentes"
          note="Aguardando confirmação"
          tone="yellow"
        />
        <KpiCard
          Icon={CalendarDays}
          value={done}
          label="Realizadas no mês"
          note="↑ histórico mensal"
        />
      </div>
      <div className="interview-layout">
        <div className="module-panel interview-calendar">
          <div className="panel-heading">
            <b>Agenda de Entrevistas</b>
          </div>
          <div className="calendar-filters">
            <label>
              Período
              <input value="Semana atual" readOnly />
            </label>
            <label>
              Recrutador
              <select>
                <option>Todos</option>
              </select>
            </label>
            <label>
              Status
              <select>
                <option>Todos</option>
              </select>
            </label>
          </div>
          <div className="calendar-toolbar">
            <b>Setembro de 2026</b>
            <span>
              <button>Dia</button>
              <button className="active">Semana</button>
              <button>Mês</button>
            </span>
          </div>
          <div className="week-grid">
            <div className="time-col">
              {[
                "08:00",
                "09:00",
                "10:00",
                "11:00",
                "12:00",
                "13:00",
                "14:00",
                "15:00",
                "16:00",
                "17:00",
              ].map((x) => (
                <span key={x}>{x}</span>
              ))}
            </div>
            {days.map((d, i) => (
              <div className="day-col" key={d}>
                <b>
                  {d}
                  <small>{22 + i}/09</small>
                </b>
                {list
                  .filter((_: any, j: number) => j % 7 === i)
                  .slice(0, 3)
                  .map((r: any, j: number) => (
                    <article
                      key={r.id}
                      style={{ marginTop: `${18 + j * 42}px` }}
                    >
                      <strong>{r.candidatos?.nome}</strong>
                      <small>{r.vagas?.cargo}</small>
                    </article>
                  ))}
              </div>
            ))}
          </div>
        </div>
        <div className="module-panel next-interviews">
          <div className="panel-heading">
            <b>Próximas entrevistas</b>
            <span>Ver agenda completa →</span>
          </div>
          <div className="table-wrap">
            <table className="module-table">
              <thead>
                <tr>
                  <th>Horário</th>
                  <th>Candidato</th>
                  <th>Cargo</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {list.slice(0, 8).map((r: any) => (
                  <tr key={r.id}>
                    <td>
                      <b>{br(r.data)}</b>
                    </td>
                    <td>
                      <b>{r.candidatos?.nome}</b>
                    </td>
                    <td>{r.vagas?.cargo}</td>
                    <td>
                      <span
                        className={`status-chip ${r.status === "confirmada" ? "success" : "warning"}`}
                      >
                        {r.status === "confirmada" ? "Confirmada" : "Pendente"}
                      </span>
                    </td>
                    <td>
                      <div className="interview-actions">{r.link?<a href={r.link} target="_blank" rel="noreferrer"><Video size={14}/></a>:<Video size={14}/>}<details className="row-editor"><summary><Pencil size={14}/></summary><form action={atualizar}><input type="hidden" name="id" value={r.id}/><select name="status" defaultValue={r.status}><option value="agendada">Agendada</option><option value="confirmada">Confirmada</option><option value="realizada">Realizada</option><option value="nao_compareceu">Não compareceu</option></select><input name="link" defaultValue={r.link||""} placeholder="Link da reunião"/><button className="primary-button">Salvar</button></form></details><form action={excluir}><input type="hidden" name="id" value={r.id}/><button className="icon-button" title="Excluir"><X size={14}/></button></form></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <span>
              Mostrando {Math.min(8, list.length)} de {list.length} entrevistas
            </span>
            <b>1</b>
          </div>
        </div>
      </div>
    </section>
  );
}
