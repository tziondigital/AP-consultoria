import { createClient } from "@/lib/supabase/server";
import {
  Building2,
  Users,
  Plug,
  Clock3,
  Save,
  ShieldCheck,
  Database,
  ScrollText,
} from "lucide-react";
import { PageHeader } from "@/components/ModuleUI";
import Link from "next/link";
import Image from "next/image";
import { revalidatePath } from "next/cache";
export default async function Configuracoes() {
  async function salvar(f: FormData) {
    "use server";
    const db = await createClient();
    const changes:Record<string,unknown>={updated_at:new Date().toISOString()};
    for(const key of ["nome_empresa","cnpj","email","responsavel","endereco","idioma","fuso_horario","formato_data","formato_hora","banco","agencia","conta","chave_pix"])if(f.has(key))changes[key]=String(f.get(key)||"")||null;
    if(f.has("preferencias")){changes.email_entrevista=f.get("email_entrevista")==="on";changes.indicadores_dashboard=f.get("indicadores_dashboard")==="on";changes.modo_escuro=f.get("modo_escuro")==="on";}
    await db.from("configuracoes_sistema").update(changes).eq("id",true);
    revalidatePath("/configuracoes");
  }
  const s = await createClient();
  const {
    data: { user },
  } = await s.auth.getUser();
  const [{ data: profile }, { count: users }, { count: logs }, {data: config}] =
    await Promise.all([
      s
        .from("usuarios")
        .select("nome,email,perfil")
        .eq("id", user!.id)
        .single(),
      s.from("usuarios").select("*", { count: "exact", head: true }),
      s.from("audit_logs").select("*", { count: "exact", head: true }),
      s.from("configuracoes_sistema").select("*").eq("id",true).single(),
    ]);
  return (
    <section className="module-page settings-page">
      <PageHeader
        title="Configurações"
        description="Personalize e gerencie diferentes necessidades da sua empresa."
      />
      <nav className="settings-tabs" aria-label="Seções de configurações">
        <b>Geral</b>
        <Link href="/notificacoes">Notificações</Link>
        <Link href="/usuarios">Permissões</Link>
        <Link href="/integracoes">Integrações</Link>
        <Link href="/personalizacao">Personalização</Link>
        <Link href="/seguranca">Segurança</Link>
        <Link href="/backup">Backup</Link>
        <Link href="/logs">Logs</Link>
      </nav>
      <div className="settings-kpis">
        <div>
          <Building2 />
          <b>AP Consultoria</b>
          <small>Perfil institucional</small>
        </div>
        <div>
          <Users />
          <b>{users || 0}</b>
          <small>Usuários cadastrados</small>
        </div>
        <div>
          <Plug />
          <b>Supabase</b>
          <small>Banco conectado</small>
        </div>
        <div>
          <Clock3 />
          <b>Último acesso</b>
          <small>{new Date().toLocaleDateString("pt-BR")}</small>
        </div>
      </div>
      <div className="settings-grid">
        <form className="module-panel settings-card" action={salvar}>
          <div className="panel-heading">
            <b>Dados da empresa</b>
          </div>
          <div className="company-logo-row">
            <Image src="/ap-logo.svg" alt="Logo AP Consultoria" width={120} height={72} />
            <button className="outline-button" disabled>
              Alterar logo
            </button>
          </div>
          <div className="settings-form">
            <label>
              Nome da empresa
              <input name="nome_empresa" defaultValue={config?.nome_empresa||"AP Consultoria"} />
            </label>
            <label>
              CNPJ
              <input name="cnpj" defaultValue={config?.cnpj||""} placeholder="Não cadastrado" />
            </label>
            <label>
              E-mail
              <input name="email" defaultValue={config?.email||profile?.email||""} />
            </label>
            <label>
              Responsável
              <input name="responsavel" defaultValue={config?.responsavel||profile?.nome||""} />
            </label>
            <label className="span-2">
              Endereço
              <input name="endereco" defaultValue={config?.endereco||""} placeholder="Não cadastrado" />
            </label>
          </div>
          <button className="primary-button">
            <Save size={14} /> Salvar alterações
          </button>
        </form>
        <form className="module-panel settings-card" action={salvar}>
          <input type="hidden" name="preferencias" value="1"/>
          <div className="panel-heading">
            <b>Preferências do sistema</b>
          </div>
          <div className="settings-form">
            <label>
              Idioma
              <select name="idioma" defaultValue={config?.idioma||"pt-BR"}>
                <option value="pt-BR">Português (Brasil)</option>
              </select>
            </label>
            <label>
              Fuso horário
              <select name="fuso_horario" defaultValue={config?.fuso_horario||"America/Sao_Paulo"}>
                <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
              </select>
            </label>
            <label>
              Formato de data
              <select name="formato_data" defaultValue={config?.formato_data||"dd/MM/yyyy"}>
                <option>dd/MM/yyyy</option>
              </select>
            </label>
            <label>
              Formato de hora
              <select name="formato_hora" defaultValue={config?.formato_hora||"24h"}>
                <option>24h</option>
              </select>
            </label>
          </div>
          <div className="toggle-list">
            <label>
              <input name="email_entrevista" type="checkbox" defaultChecked={config?.email_entrevista??true} /> E-mail de
              entrevista via Edge Function
            </label>
            <label>
              <input name="indicadores_dashboard" type="checkbox" defaultChecked={config?.indicadores_dashboard??true} /> Exibir
              indicadores no dashboard
            </label>
            <label>
              <input name="modo_escuro" type="checkbox" defaultChecked={config?.modo_escuro??false} /> Modo escuro
            </label>
          </div><button className="primary-button"><Save size={14}/> Salvar preferências</button>
        </form>
        <form className="module-panel settings-card" action={salvar}>
          <div className="panel-heading"><b>Dados bancários para faturamento</b></div>
          <div className="settings-form"><label>Banco<input name="banco" defaultValue={config?.banco||""}/></label><label>Agência<input name="agencia" defaultValue={config?.agencia||""}/></label><label>Conta<input name="conta" defaultValue={config?.conta||""}/></label><label>Chave PIX<input name="chave_pix" defaultValue={config?.chave_pix||""}/></label></div>
          <button className="primary-button"><Save size={14}/> Salvar dados bancários</button>
        </form>
        <div className="module-panel settings-card">
          <div className="panel-heading">
            <b>Segurança e plano</b>
          </div>
          <div className="safe-row">
            <ShieldCheck />
            <div>
              <b>Perfil atual: {profile?.perfil || "usuário"}</b>
              <small>
                Permissões controladas pelas políticas RLS do Supabase.
              </small>
            </div>
          </div>
          <div className="safe-row">
            <Database />
            <div>
              <b>Backup protegido</b>
              <small>
                Restauração não é disponibilizada nesta tela sem procedimento
                administrativo seguro.
              </small>
            </div>
          </div>
        </div>
        <div className="module-panel settings-card">
          <div className="panel-heading">
            <b>Dados do sistema</b>
          </div>
          <div className="safe-row">
            <ScrollText />
            <div>
              <b>{logs || 0} registros de auditoria</b>
              <small>As ações sensíveis são preservadas no histórico.</small>
            </div>
          </div>
          <button className="danger-outline" disabled>
            Limpar dados de teste
          </button>
          <p className="info-note">
            A limpeza permanece bloqueada para impedir exclusão acidental de
            dados reais.
          </p>
        </div>
      </div>
    </section>
  );
}
