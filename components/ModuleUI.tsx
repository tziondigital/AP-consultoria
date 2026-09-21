import type {LucideIcon} from 'lucide-react';
import type {HTMLAttributes,ReactNode} from 'react';

export function PageHeader({title,description,action}:{title:string;description:string;action?:React.ReactNode}){
  return <header className="module-header"><div><h1>{title}</h1><p>{description}</p></div>{action&&<div className="module-actions">{action}</div>}</header>;
}

export function Card({children,className='',...props}:HTMLAttributes<HTMLDivElement>&{children:ReactNode}){
  return <div className={`card ${className}`.trim()} {...props}>{children}</div>;
}

export function Badge({children,tone='neutral'}:{children:ReactNode;tone?:'success'|'warning'|'danger'|'neutral'|'brand'}){
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function DetailField({label,value}:{label:string;value?:ReactNode}){
  return <div className="detail-field"><span>{label}</span><strong>{value||'Não informado'}</strong></div>;
}

export function LoadingState({label='Carregando informações...'}:{label?:string}){
  return <div className="loading-state" role="status"><span aria-hidden="true"/>{label}</div>;
}

export function ErrorState({message='Não foi possível carregar as informações.'}:{message?:string}){
  return <div className="error-state" role="alert"><strong>Ocorreu um erro.</strong><span>{message}</span></div>;
}

export function KpiCard({label,value,note,Icon,tone='blue'}:{label:string;value:React.ReactNode;note:string;Icon:LucideIcon;tone?:'blue'|'green'|'yellow'|'red'}){
  return <div className="module-kpi"><span className={`module-kpi-icon ${tone}`}><Icon size={23}/></span><div><strong>{value}</strong><b>{label}</b><small>{note}</small></div></div>;
}

export function EmptyRow({colSpan,label}:{colSpan:number;label:string}){
  return <tr><td colSpan={colSpan}><div className="module-empty"><strong>Nenhum registro encontrado.</strong><span>{label}</span></div></td></tr>;
}

export function InitialAvatar({name,index=0}:{name:string;index?:number}){
  const colors=['#1568c4','#7646c8','#e59022','#0d9c69','#cf3e58','#294b7a'];
  const initials=name.split(' ').filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'AP';
  return <span className="initial-avatar" style={{background:colors[index%colors.length]}}>{initials}</span>;
}
