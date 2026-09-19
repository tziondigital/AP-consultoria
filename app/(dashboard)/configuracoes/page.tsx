import Link from 'next/link';
import {Bell,Users,Plug,Palette,ShieldCheck,Database,ScrollText} from 'lucide-react';
const options=[
  ['/notificacoes','Notificações','Preferências e central de notificações.',Bell],
  ['/usuarios','Permissões','Perfis, acessos e situação dos usuários.',Users],
  ['/integracoes','Integrações','Serviços e conexões utilizadas pelo sistema.',Plug],
  ['/personalizacao','Personalização','Padrão visual, textos e experiência do sistema.',Palette],
  ['/seguranca','Segurança','Sessão, autenticação e controles de segurança.',ShieldCheck],
  ['/backup','Backup','Exportação e conferência dos dados operacionais.',Database],
  ['/logs','Logs','Histórico de ações e rastreabilidade.',ScrollText]
] as const;
export default function Page(){return <section><h1 className="page-title">Configurações</h1><p className="muted">Central de administração e preferências da plataforma.</p><div className="settings-grid">{options.map(([href,title,desc,Icon])=><Link className="card settings-card" href={href} key={href}><Icon size={24}/><div><b>{title}</b><span>{desc}</span></div></Link>)}</div></section>}
