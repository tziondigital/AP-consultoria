import { revalidatePath } from "next/cache";
import {
  BriefcaseBusiness,
  CheckCircle2,
  Search,
  UserRound,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { InitialAvatar, KpiCard, PageHeader } from "@/components/ModuleUI";
const cols = [
  ["novo", "Recebidos"],
  ["entrevista", "Em Entrevista"],
  ["aprovado", "Finalistas"],
  ["contratado", "Contratados"],
];
export default async function Page() {
  async function mover(f: FormData) {
    "use server";
    const s = await createClient();
    const {error}=await s
      .from("candidaturas")
      .update({ status: String(f.get("status")) })
      .eq("id", String(f.get("id")));
    if(error)throw new Error(error.message);
    revalidatePath("/kanban");
    revalidatePath("/candidaturas");
    revalidatePath("/dashboard");
  }
  const s = await createClient();
  const [{ data: rows }, { data: vagas }, { data: avaliacoes }] = await Promise.all([
    s
      .from("candidaturas")
      .select(
        "id,status,origem,candidatos(nome,cidade,estado),vagas(cargo,requisicao,area,local,estado,salario,tipo_contrato,confidencial,empresas(nome))",
      )
      .order("inscrito_em", { ascending: false }),
    s.from("vagas").select("id,status,cargo").order("cargo"),
    s.from("avaliacoes").select("candidatura_id,nota_tecnica,competencias,parecer,decisao,created_at").order("created_at",{ascending:false}),
  ]);
  const list: any[] = (rows || []) as any[];
  const firstEval=(avaliacoes||[]).find((x:any)=>x.candidatura_id===list[0]?.id);
  return (
    <section className="module-page process-page">
      <PageHeader
        title="Processos Seletivos"
        description="Gerencie seus processos seletivos e acompanhe o progresso dos candidatos."
      />
      <div className="module-kpis four">
        <KpiCard
          Icon={Users}
          value={new Set(list.map((x: any) => x.vagas?.requisicao)).size}
          label="Processos em andamento"
          note="↑ operação ativa"
        />
        <KpiCard
          Icon={BriefcaseBusiness}
          value={
            (vagas || []).filter((x: any) => x.status === "em_andamento").length
          }
          label="Vagas ativas"
          note="↑ vagas do período"
        />
        <KpiCard
          Icon={UserRound}
          value={list.length}
          label="Candidatos no processo"
          note="↑ banco em seleção"
        />
        <KpiCard
          Icon={CheckCircle2}
          value={list.filter((x: any) => x.status === "contratado").length}
          label="Contratações no mês"
          note="↑ resultados"
          tone="green"
        />
      </div>
      <form className="module-panel process-filters" action="/candidaturas" method="get">
        <select name="vaga" defaultValue=""><option value="">Todas as vagas</option>{(vagas||[]).map((v:any)=><option key={v.id} value={v.id}>{v.cargo}</option>)}</select>
        <select name="status"><option value="">Todas as etapas</option><option value="novo">Recebidos</option><option value="triagem">Triagem</option><option value="entrevista">Em Entrevista</option><option value="aprovado">Finalistas</option><option value="contratado">Contratados</option></select>
        <label className="searchbox"><Search size={14}/><input name="q" placeholder="Buscar candidato..." /></label>
        <button className="primary-button" type="submit"><Search size={15}/> Abrir processos</button>
      </form>
      <div className="module-panel kanban-panel">
        <div className="panel-heading">
          <b>
            Kanban do Processo Seletivo{" "}
            <small>({list.length} candidatos)</small>
          </b>
          <span><a href="/candidaturas">Lista</a>　 <b>Kanban</b>　 <a href="/candidaturas">Ver todos →</a></span>
        </div>
        <div className="kanban-grid">
          {cols.map(([key, label]) => {
            const items = list.filter(
              (r: any) =>
                r.status === key || (key === "novo" && r.status === "triagem"),
            );
            return (
              <div className={`kanban-column col-${key}`} key={key}>
                <div className="kanban-title">
                  <b>{label}</b>
                  <span>{items.length}</span>
                </div>
                {items.map((r: any, i: number) => (
                  <div className="kanban-card process-card" key={r.id}>
                    <InitialAvatar
                      name={r.candidatos?.nome || "AP"}
                      index={i}
                    />
                    <div>
                      <b>{r.candidatos?.nome}</b>
                      <small>{r.vagas?.cargo}</small>
                      <small>Vaga: {r.vagas?.requisicao || "—"}</small>
                    </div>
                    <form action={mover}>
                      <input type="hidden" name="id" value={r.id} />
                      <select name="status" defaultValue={r.status}>
                        {cols.map(([k, l]) => (
                          <option key={k} value={k}>
                            {l}
                          </option>
                        ))}
                      </select>
                      <button type="submit" aria-label={`Salvar etapa de ${r.candidatos?.nome||"candidato"}`}>→</button>
                    </form>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      {list[0] && (
        <div className="process-bottom">
          <div className="module-panel vacancy-sheet">
            <div className="panel-heading">
              <b>Ficha da Vaga</b>
              <a className="primary-button" href="/vagas">Editar vaga</a>
            </div>
            <div className="sheet-tabs">
              Resumo　 Candidatos　 Entrevistas　 Avaliações　 Financeiro　
              Histórico
            </div>
            <h3>
              {list[0].vagas?.requisicao} - {list[0].vagas?.cargo}{" "}
              <span className="status-chip success">Em andamento</span>
            </h3>
            <div className="sheet-facts">
              <p>
                Empresa<b>{list[0].vagas?.empresas?.nome || "—"}</b>
              </p>
              <p>
                Área<b>{list[0].vagas?.area || "—"}</b>
              </p>
              <p>
                Local
                <b>
                  {[list[0].vagas?.local, list[0].vagas?.estado]
                    .filter(Boolean)
                    .join("/") || "—"}
                </b>
              </p>
              <p>
                Contratação<b>{list[0].vagas?.tipo_contrato || "—"}</b>
              </p>
              <p>
                Salário<b>{list[0].vagas?.salario || "—"}</b>
              </p>
              <p>
                Confidencial<b>{list[0].vagas?.confidencial ? "Sim" : "Não"}</b>
              </p>
            </div>
          </div>
          <div className="module-panel candidate-review">
            <div className="panel-heading">
              <b>Avaliação de Candidato</b>
              <a href="/candidatos">Ver candidato</a>
            </div>
            <h3>{list[0].candidatos?.nome}</h3>
            {firstEval?<><p><b>Nota técnica</b> {firstEval.nota_tecnica??"—"}/5</p><b>Competências</b><div className="review-checks">{(firstEval.competencias||[]).length?(firstEval.competencias||[]).join(" · "):"Nenhuma competência registrada."}</div><label>Parecer final<div className="fake-textarea">{firstEval.parecer||"Sem parecer registrado."}</div></label></>:<p className="muted">Ainda não há avaliação registrada para este candidato.</p>}
            <div className="review-actions"><a href="/avaliacoes">Abrir avaliação</a></div>
          </div>
        </div>
      )}
    </section>
  );
}
