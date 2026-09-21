import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {userClient} from "../_shared/client.ts";

Deno.serve(async(req)=>{
  if(req.method!=="POST")return Response.json({error:"method_not_allowed"},{status:405});
  const s=userClient(req);
  const{data:{user}}=await s.auth.getUser();
  if(!user)return Response.json({error:"unauthorized"},{status:401});
  const{entrevista_id}=await req.json();
  if(!entrevista_id)return Response.json({error:"entrevista_id_required"},{status:400});
  const{data:e,error}=await s.from("entrevistas").select("id,data,link,candidatos(nome,email),vagas(cargo,empresas(nome))").eq("id",entrevista_id).single();
  if(error||!e)return Response.json({error:error?.message||"not_found"},{status:404});
  const c:any=e.candidatos,v:any=e.vagas;
  if(!c?.email)return Response.json({error:"candidate_email_missing"},{status:422});
  const apiKey=Deno.env.get("RESEND_API_KEY"),from=Deno.env.get("EMAIL_FROM");
  if(!apiKey||!from)return Response.json({error:"email_connector_not_configured"},{status:503});
  const when=new Date(e.data).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"});
  const link=e.link?`<p><a href="${e.link}">Acessar entrevista</a></p>`:"";
  const html=`<h2>Entrevista agendada</h2><p>Olá, ${c.nome}.</p><p>Sua entrevista para <strong>${v.cargo}</strong> foi agendada para ${when}.</p>${link}<p>AP Consultoria</p>`;
  const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${apiKey}`},body:JSON.stringify({from,to:[c.email],subject:`Entrevista - ${v.cargo}`,html})});
  if(!response.ok)return new Response(await response.text(),{status:502});
  const{error:updateError}=await s.from("entrevistas").update({email_enviado:true,email_enviado_em:new Date().toISOString()}).eq("id",entrevista_id);
  if(updateError)return Response.json({error:updateError.message},{status:500});
  return Response.json({ok:true});
});
