import {DashboardShell} from '@/components/DashboardShell';
import {createClient} from '@/lib/supabase/server';
import {redirect} from 'next/navigation';
import {label} from '@/lib/format';

export default async function DashboardLayout({children}:{children:React.ReactNode}){
  const s=await createClient();
  const{data:{user}}=await s.auth.getUser();
  if(!user)redirect('/login');
  const{data:profile}=await s.from('usuarios').select('nome,perfil,email').eq('id',user.id).single();
  const displayName=profile?.nome||profile?.email||'AP Consultoria';
  const initials=displayName.split(' ').filter(Boolean).slice(0,2).map((x:string)=>x[0]).join('').toUpperCase();
  return <DashboardShell initials={initials} name={displayName} role={label(profile?.perfil||'usuario')}>{children}</DashboardShell>
}
