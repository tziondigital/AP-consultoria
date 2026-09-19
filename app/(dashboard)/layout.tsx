import { Sidebar } from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Search, ChevronDown, Menu } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await createClient();
  const {
    data: { user },
  } = await s.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: profile }, { count: unread }] = await Promise.all([
    s.from("usuarios").select("nome,perfil,email").eq("id", user.id).single(),
    s
      .from("notificacoes")
      .select("*", { count: "exact", head: true })
      .eq("usuario_id", user.id)
      .eq("lida", false),
  ]);
  const initials = (profile?.nome || profile?.email || "AP")
    .split(" ")
    .slice(0, 2)
    .map((x: string) => x[0])
    .join("")
    .toUpperCase();
  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <header className="topbar">
          <button className="menu-toggle" aria-label="Abrir ou fechar menu">
            <Menu size={19} />
          </button>
          <div className="global-search">
            <Search size={16} />
            <input placeholder="Buscar vagas, candidatos, empresas..." />
          </div>
          <div className="top-actions">
            <NotificationBell userId={user.id} unread={unread || 0} />
            <div className="avatar">{initials}</div>
            <div className="profile">
              <b>{profile?.nome || profile?.email}</b>
              <span>{profile?.perfil || "Usuário"}</span>
            </div>
            <ChevronDown size={15} />
            <em>“Conectando talentos, gerando valor.”</em>
          </div>
        </header>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
