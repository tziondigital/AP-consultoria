import type {LucideIcon} from 'lucide-react';

export function PageHeader({title,description,action}:{title:string;description:string;action?:React.ReactNode}){
  return <header className="module-header"><div><h1>{title}</h1><p>{description}</p></div>{action&&<div className="module-actions">{action}</div>}</header>;
}

export function KpiCard({label,value,note,Icon,tone='blue'}:{label:string;value:React.ReactNode;note:string;Icon:LucideIcon;tone?:'blue'|'green'|'yellow'|'red'}){
  return <div className="module-kpi"><span className={`module-kpi-icon ${tone}`}><Icon size={23}/></span><div><strong>{value}</strong><b>{label}</b><small>{note}</small></div></div>;
}

export function EmptyRow({colSpan,label}:{colSpan:number;label:string}){
  return <tr><td colSpan={colSpan}><div className="module-empty">{label}</div></td></tr>;
}

export function InitialAvatar({name,index=0}:{name:string;index?:number}){
  const colors=['#1568c4','#7646c8','#e59022','#0d9c69','#cf3e58','#294b7a'];
  const initials=name.split(' ').filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'AP';
  return <span className="initial-avatar" style={{background:colors[index%colors.length]}}>{initials}</span>;
}
