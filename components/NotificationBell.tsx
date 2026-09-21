"use client";
import Link from "next/link";
import {Bell} from "lucide-react";
import {useRouter} from "next/navigation";
import {useEffect} from "react";
import {createClient} from "@/lib/supabase/client";

export function NotificationBell({userId,unread}:{userId:string;unread:number}){
  const router=useRouter();
  useEffect(()=>{
    const s=createClient();
    const channel=s.channel(`notifications:${userId}`).on("postgres_changes",{
      event:"*",schema:"public",table:"notificacoes",filter:`usuario_id=eq.${userId}`,
    },()=>router.refresh()).subscribe();
    return()=>{void s.removeChannel(channel)};
  },[router,userId]);
  return <Link className="notification-bell" href="/notificacoes" aria-label={`${unread} notificações não lidas`}><Bell size={18}/>{unread>0&&<i>{unread>99?"99+":unread}</i>}</Link>;
}
