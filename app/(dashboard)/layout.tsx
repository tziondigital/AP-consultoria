import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: profile }, { count: unread }] = await Promise.all([
    s.from("usuarios").select("nome,perfil,email").eq("id", user.id).single(),
    s.from("notificacoes").select("*", { count: "exact", head: true }).eq("usuario_id", user.id).eq("lida", false),
  ]);
  const displayName = profile?.nome || profile?.email || "Usuário";
  const initials = displayName.split(" ").slice(0,2).map((x:string)=>x[0]).join("").toUpperCase();
  return <DashboardShell userId={user.id} unread={unread||0} initials={initials} name={displayName} role={profile?.perfil||"Usuário"}>{children}</DashboardShell>;
}