"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  CalendarDays,
  GitBranch,
  Building2,
  WalletCards,
  BarChart3,
  Users,
  UserSearch,
  Settings,
} from "lucide-react";
const items = [
  ["/dashboard", "Dashboard", LayoutDashboard],
  ["/vagas", "Vagas", Briefcase],
  ["/candidatos", "Candidatos", UserSearch],
  ["/candidaturas", "Processos", GitBranch],
  ["/entrevistas", "Entrevistas", CalendarDays],
  ["/empresas", "Empresas", Building2],
  ["/financeiro", "Financeiro", WalletCards],
  ["/relatorios", "Relatórios", BarChart3],
] as const;
export function Sidebar({ collapsed=false }: { collapsed?: boolean }) {
  const p = usePathname();
  return (
    <aside className={`sidebar ${collapsed ? "is-collapsed" : ""}`}>
      <div className="brand">
        <Image
          className="brand-logo"
          src="/ap-logo.svg"
          alt="AP Consultoria Recursos Humanos"
          width={178}
          height={86}
        />
      </div>
      <nav className="nav" id="main-navigation" aria-label="Navegação principal">
        {items.map(([href, label, Icon]) => (
          <Link
            className={p.startsWith(href) ? "active" : ""}
            key={href}
            href={href}
            aria-current={p.startsWith(href) ? "page" : undefined}
            title={collapsed?label:undefined}
          >
            <Icon size={17} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="nav nav-bottom">
        <Link
          className={p.startsWith("/usuarios") ? "active" : ""}
          href="/usuarios"
          aria-current={p.startsWith("/usuarios") ? "page" : undefined}
          title={collapsed?"Usuários":undefined}
        >
          <Users size={17} />
          <span>Usuários</span>
        </Link>
        <Link
          className={p.startsWith("/configuracoes") ? "active" : ""}
          href="/configuracoes"
          aria-current={p.startsWith("/configuracoes") ? "page" : undefined}
          title={collapsed?"Configurações":undefined}
        >
          <Settings size={17} />
          <span>Configurações</span>
        </Link>
      </div>
    </aside>
  );
}
