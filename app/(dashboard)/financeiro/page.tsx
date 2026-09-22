import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import {
  BadgeDollarSign,
  WalletCards,
  ReceiptText,
  ChartNoAxesCombined,
  Plus,
} from "lucide-react";
import { ActionModal } from "@/components/ActionModal";
import {ConfirmSubmitButton} from "@/components/ConfirmSubmitButton";
import {FinanceAttachmentActions} from "@/components/FinanceAttachmentActions";
import { EmptyRow, KpiCard, PageHeader } from "@/components/ModuleUI";
const financeStatus=(r:any)=>r.status==="pago"||r.pago?"Pago":r.status==="vencido"?"Vencido":r.status==="cancelado"?"Cancelado":r.status==="parcial"||Number(r.valor_pago||0)>0?"Aguardando pagamento":r.numero_nota||r.data_emissao_nota||r.data_faturamento?"Faturado":"Aguardando faturamento";
const money = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
type Params={q?:string;status?:string;pagina?:string};
export default async function Financeiro({searchParams}:{searchParams:Promise<Params>}) {
  const params=await searchParams;
  async function criar(f: FormData) {
    "use server";
    const s = await createClient();
    const {error}=await s
      .from("financeiro")
      .insert({
        vaga_id: String(f.get("vaga_id")),
        valor: Number(f.get("valor") || 0),
        percentual: Number(f.get("percentual") || 0),
        data_vencimento: String(f.get("data_vencimento") || "") || null,
      });
    if(error)throw new Error(error.message);
    revalidatePath("/financeiro");
    revalidatePath("/dashboard");
  }
  async function editar(f: FormData) {
    "use server";
    const s = await createClient();
    const {error}=await s.from("financeiro").update({
      valor: Number(f.get("valor") || 0),
      percentual: Number(f.get("percentual") || 0),
      data_vencimento: String(f.get("data_vencimento") || "") || null,
      numero_nota: String(f.get("numero_nota")||"")||null,
      data_emissao_nota: String(f.get("data_emissao_nota")||"")||null,
      valor_nota: f.get("valor_nota")?Number(f.get("valor_nota")):null,
      valor_pago: f.get("valor_pago")?Number(f.get("valor_pago")):null,
      forma_pagamento: String(f.get("forma_pagamento")||"")||null,
      observacoes: String(f.get("observacoes")||"")||null,
    }).eq("id", String(f.get("id")));
    if(error)throw new Error(error.message);
    revalidatePath("/financeiro");
  }
  async function excluir(f: FormData) {
    "use server";
    const s = await createClient();
    const {error}=await s.from("financeiro").delete().eq("id", String(f.get("id")));if(error)throw new Error(error.message);
    revalidatePath("/financeiro");
  }
  async function anexar(f: FormData) {
    "use server";
    const s=await createClient();const id=String(f.get("id")),tipo=String(f.get("tipo"));const file=f.get("arquivo");
    if(!(file instanceof File)||!file.size)return;
    const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_"),target=`${id}/${tipo}-${Date.now()}-${safe}`;
    const {error}=await s.storage.from("financeiro").upload(target,file,{contentType:file.type||"application/octet-stream",upsert:false});if(error)throw new Error(error.message);
    const {error:updateError}=await s.from("financeiro").update(tipo==="nota"?{nota_fiscal_path:target}:{comprovante_path:target}).eq("id",id);if(updateError)throw new Error(updateError.message);revalidatePath("/financeiro");
  }
  async function baixar(f: FormData) {
    "use server";
    const s = await createClient();
    const pago = f.get("pago") === "true";
    const {error}=await s
      .from("financeiro")
      .update({
        pago,
        status: pago ? "pago" : "pendente",
        data_pagamento: pago ? new Date().toISOString().slice(0, 10) : null,
      })
      .eq("id", String(f.get("id")));
    if(error)throw new Error(error.message);
    revalidatePath("/financeiro");
  }
  const s = await createClient();
  const [{ data: rows, error }, { data: vagas }] = await Promise.all([
    s
      .from("financeiro")
      .select("*,vagas(cargo,empresas(nome))")
      .order("created_at", { ascending: false }),
    s
      .from("vagas")
      .select("id,cargo,empresas(nome)")
      .order("created_at", { ascending: false }),
  ]);
  const all = rows || [];
  const query=(params.q||"").trim().toLocaleLowerCase("pt-BR");
  const filtered=all.filter((r:any)=>(!query||[r.numero_os,r.numero_nota,r.vagas?.cargo,r.vagas?.empresas?.nome].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR").includes(query))&&(!params.status||r.status===params.status));
  const pageSize=10,totalPages=Math.max(1,Math.ceil(filtered.length/pageSize)),page=Math.min(totalPages,Math.max(1,Number(params.pagina)||1)),list=filtered.slice((page-1)*pageSize,page*pageSize);
  const pageHref=(n:number)=>`/financeiro?${new URLSearchParams({...(params.q?{q:params.q}:{}),...(params.status?{status:params.status}:{}),pagina:String(n)}).toString()}`;
  const total = all.reduce((a: any, r: any) => a + Number(r.valor || 0), 0);
  const paid = all
    .filter((r: any) => r.pago)
    .reduce((a: any, r: any) => a + Number(r.valor || 0), 0);
  const pending = all
    .filter((r: any) => !r.pago && r.status !== "cancelado")
    .reduce((a: any, r: any) => a + Number(r.valor || 0), 0);
  return (
    <section className="module-page">
      <PageHeader
        title="Financeiro"
        description="Acompanhe o faturamento, contratos e movimentações financeiras."
        action={
          <details className="action-popover">
            <summary>
              <Plus size={16} /> Nova receita/despesa
            </summary>
            <form action={criar} className="popover-form">
              <select name="vaga_id" required defaultValue="">
                <option value="" disabled>
                  Selecione a vaga
                </option>
                {(vagas || []).map((x: any) => (
                  <option key={x.id} value={x.id}>
                    {x.cargo} — {x.empresas?.nome || ""}
                  </option>
                ))}
              </select>
              <input
                name="valor"
                type="number"
                step="0.01"
                min="0"
                placeholder="Valor"
                required
              />
              <input
                name="percentual"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="Comissão %"
              />
              <input name="data_vencimento" type="date" />
              <button className="primary-button">Salvar lançamento</button>
            </form>
          </details>
        }
      />
      <div className="module-kpis four">
        <KpiCard
          label="Faturamento do período"
          value={money(total)}
          note="Total lançado"
          Icon={BadgeDollarSign}
        />
        <KpiCard
          label="Receitas"
          value={money(paid)}
          note="Valores pagos"
          Icon={WalletCards}
          tone="green"
        />
        <KpiCard
          label="Contas pendentes"
          value={money(pending)}
          note="A receber"
          Icon={ReceiptText}
          tone="red"
        />
        <KpiCard
          label="Saldo acumulado"
          value={money(paid)}
          note="Saldo realizado"
          Icon={ChartNoAxesCombined}
        />
      </div>
      {error && (
        <div className="error-state">
          Não foi possível carregar o financeiro: {error.message}
        </div>
      )}
      <div className="finance-grid">
        <div className="module-panel chart-placeholder">
          <div className="panel-heading">
            <b>Faturamento por mês</b>
            <span>Dados reais</span>
          </div>
          <div className="bar-summary">
            {all.slice(0, 8).map((r: any) => (
              <i
                key={r.id}
                style={{
                  height: `${20 + ((Number(r.valor) || 0) / Math.max(total, 1)) * 160}px`,
                }}
                title={money(Number(r.valor || 0))}
              />
            ))}
          </div>
        </div>
        <div className="module-panel">
          <div className="panel-heading">
            <b>Tipos de receita</b>
          </div>
          <div className="donut-summary">
            <strong>{money(total)}</strong>
            <small>Total</small>
          </div>
        </div>
      </div>
      <div className="module-panel">
        <form className="filterbar" method="get"><label className="searchbox"><input name="q" defaultValue={params.q||""} placeholder="Buscar por OS, empresa, vaga ou NF..."/></label><select name="status" defaultValue={params.status||""}><option value="">Todos os status</option><option value="pendente">Aguardando faturamento</option><option value="parcial">Aguardando pagamento</option><option value="pago">Pago</option><option value="vencido">Vencido</option><option value="cancelado">Cancelado</option></select><button className="outline-button">Filtrar</button>{(params.q||params.status)&&<Link className="outline-button" href="/financeiro">Limpar filtros</Link>}</form>
        <div className="panel-heading">
          <b>Contratos e Faturamento</b>
          <span>Últimas movimentações</span>
        </div>
        <div className="table-wrap">
          <table className="module-table">
            <thead>
              <tr>
                <th>OS</th><th>Empresa</th>
                <th>Vaga</th>
                <th>Valor</th>
                <th>Comissão</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r: any) => (
                <tr key={r.id}>
                  <td><b>{r.numero_os||"—"}</b></td><td>{r.vagas?.empresas?.nome || "—"}</td>
                  <td>
                    <b>{r.vagas?.cargo || "—"}</b>
                  </td>
                  <td>{money(Number(r.valor || 0))}</td>
                  <td>{money(Number(r.valor_comissao || 0))}</td>
                  <td>
                    {r.data_vencimento
                      ? new Date(
                          r.data_vencimento + "T12:00:00",
                        ).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                  <td>
                    <span
                      className={`status-chip ${r.status === "pago" ? "success" : r.status === "vencido" ? "danger" : "warning"}`}
                    >
                      {financeStatus(r)}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions"><ActionModal kind="view" title={r.numero_os||r.vagas?.cargo||"Financeiro"}><div><p><strong>OS:</strong> {r.numero_os||"—"}</p><p><strong>Empresa:</strong> {r.vagas?.empresas?.nome||"—"}</p><p><strong>Vaga:</strong> {r.vagas?.cargo||"—"}</p><p><strong>Base:</strong> {money(Number(r.valor||0))}</p><p><strong>Honorários:</strong> {money(Number(r.valor_comissao||0))}</p><p><strong>NF:</strong> {r.numero_nota||"—"}</p><p><strong>Recebido:</strong> {r.valor_pago?money(Number(r.valor_pago)):"—"}</p><p><strong>Observações:</strong> {r.observacoes||"—"}</p><p><strong>Nota fiscal:</strong> {r.nota_fiscal_path?"Anexada":"Não anexada"} <FinanceAttachmentActions id={r.id} path={r.nota_fiscal_path} kind="nota"/></p><p><strong>Comprovante:</strong> {r.comprovante_path?"Anexado":"Não anexado"} <FinanceAttachmentActions id={r.id} path={r.comprovante_path} kind="comprovante"/></p></div></ActionModal><ActionModal kind="edit" title={r.numero_os||r.vagas?.cargo||"Lançamento financeiro"}><form action={editar}><input type="hidden" name="id" value={r.id}/><label>Base de cálculo<input name="valor" type="number" step="0.01" defaultValue={r.valor||0}/></label><label>Percentual<input name="percentual" type="number" step="0.01" defaultValue={r.percentual||0}/></label><label>Vencimento<input name="data_vencimento" type="date" defaultValue={r.data_vencimento||""}/></label><label>Número da NF<input name="numero_nota" defaultValue={r.numero_nota||""}/></label><label>Data de emissão<input name="data_emissao_nota" type="date" defaultValue={r.data_emissao_nota||""}/></label><label>Valor da NF<input name="valor_nota" type="number" step="0.01" defaultValue={r.valor_nota||""}/></label><label>Valor recebido<input name="valor_pago" type="number" step="0.01" defaultValue={r.valor_pago||""}/></label><label>Forma de pagamento<input name="forma_pagamento" defaultValue={r.forma_pagamento||""}/></label><label className="wide">Observações<textarea name="observacoes" rows={4} defaultValue={r.observacoes||""}/></label><button className="primary-button">Salvar alterações</button></form><form action={anexar} className="attachment-form"><input type="hidden" name="id" value={r.id}/><input type="hidden" name="tipo" value="nota"/><label className="wide">Nota fiscal<input name="arquivo" type="file" accept=".pdf,.png,.jpg,.jpeg" required/></label><button className="small-button">Anexar NF</button></form><form action={anexar} className="attachment-form"><input type="hidden" name="id" value={r.id}/><input type="hidden" name="tipo" value="comprovante"/><label className="wide">Comprovante de pagamento<input name="arquivo" type="file" accept=".pdf,.png,.jpg,.jpeg" required/></label><button className="small-button">Anexar comprovante</button></form></ActionModal><form action={baixar}>
                      <input type="hidden" name="id" value={r.id} />
                      <input
                        type="hidden"
                        name="pago"
                        value={String(!r.pago)}
                      />
                      <button className="text-button">
                        {r.pago ? "Reabrir" : "Marcar pago"}
                      </button>
                    </form><form action={excluir}><input type="hidden" name="id" value={r.id}/><ConfirmSubmitButton/></form></div>
                  </td>
                </tr>
              ))}
              {!list.length && (
                <EmptyRow colSpan={8} label="Nenhum lançamento financeiro." />
              )}
            </tbody>
          </table>
        </div>
        {filtered.length>pageSize&&<div className="pagination"><span>Mostrando {(page-1)*pageSize+1}–{Math.min(page*pageSize,filtered.length)} de {filtered.length} lançamentos</span><span>{page>1&&<Link className="outline-button" href={pageHref(page-1)}>Anterior</Link>}<b>{page} de {totalPages}</b>{page<totalPages&&<Link className="outline-button" href={pageHref(page+1)}>Próxima</Link>}</span></div>}
      </div>
    </section>
  );
}
