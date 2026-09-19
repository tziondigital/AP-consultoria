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
export function Sidebar() {
  const p = usePathname();
  return (
    <aside className="sidebar">
      <div className="brand">
        <Image
          className="brand-logo"
          src="/ap-logo.svg"
          alt="AP Consultoria Recursos Humanos"
          width={178}
          height={86}
        />
      </div>
      <nav className="nav">
        {items.map(([href, label, Icon]) => (
          <Link
            className={p.startsWith(href) ? "active" : ""}
            key={href}
            href={href}
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
        >
          <Users size={17} />
          <span>Usuários</span>
        </Link>
        <Link
          className={p.startsWith("/configuracoes") ? "active" : ""}
          href="/configuracoes"
        >
          <Settings size={17} />
          <span>Configurações</span>
        </Link>
      </div>
    </aside>
  );
}
