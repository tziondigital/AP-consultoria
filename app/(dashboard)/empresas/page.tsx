import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  Building2,
  BriefcaseBusiness,
  Handshake,
  Plus,
  Search,
  SlidersHorizontal,
  Eye,
  Pencil,
} from "lucide-react";
import { ActionModal } from "@/components/ActionModal";
import {
  EmptyRow,
  InitialAvatar,
  KpiCard,
  PageHeader,
} from "@/components/ModuleUI";

export default async function Empresas({searchParams}:{searchParams:Promise<{q?:string;status?:string;segmento?:string}>}) {
  const params=await searchParams;
  async function criar(f: FormData) {
    "use server";
    const s = await createClient();
    await s
      .from("empresas")
      .insert({
        nome: String(f.get("nome")),
        razao_social: String(f.get("razao_social") || "") || null,
        cnpj: String(f.get("cnpj") || "") || null,
        contato: String(f.get("contato") || "") || null,
        email: String(f.get("email") || "") || null,
        telefone: String(f.get("telefone") || "") || null,
      });
    revalidatePath("/empresas");
  }
  async function editar(f:FormData){"use server";const s=await createClient();await s.from("empresas").update({nome:String(f.get("nome")),razao_social:String(f.get("razao_social")||"")||null,cnpj:String(f.get("cnpj")||"")||null,segmento:String(f.get("segmento")||"")||null,contato:String(f.get("contato")||"")||null,email:String(f.get("email")||"")||null,telefone:String(f.get("telefone")||"")||null,ativo:f.get("ativo")==="true"}).eq("id",String(f.get("id")));revalidatePath("/empresas")}
  const s = await createClient();
  const { data: rows, error } = await s
    .from("empresas")
    .select("*,vagas(id,status)")
    .order("nome");
  const allCompanies = rows || [],query=(params.q||"").toLocaleLowerCase("pt-BR");
  const companies=allCompanies.filter((x:any)=>(!query||[x.nome,x.cnpj,x.email,x.contato].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR").includes(query))&&(!params.status||String(x.ativo)===params.status)&&(!params.segmento||x.segmento===params.segmento));
  const linked = companies.reduce(
    (n: any, x: any) => n + (x.vagas?.length || 0),
    0,
  );
  const active = companies.filter((x: any) => x.ativo).length;
  return (
    <section className="module-page">
      <PageHeader
        title="Empresas"
        description="Gerencie os clientes e empresas parceiras do seu negócio."
        action={
          <details className="action-popover">
            <summary>
              <Plus size={16} /> Cadastrar empresa
            </summary>
            <form action={criar} className="popover-form">
              <input name="nome" placeholder="Nome fantasia" required />
              <input name="razao_social" placeholder="Razão social" />
              <input name="cnpj" placeholder="CNPJ" />
              <input name="contato" placeholder="Responsável" />
              <input name="email" type="email" placeholder="E-mail" />
              <input name="telefone" placeholder="Telefone" />
              <button className="primary-button">Salvar empresa</button>
            </form>
          </details>
        }
      />
      <div className="module-kpis three">
        <KpiCard
          label="Empresas cadastradas"
          value={companies.length}
          note="Total na base"
          Icon={Building2}
        />
        <KpiCard
          label="Vagas vinculadas"
          value={linked}
          note="Em todos os clientes"
          Icon={BriefcaseBusiness}
        />
        <KpiCard
          label="Contratos ativos"
          value={active}
          note="Empresas ativas"
          Icon={Handshake}
          tone="green"
        />
      </div>
      <div className="module-panel">
        <form className="filterbar" method="get">
          <label className="searchbox">
            <Search size={15} />
            <input name="q" defaultValue={params.q} placeholder="Buscar empresa..." />
          </label>
          <select name="status" defaultValue={params.status||""} aria-label="Status">
            <option value="">Todos os status</option><option value="true">Ativas</option><option value="false">Inativas</option>
          </select>
          <select name="segmento" defaultValue={params.segmento||""} aria-label="Segmento">
            <option value="">Todos os segmentos</option>{Array.from(new Set(allCompanies.map((x:any)=>x.segmento).filter(Boolean))).map((x:any)=><option key={x}>{x}</option>)}
          </select>
          <button className="outline-button">
            <SlidersHorizontal size={14} /> Filtros
          </button>
        </form>
        {error && (
          <div className="error-state">
            Não foi possível carregar as empresas: {error.message}
          </div>
        )}
        <div className="table-wrap">
          <table className="module-table">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>CNPJ</th>
                <th>Segmento</th>
                <th>Vagas</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((r: any, i: number) => (
                <tr key={r.id}>
                  <td>
                    <div className="entity-cell">
                      <InitialAvatar name={r.nome} index={i} />
                      <div>
                        <b>{r.nome}</b>
                        <small>
                          {r.email || r.contato || "Sem contato informado"}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>{r.cnpj || "—"}</td>
                  <td>{r.segmento || "Não informado"}</td>
                  <td>{r.vagas?.length || 0}</td>
                  <td>
                    <span
                      className={`status-chip ${r.ativo ? "success" : "neutral"}`}
                    >
                      {r.ativo ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <ActionModal kind="view" title={r.nome}><div><b>{r.nome}</b><small>{r.razao_social||"Razão social não informada"}</small><p><strong>CNPJ:</strong> {r.cnpj||"—"}</p><p><strong>Contato:</strong> {r.contato||"—"}</p><p><strong>E-mail:</strong> {r.email||"—"}</p><p><strong>Telefone:</strong> {r.telefone||"—"}</p><p><strong>Vagas:</strong> {r.vagas?.length||0}</p></div></ActionModal>
                      <ActionModal kind="edit" title={r.nome}><form action={editar}><input type="hidden" name="id" value={r.id}/><label>Nome<input name="nome" defaultValue={r.nome} required/></label><label>Razão social<input name="razao_social" defaultValue={r.razao_social||""}/></label><label>CNPJ<input name="cnpj" defaultValue={r.cnpj||""}/></label><label>Segmento<input name="segmento" defaultValue={r.segmento||""}/></label><label>Contato<input name="contato" defaultValue={r.contato||""}/></label><label>E-mail<input name="email" type="email" defaultValue={r.email||""}/></label><label>Telefone<input name="telefone" defaultValue={r.telefone||""}/></label><label>Status<select name="ativo" defaultValue={String(r.ativo)}><option value="true">Ativa</option><option value="false">Inativa</option></select></label><button className="primary-button">Salvar alterações</button></form></ActionModal>
                      <button aria-label="Mais ações">⋮</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!companies.length && (
                <EmptyRow colSpan={6} label="Nenhuma empresa cadastrada." />
              )}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <span>Mostrando {companies.length} empresa(s)</span>
          <b>1</b>
        </div>
      </div>
    </section>
  );
}
