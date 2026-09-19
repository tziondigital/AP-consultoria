'use client';
import {useState} from 'react';
import {Bell,ChevronDown,Menu,Search} from 'lucide-react';
import {Sidebar} from '@/components/Sidebar';

export function DashboardShell({children,initials,name,role}:{children:React.ReactNode;initials:string;name:string;role:string}){
  const [collapsed,setCollapsed]=useState(false);
  return <div className={'shell '+(collapsed?'sidebar-collapsed':'')}>
    <Sidebar collapsed={collapsed}/>
    <main className="main">
      <header className="topbar">
        <button className="menu-toggle" aria-label={collapsed?'Expandir menu':'Recolher menu'} onClick={()=>setCollapsed(v=>!v)}><Menu size={19}/></button>
        <div className="global-search"><Search size={16}/><input aria-label="Busca global" placeholder="Buscar vagas, candidatos, empresas..."/></div>
        <div className="top-actions">
          <a href="/notificacoes" className="notification-bell" aria-label="Notificações"><Bell size={18}/></a>
          <div className="avatar">{initials}</div>
          <div className="profile"><b>{name}</b><span>{role}</span></div>
          <ChevronDown size={15}/>
        </div>
      </header>
      <div className="content">{children}</div>
    </main>
  </div>
}
