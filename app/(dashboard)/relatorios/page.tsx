import { createClient } from "@/lib/supabase/server";
import {
  Users,
  CalendarClock,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Download,
  SlidersHorizontal,
} from "lucide-react";
import { EmptyRow, KpiCard, PageHeader } from "@/components/ModuleUI";
const months = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];
export default async function Relatorios({searchParams}:{searchParams:Promise<{empresa?:string;cargo?:string;origem?:string;status?:string}>}) {
  const params=await searchParams;
  const s = await createClient();
  const start = new Date(new Date().getFullYear(), 0, 1).toISOString();
  const [{ data: vagas }, { data: candidaturas }, { data: candidatos }] =
    await Promise.all([
      s.from("vagas").select("id,cargo,status,created_at,empresas(nome)"),
      s
        .from("candidaturas")
        .select(
          "id,status,origem,inscrito_em,updated_at,candidatos(nome),vagas(cargo,empresas(nome))",
        ),
      s.from("candidatos").select("id").gte("created_at", start),
    ]);
  const rawApplications = candidaturas || [];
  const applications=rawApplications.filter((x:any)=>(!params.empresa||x.vagas?.empresas?.nome===params.empresa)&&(!params.cargo||x.vagas?.cargo===params.cargo)&&(!params.origem||x.origem===params.origem)&&(!params.status||x.status===params.status));
  const hires = applications.filter((x: any) => x.status === "contratado");
  const bars = Array(12).fill(0);
  hires.forEach((x: any) => bars[new Date(x.updated_at).getMonth()]++);
  const max = Math.max(...bars, 1);
  const sources = applications.reduce((a: any, x: any) => {
    const k = x.origem || "Outros";
    a[k] = (a[k] || 0) + 1;
    return a;
  }, {});
  const avg = hires.length
    ? Math.round(
        hires.reduce(
          (a: any, x: any) =>
            a +
            (new Date(x.updated_at).getTime() -
              new Date(x.inscrito_em).getTime()) /
              86400000,
          0,
        ) / hires.length,
      )
    : 0;
  return (
    <section className="module-page">
      <PageHeader
        title="Relatórios"
        description="Visualize e exporte dados estratégicos da sua operação."
        action={
        <a className="primary-button" href="/api/relatorios">
          <Download size={15} /> Exportar relatório
        </a>
        }
      />
      <div className="module-kpis four">
        <KpiCard
          label="Contratações"
          value={hires.length}
          note="No período consultado"
          Icon={Users}
          tone="green"
        />
        <KpiCard
          label="Tempo médio de contratação"
          value={`${avg} dias`}
          note="Da inscrição à contratação"
          Icon={CalendarClock}
        />
        <KpiCard
          label="Vagas em andamento"
          value={
            (vagas || []).filter((x: any) => x.status === "em_andamento").length
          }
          note="Operação atual"
          Icon={BriefcaseBusiness}
        />
        <KpiCard
          label="Candidatos no período"
          value={(candidatos || []).length}
          note="Desde janeiro"
          Icon={ChartNoAxesCombined}
        />
      </div>
      <form className="module-panel filterbar" method="get">
        <select name="periodo">
          <option>Este ano</option>
        </select>
        <select name="empresa" defaultValue={params.empresa||""}>
          <option value="">Todas as empresas</option>{Array.from(new Set(rawApplications.map((x:any)=>x.vagas?.empresas?.nome).filter(Boolean))).map((x:any)=><option key={x}>{x}</option>)}
        </select>
        <select name="cargo" defaultValue={params.cargo||""}>
          <option value="">Todos os cargos</option>{Array.from(new Set(rawApplications.map((x:any)=>x.vagas?.cargo).filter(Boolean))).map((x:any)=><option key={x}>{x}</option>)}
        </select>
        <select name="origem" defaultValue={params.origem||""}>
          <option value="">Todas as origens</option>{Array.from(new Set(rawApplications.map((x:any)=>x.origem).filter(Boolean))).map((x:any)=><option key={x}>{x}</option>)}
        </select>
        <select name="status" defaultValue={params.status||""}>
          <option value="">Todos os status</option>{Array.from(new Set(rawApplications.map((x:any)=>x.status).filter(Boolean))).map((x:any)=><option key={x}>{String(x).replaceAll("_"," ")}</option>)}
        </select>
        <button className="primary-button">
          <SlidersHorizontal size={14} /> Aplicar filtros
        </button>
      </form>
      <div className="report-layout">
        <div className="module-panel">
          <div className="panel-heading">
            <b>Contratações por mês</b>
            <span>{new Date().getFullYear()}</span>
          </div>
          <div className="report-bars">
            {bars.map((v, i) => (
              <div key={months[i]}>
                <b>{v || ""}</b>
                <i style={{ height: `${8 + (v / max) * 105}px` }} />
                <small>{months[i]}</small>
              </div>
            ))}
          </div>
        </div>
        <div className="module-panel">
          <div className="panel-heading">
            <b>Origem dos candidatos</b>
          </div>
          <div className="source-report">
            <div className="donut-summary">
              <strong>{applications.length}</strong>
              <small>candidaturas</small>
            </div>
            <div>
              {Object.entries(sources)
                .slice(0, 6)
                .map(([k, v]: any) => (
                  <p key={k}>
                    <span>{k}</span>
                    <b>
                      {applications.length
                        ? Math.round((v / applications.length) * 100)
                        : 0}
                      %
                    </b>
                  </p>
                ))}
            </div>
          </div>
        </div>
        <div className="module-panel">
          <div className="panel-heading">
            <b>Taxa de conversão do processo</b>
          </div>
          <div className="funnel">
            {["Candidaturas", "Entrevistas", "Finalistas", "Contratados"].map(
              (x, i) => (
                <div key={x} style={{ width: `${100 - i * 16}%` }}>
                  {x}
                  <b>
                    {i === 0
                      ? applications.length
                      : i === 3
                        ? hires.length
                        : applications.filter((a: any) =>
                            i === 1
                              ? [
                                  "entrevista",
                                  "aprovado",
                                  "contratado",
                                ].includes(a.status)
                              : ["aprovado", "contratado"].includes(a.status),
                          ).length}
                  </b>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
      <div className="report-layout report-secondary">
        <div className="module-panel"><div className="panel-heading"><b>Vagas por status</b></div><div className="source-report"><div className="donut-summary"><strong>{(vagas||[]).length}</strong><small>vagas</small></div><div>{[['Abertas','rascunho'],['Em andamento','em_andamento'],['Aguardando aprovação','congelada'],['Fechadas','completada']].map(([label,status])=><p key={status}><span>{label}</span><b>{(vagas||[]).filter((v:any)=>v.status===status).length}</b></p>)}</div></div></div>
        <div className="module-panel"><div className="panel-heading"><b>Tempo médio por etapa (dias)</b></div><div className="module-empty"><strong>Histórico por etapa ainda insuficiente.</strong><span>O tempo total de contratação acima usa dados reais; esta decomposição será exibida quando houver histórico de movimentações.</span></div></div>
        <div className="module-panel"><div className="panel-heading"><b>Satisfação dos clientes</b></div><div className="module-empty"><strong>Sem pesquisa de satisfação integrada.</strong><span>Este indicador será exibido quando houver dados reais disponíveis no banco.</span></div></div>
      </div>
      <div className="module-panel">
        <div className="panel-heading">
          <b>Contratações recentes</b>
          <span>{hires.length} registro(s)</span>
        </div>
        <div className="table-wrap">
          <table className="module-table">
            <thead>
              <tr>
                <th>Candidato</th>
                <th>Cargo</th>
                <th>Empresa</th>
                <th>Data</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {hires.slice(0, 10).map((r: any) => (
                <tr key={r.id}>
                  <td>
                    <b>{r.candidatos?.nome || "—"}</b>
                  </td>
                  <td>{r.vagas?.cargo || "—"}</td>
                  <td>{r.vagas?.empresas?.nome || "—"}</td>
                  <td>{new Date(r.updated_at).toLocaleDateString("pt-BR")}</td>
                  <td>
                    <span className="status-chip success">Contratado</span>
                  </td>
                </tr>
              ))}
              {!hires.length && (
                <EmptyRow
                  colSpan={5}
                  label="Nenhuma contratação registrada no período."
                />
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
