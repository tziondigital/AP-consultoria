"use client";
import { useState } from "react";
import { Menu, ChevronDown } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { GlobalSearch } from "@/components/GlobalSearch";

export function DashboardShell({children,userId,unread,initials,name,role}:{children:React.ReactNode;userId:string;unread:number;initials:string;name:string;role:string}) {
  const [collapsed,setCollapsed]=useState(false);
  return <div className={`shell ${collapsed?"sidebar-collapsed":""}`}>
    <Sidebar collapsed={collapsed}/>
    <main className="main">
      <header className="topbar">
        <button className="menu-toggle" type="button" aria-label={collapsed?"Expandir menu":"Recolher menu"} aria-expanded={!collapsed} aria-controls="main-navigation" onClick={()=>setCollapsed(v=>!v)}><Menu size={19}/></button>
        <GlobalSearch/>
        <div className="top-actions">
          <NotificationBell userId={userId} unread={unread}/>
          <div className="avatar">{initials}</div>
          <div className="profile"><b>{name}</b><span>{role}</span></div>
          <ChevronDown size={15}/>
          <em>“Conectando talentos, gerando valor.”</em>
        </div>
      </header>
      <div className="content">{children}</div>
    </main>
  </div>
}
