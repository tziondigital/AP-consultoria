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
export default async function Configuracoes() {
  const s = await createClient();
  const {
    data: { user },
  } = await s.auth.getUser();
  const [{ data: profile }, { count: users }, { count: logs }] =
    await Promise.all([
      s
        .from("usuarios")
        .select("nome,email,perfil")
        .eq("id", user!.id)
        .single(),
      s.from("usuarios").select("*", { count: "exact", head: true }),
      s.from("audit_logs").select("*", { count: "exact", head: true }),
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
        <span>Integrações</span>
        <span>Personalização</span>
        <span>Segurança</span>
        <span>Backup</span>
        <span>Logs</span>
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
        <div className="module-panel settings-card">
          <div className="panel-heading">
            <b>Dados da empresa</b>
          </div>
          <div className="company-logo-row">
            <img src="/ap-logo.svg" alt="Logo AP Consultoria" />
            <button className="outline-button" disabled>
              Alterar logo
            </button>
          </div>
          <div className="settings-form">
            <label>
              Nome da empresa
              <input value="AP Consultoria" readOnly />
            </label>
            <label>
              CNPJ
              <input value="" placeholder="Não cadastrado" readOnly />
            </label>
            <label>
              E-mail
              <input value={profile?.email || ""} readOnly />
            </label>
            <label>
              Responsável
              <input value={profile?.nome || ""} readOnly />
            </label>
            <label className="span-2">
              Endereço
              <input value="" placeholder="Não cadastrado" readOnly />
            </label>
          </div>
          <p className="info-note">
            Os dados institucionais serão editáveis quando houver uma tabela de
            configurações com controle de acesso no banco.
          </p>
          <button className="primary-button" disabled>
            <Save size={14} /> Salvar alterações
          </button>
        </div>
        <div className="module-panel settings-card">
          <div className="panel-heading">
            <b>Preferências do sistema</b>
          </div>
          <div className="settings-form">
            <label>
              Idioma
              <select defaultValue="pt-BR" disabled>
                <option value="pt-BR">Português (Brasil)</option>
              </select>
            </label>
            <label>
              Fuso horário
              <select defaultValue="America/Sao_Paulo" disabled>
                <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
              </select>
            </label>
            <label>
              Formato de data
              <select defaultValue="dd/MM/yyyy" disabled>
                <option>dd/MM/yyyy</option>
              </select>
            </label>
            <label>
              Formato de hora
              <select defaultValue="24h" disabled>
                <option>24h</option>
              </select>
            </label>
          </div>
          <div className="toggle-list">
            <label>
              <input type="checkbox" defaultChecked disabled /> E-mail de
              entrevista via Edge Function
            </label>
            <label>
              <input type="checkbox" defaultChecked disabled /> Exibir
              indicadores no dashboard
            </label>
            <label>
              <input type="checkbox" disabled /> Modo escuro
            </label>
          </div>
        </div>
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
