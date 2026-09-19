'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {LayoutDashboard,Briefcase,CalendarDays,GitBranch,Building2,WalletCards,BarChart3,Users,UserSearch,Settings} from 'lucide-react';

const items=[
  ['/dashboard','Dashboard',LayoutDashboard],
  ['/vagas','Vagas',Briefcase],
  ['/candidatos','Candidatos',UserSearch],
  ['/candidaturas','Processos',GitBranch],
  ['/entrevistas','Entrevistas',CalendarDays],
  ['/empresas','Empresas',Building2],
  ['/financeiro','Financeiro',WalletCards],
  ['/relatorios','Relatórios',BarChart3]
] as const;

export function Sidebar({collapsed=false}:{collapsed?:boolean}){
  const p=usePathname();
  return <aside className="sidebar" aria-label="Menu principal">
    <div className="brand"><img className="brand-logo" src="/ap-logo.svg" alt="AP Consultoria Recursos Humanos"/></div>
    <nav className="nav">
      {items.map(([href,label,Icon])=><Link title={collapsed?label:undefined} className={p.startsWith(href)?'active':''} key={href} href={href}><Icon size={17}/><span>{label}</span></Link>)}
    </nav>
    <div className="nav nav-bottom">
      <Link title={collapsed?'Usuários':undefined} className={p.startsWith('/usuarios')?'active':''} href="/usuarios"><Users size={17}/><span>Usuários</span></Link>
      <Link title={collapsed?'Configurações':undefined} className={p.startsWith('/configuracoes')||p.startsWith('/notificacoes')||p.startsWith('/integracoes')||p.startsWith('/personalizacao')||p.startsWith('/seguranca')||p.startsWith('/backup')||p.startsWith('/logs')?'active':''} href="/configuracoes"><Settings size={17}/><span>Configurações</span></Link>
    </div>
  </aside>
}
