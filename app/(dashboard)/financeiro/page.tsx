import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  BadgeDollarSign,
  WalletCards,
  ReceiptText,
  ChartNoAxesCombined,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { EmptyRow, KpiCard, PageHeader } from "@/components/ModuleUI";
const money = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export default async function Financeiro() {
  async function criar(f: FormData) {
    "use server";
    async function editar(f: FormData) {"use server"; const s=await createClient(); await s.from("financeiro").update({valor:Number(f.get("valor")||0),percentual:Number(f.get("percentual")||0),data_vencimento:String(f.get("data_vencimento")||"")||null}).eq("id",String(f.get("id"))); revalidatePath("/financeiro");}
  async function excluir(f: FormData) {"use server"; const s=await createClient(); await s.from("financeiro").delete().eq("id",String(f.get("id"))); revalidatePath("/financeiro");}
  const s = await createClient();
    await s
      .from("financeiro")
      .insert({
        vaga_id: String(f.get("vaga_id")),
        valor: Number(f.get("valor") || 0),
        percentual: Number(f.get("percentual") || 0),
        data_vencimento: String(f.get("data_vencimento") || "") || null,
      });
    revalidatePath("/financeiro");
  }
  async function baixar(f: FormData) {
    "use server";
    const s = await createClient();
    const pago = f.get("pago") === "true";
    await s
      .from("financeiro")
      .update({
        pago,
        status: pago ? "pago" : "pendente",
        data_pagamento: pago ? new Date().toISOString().slice(0, 10) : null,
      })
      .eq("id", String(f.get("id")));
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
  const list = rows || [];
  const total = list.reduce((a: any, r: any) => a + Number(r.valor || 0), 0);
  const paid = list
    .filter((r: any) => r.pago)
    .reduce((a: any, r: any) => a + Number(r.valor || 0), 0);
  const pending = list
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
            {list.slice(0, 8).map((r: any, i: number) => (
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
          <div
            className="donut-summary"
            style={
              {
                "--paid": `${total ? (paid / total) * 100 : 0}%`,
              } as React.CSSProperties
            }
          >
            <strong>{money(total)}</strong>
            <small>Total</small>
          </div>
        </div>
      </div>
      <div className="module-panel">
        <div className="panel-heading">
          <b>Contratos e Faturamento</b>
          <span>Últimas movimentações</span>
        </div>
        <div className="table-wrap">
          <table className="module-table">
            <thead>
              <tr>
                <th>Empresa</th>
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
                  <td>{r.vagas?.empresas?.nome || "—"}</td>
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
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions"><details className="row-editor"><summary><Pencil size={14}/></summary><form action={editar}><input type="hidden" name="id" value={r.id}/><input name="valor" type="number" step="0.01" defaultValue={r.valor||0}/><input name="percentual" type="number" step="0.01" defaultValue={r.percentual||0}/><input name="data_vencimento" type="date" defaultValue={r.data_vencimento||""}/><button className="primary-button">Salvar</button></form></details><form action={baixar}>
                      <input type="hidden" name="id" value={r.id} />
                      <input
                        type="hidden"
                        name="pago"
                        value={String(!r.pago)}
                      />
                      <button className="text-button">
                        {r.pago ? "Reabrir" : "Marcar pago"}
                      </button>
                    </form><form action={excluir}><input type="hidden" name="id" value={r.id}/><button title="Excluir"><Trash2 size={14}/></button></form></div>
                  </td>
                </tr>
              ))}
              {!list.length && (
                <EmptyRow colSpan={7} label="Nenhum lançamento financeiro." />
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
